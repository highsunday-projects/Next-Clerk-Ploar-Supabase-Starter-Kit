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
import { SUBSCRIPTION_CONFIG, hasProAccess, getUserConfig } from '@/types/supabase';
import {
  getSubscriptionStatusText,
  getSubscriptionStatusClass,
  formatBillingInfo,
  canManagePayment,
  canCancelSubscription,
  formatPrice
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

  // SF09: 獲取當前用戶配置
  const currentConfig = getUserConfig(profile);
  const isProUser = hasProAccess(profile);

  // 當前訂閱資料
  const currentSubscription = {
    plan: currentConfig.displayName,
    price: currentConfig.price,
    period: 'month',
    status: profile.subscription_status,
    nextBilling: profile.trial_ends_at ?
      new Date(profile.trial_ends_at).toLocaleDateString('zh-TW') :
      isProUser ? formatBillingInfo(profile) : '無限期（基礎用戶）',
    paymentMethod: isProUser ? '**** **** **** 4242' : '無需付款',
    features: currentConfig.features,
    monthlyLimit: currentConfig.monthlyUsageLimit
  };

  // SF09: 簡化方案邏輯 - 只顯示升級選項
  const plans = isProUser ? [] : [{
    id: 'pro',
    name: SUBSCRIPTION_CONFIG.pro.displayName,
    price: SUBSCRIPTION_CONFIG.pro.price,
    period: 'month',
    description: '適合成長中的團隊和企業',
    features: SUBSCRIPTION_CONFIG.pro.features,
    current: false,
    popular: true,
    monthlyLimit: SUBSCRIPTION_CONFIG.pro.monthlyUsageLimit
  }];

  // SF09: 處理專業版升級
  const handlePlanUpgrade = async (planId: string) => {
    if (planId !== 'pro' || isProUser) {
      return; // 不處理免費方案或相同方案
    }

    // 確認升級
    const confirmed = confirm(
      '您確定要升級到專業版嗎？\n\n' +
      '升級後您將享受更多功能和更高的使用額度。'
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpgrading(planId);

      // 呼叫 Polar Checkout/Update API
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
        throw new Error(data.error || '處理訂閱請求失敗');
      }

      // 檢查響應類型
      if (data.success && data.message) {
        // 訂閱更新成功（現有用戶）
        alert(data.message);
        // 重新載入頁面以更新訂閱資訊
        window.location.reload();
      } else if (data.checkoutUrl) {
        // 需要重定向到 Checkout 頁面（新用戶）
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('未知的響應格式');
      }

    } catch (error) {
      console.error('Error processing subscription:', error);
      alert(error instanceof Error ? error.message : '處理訂閱請求失敗，請稍後再試');
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

            {isProUser && (
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

            {!isProUser && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">
                  您目前是基礎用戶，無需付款管理
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

      {/* Upgrade to Pro Section - Only for non-pro users */}
      {!isProUser && (
        <div className="relative bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6 overflow-hidden">
          {/* Eye-catching badge */}
          <div className="absolute -top-1 -right-1">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-medium animate-pulse">
              ⚡ 推薦升級
            </div>
          </div>

          {/* Header with enhanced visual appeal */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center mb-2">
                <Crown className="w-6 h-6 mr-2 text-yellow-500" />
                升級到專業版
              </h2>
              <p className="text-blue-600 font-medium">🚀 10倍功能提升，讓效率翻倍！</p>
            </div>
            <div className="text-right">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-blue-600">$5</span>
                  <span className="text-gray-600 ml-1">/月</span>
                </div>
                <p className="text-xs text-blue-500 font-medium">💰 限時優惠 50% OFF</p>
              </div>
            </div>
          </div>

          {/* Enhanced value proposition */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-100">
            <p className="text-gray-700 text-center font-medium">
              ✨ 專業版用戶平均提升 <span className="text-blue-600 font-bold">300%</span> 工作效率
            </p>
          </div>

          {/* Enhanced Benefits Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                目前 - 基礎用戶
              </h4>
              <ul className="space-y-2">
                <li className="text-sm text-gray-600 flex items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-300 mr-2 flex-shrink-0"></div>
                  每月 1,000 次 API 呼叫
                </li>
                <li className="text-sm text-gray-600 flex items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-300 mr-2 flex-shrink-0"></div>
                  基本功能存取
                </li>
                <li className="text-sm text-gray-600 flex items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-300 mr-2 flex-shrink-0"></div>
                  社群支援
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                升級後 - 專業版 ⭐
              </h4>
              <ul className="space-y-2">
                <li className="text-sm text-gray-700 flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span><strong>10,000 次</strong> API 呼叫 <span className="text-green-600">(+900%)</span></span>
                </li>
                <li className="text-sm text-gray-700 flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <strong>所有進階功能</strong>
                </li>
                <li className="text-sm text-gray-700 flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <strong>24小時優先支援</strong>
                </li>
                <li className="text-sm text-gray-700 flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <strong>詳細數據分析</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              disabled={upgrading === 'pro'}
              className={`flex-1 py-3 px-6 rounded-lg font-bold text-lg transition-all duration-300 transform ${
                upgrading === 'pro'
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
              onClick={() => {
                if (upgrading !== 'pro') {
                  handlePlanUpgrade('pro');
                }
              }}
            >
              {upgrading === 'pro' ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  處理中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Crown className="w-5 h-5 mr-2" />
                  🚀 立即升級 - 只要 $5/月
                </div>
              )}
            </button>
            
            <button
              className="sm:w-auto px-4 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
              onClick={() => alert('功能比較詳情將在未來版本中提供')}
            >
              💡 了解更多功能
            </button>
          </div>

          {/* Enhanced Trust Indicators */}
          <div className="mt-6 pt-4 border-t border-blue-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs text-gray-600">30天保證</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs text-gray-600">隨時取消</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-1">
                  <Star className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs text-gray-600">即時生效</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
