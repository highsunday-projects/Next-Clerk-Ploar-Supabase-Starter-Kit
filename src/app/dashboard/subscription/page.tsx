'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Crown,
  Check,
  CreditCard,
  Calendar,
  AlertCircle,
  Star,
  Loader2
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { SUBSCRIPTION_PLANS } from '@/types/supabase';
import {
  getSubscriptionStatusText,
  getSubscriptionStatusClass,
  formatPrice,
  formatBillingInfo,
  canManagePayment,
  canCancelSubscription,
  getPlanChangeType
} from '@/lib/subscriptionUtils';

export default function SubscriptionPage() {
  const { user, isLoaded } = useUser();
  const { profile, loading, error } = useUserProfile();
  const router = useRouter();
  const [upgrading, setUpgrading] = useState<string | null>(null); // 追蹤正在升級的方案

  // 重定向未登入用戶
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // 處理 Polar Checkout 回調
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success === 'true') {
      // 付款成功，顯示成功訊息並清理 URL
      alert('付款成功！您的訂閱已升級，請稍等片刻讓系統同步資料。');
      window.history.replaceState({}, '', '/dashboard/subscription');
    } else if (canceled === 'true') {
      // 付款取消，顯示取消訊息並清理 URL
      alert('付款已取消，您可以隨時重新嘗試升級。');
      window.history.replaceState({}, '', '/dashboard/subscription');
    }

    // 重置升級狀態
    setUpgrading(null);
  }, []);

  // 載入中狀態
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">載入訂閱資料中...</p>
        </div>
      </div>
    );
  }

  // 用戶未登入
  if (!user) {
    return null;
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">載入訂閱資料時發生錯誤</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // 如果沒有訂閱資料，顯示預設免費方案
  if (!profile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-400 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">找不到訂閱資料</h3>
            <p className="text-sm text-yellow-700 mt-1">請重新整理頁面或聯繫客服支援</p>
          </div>
        </div>
      </div>
    );
  }

  // 獲取當前訂閱方案資訊
  const currentPlan = SUBSCRIPTION_PLANS[profile.subscription_plan];

  // 當前訂閱資料
  const currentSubscription = {
    plan: currentPlan.displayName,
    price: currentPlan.price,
    period: 'month',
    status: profile.subscription_status,
    nextBilling: profile.trial_ends_at ?
      new Date(profile.trial_ends_at).toLocaleDateString('zh-TW') :
      '無限期（免費方案）',
    paymentMethod: profile.subscription_plan === 'free' ? '無需付款' : '**** **** **** 4242',
    features: currentPlan.features,
    monthlyLimit: currentPlan.monthlyUsageLimit
  };

  // 可用的訂閱方案（基於 Supabase 配置）
  const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.displayName,
    price: plan.price,
    period: 'month',
    description: key === 'free' ? '適合個人使用和小型專案' :
                 key === 'pro' ? '適合成長中的團隊和企業' :
                 '適合大型企業和高流量應用',
    features: plan.features,
    current: profile.subscription_plan === key,
    popular: plan.popular || false,
    monthlyLimit: plan.monthlyUsageLimit
  }));

  // 處理方案升級
  const handlePlanUpgrade = async (planId: string) => {
    if (planId === 'free' || planId === profile.subscription_plan) {
      return; // 不處理免費方案或相同方案
    }

    try {
      setUpgrading(planId);

      // 呼叫 Polar Checkout API
      const response = await fetch('/api/polar/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          userId: user?.id,
          successUrl: `${window.location.origin}/dashboard/subscription?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/subscription?canceled=true`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '建立付費流程失敗');
      }

      // 重定向到 Polar Checkout 頁面
      window.location.href = data.checkoutUrl;

    } catch (error) {
      console.error('Error creating checkout:', error);
      alert(error instanceof Error ? error.message : '升級失敗，請稍後再試');
      setUpgrading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">訂閱管理</h1>
        <p className="text-gray-600">
          管理您的訂閱方案、付費方式和帳單資訊
        </p>
      </div>

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            目前訂閱
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionStatusClass(profile.subscription_status)}`}>
            {getSubscriptionStatusText(profile.subscription_status)}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-baseline mb-2">
              <span className="text-3xl font-bold text-gray-900">{currentSubscription.plan}</span>
              <span className="ml-2 text-lg text-gray-600">
                {formatPrice(currentSubscription.price)}{currentSubscription.price > 0 ? '/月' : ''}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {formatBillingInfo(profile)}
              </div>
              <div className="flex items-center text-gray-600">
                <CreditCard className="w-4 h-4 mr-2" />
                付款方式：{currentSubscription.paymentMethod}
              </div>
              <div className="flex items-center text-gray-600">
                <Star className="w-4 h-4 mr-2" />
                每月額度：{currentSubscription.monthlyLimit?.toLocaleString()} 次 API 呼叫
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">包含功能：</h4>
              <ul className="space-y-1">
                {currentSubscription.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-3">
            {canManagePayment(profile) && (
              <button
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                onClick={() => alert('付款方式管理功能將在未來版本中提供')}
              >
                更新付款方式
              </button>
            )}

            {profile.subscription_plan !== 'free' && (
              <button
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                onClick={() => alert('發票下載功能將在未來版本中提供')}
              >
                下載發票
              </button>
            )}

            {canCancelSubscription(profile) && (
              <button
                className="w-full border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors duration-200"
                onClick={() => {
                  if (confirm('確定要取消訂閱嗎？此操作將在當前計費週期結束時生效。')) {
                    alert('取消訂閱功能將在未來版本中提供');
                  }
                }}
              >
                取消訂閱
              </button>
            )}

            {profile.subscription_plan === 'free' && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">
                  您目前使用免費方案，無需付款管理
                </p>
              </div>
            )}

            {profile.subscription_status === 'cancelled' && (
              <div className="text-center py-4">
                <p className="text-sm text-red-600 font-medium">
                  訂閱已取消
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  您可以重新訂閱任何方案
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">變更訂閱方案</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative border-2 rounded-lg p-6 transition-all duration-200 ${
                plan.current 
                  ? 'border-blue-500 bg-blue-50' 
                  : plan.popular
                  ? 'border-purple-500 hover:border-purple-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && !plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    推薦
                  </span>
                </div>
              )}

              {plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    目前方案
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price === 0 ? '免費' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-600 ml-1">
                      /{plan.period === 'month' ? '月' : '年'}
                    </span>
                  )}
                </div>
                {plan.monthlyLimit && (
                  <p className="text-xs text-gray-500 mt-1">
                    每月 {plan.monthlyLimit.toLocaleString()} 次 API 呼叫
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="text-sm text-gray-600 flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.current || profile.subscription_status === 'cancelled' || upgrading === plan.id}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  plan.current
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : profile.subscription_status === 'cancelled'
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : upgrading === plan.id
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.price > currentSubscription.price
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : plan.price === 0
                    ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'border border-orange-300 text-orange-700 hover:bg-orange-50'
                }`}
                onClick={() => {
                  if (!plan.current && profile.subscription_status !== 'cancelled' && upgrading !== plan.id) {
                    const changeType = getPlanChangeType(profile.subscription_plan, plan.id as any);

                    if (changeType === 'upgrade' && plan.id !== 'free') {
                      // 使用 Polar Checkout 進行升級
                      handlePlanUpgrade(plan.id);
                    } else if (changeType === 'downgrade' && plan.id === 'free') {
                      // 降級到免費方案的處理（未來實作）
                      alert('降級到免費方案功能即將推出');
                    } else {
                      // 其他變更類型
                      const actionText = changeType === 'upgrade' ? '升級' :
                                       changeType === 'downgrade' ? '降級' : '變更';
                      alert(`${actionText}功能即將推出`);
                    }
                  }
                }}
              >
                {upgrading === plan.id ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    處理中...
                  </div>
                ) : plan.current ? (
                  '目前方案'
                ) : profile.subscription_status === 'cancelled' ? (
                  '訂閱已取消'
                ) : (() => {
                    const changeType = getPlanChangeType(profile.subscription_plan, plan.id as any);
                    return changeType === 'upgrade' ? '升級' :
                           changeType === 'downgrade' ? (plan.price === 0 ? '降級至免費' : '降級') :
                           '變更';
                  })()
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">計費說明</h3>
            <p className="text-sm text-yellow-700 mt-1">
              方案變更將在下個計費週期生效。如果您升級方案，將立即按比例收費。
              如果您降級方案，變更將在當前計費週期結束時生效。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
