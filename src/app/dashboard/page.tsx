'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Crown,
  Loader2
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { SUBSCRIPTION_PLANS } from '@/types/supabase';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { profile, loading, error } = useUserProfile();
  const router = useRouter();

  // 重定向未登入用戶
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // 載入中狀態
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">載入中...</p>
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
            <div className="w-5 h-5 text-red-400">⚠️</div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">載入訂閱資料時發生錯誤</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // 獲取當前訂閱方案資訊
  const currentPlan = profile ? SUBSCRIPTION_PLANS[profile.subscription_plan] : SUBSCRIPTION_PLANS.free;





  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-semibold text-blue-600">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                歡迎回來，{user.firstName || '用戶'}！
              </h1>
              <p className="text-gray-600">
                管理您的訂閱和查看使用統計
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              profile?.subscription_status === 'active'
                ? 'bg-green-100 text-green-800'
                : profile?.subscription_status === 'trial'
                ? 'bg-blue-100 text-blue-800'
                : profile?.subscription_status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {profile?.subscription_status === 'active' ? '訂閱中' :
               profile?.subscription_status === 'trial' ? '試用中' :
               profile?.subscription_status === 'cancelled' ? '已取消' : '已過期'}
            </span>
          </div>
        </div>
      </div>

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            目前訂閱方案
          </h2>
          <Link
            href="/dashboard/subscription"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            管理訂閱 →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">{currentPlan.displayName}</span>
              <span className="ml-2 text-lg text-gray-600">
                {currentPlan.price === 0 ? '免費' : `$${currentPlan.price}/月`}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {profile?.trial_ends_at ?
                `試用期至：${new Date(profile.trial_ends_at).toLocaleDateString('zh-TW')}` :
                profile?.subscription_status === 'active' ? '訂閱中' : '免費方案'
              }
            </p>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">包含功能：</h4>
              <ul className="space-y-1">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                每月使用額度：{currentPlan.monthlyUsageLimit.toLocaleString()} 次 API 呼叫
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 ${
                profile?.subscription_plan === 'enterprise'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                  : profile?.subscription_plan === 'pro'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                  : 'bg-gradient-to-br from-gray-400 to-gray-600'
              }`}>
                <Crown className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm text-gray-600">
                {profile?.subscription_plan === 'enterprise'
                  ? '享受企業版的所有功能'
                  : profile?.subscription_plan === 'pro'
                  ? '享受專業版的所有功能'
                  : '免費方案基本功能'
                }
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            快速操作
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/subscription"
              className="block w-full text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex flex-col items-center">
                <CreditCard className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">管理訂閱</p>
                <p className="text-sm text-gray-500 mt-1">升級或管理方案</p>
              </div>
            </Link>
            <Link
              href="/dashboard/profile"
              className="block w-full text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex flex-col items-center">
                <Crown className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">個人資料</p>
                <p className="text-sm text-gray-500 mt-1">管理帳戶設定</p>
              </div>
            </Link>
            <button className="w-full text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex flex-col items-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">API 文檔</p>
                <p className="text-sm text-gray-500 mt-1">查看使用指南</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
