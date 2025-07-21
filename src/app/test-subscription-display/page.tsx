'use client';

import React from 'react';
import { Calendar, Crown, Check, AlertCircle } from 'lucide-react';
import {
  formatBillingInfo,
  getSubscriptionStatusText,
  getSubscriptionStatusClass
} from '@/lib/subscriptionUtils';
import {
  isAutoRenewing,
  isWillExpire,
  getUserStatusDescription
} from '@/types/supabase';
import type { UserProfile } from '@/types/supabase';

/**
 * 測試頁面：展示 SF10 簡化版的訂閱狀態顯示功能
 * 特別展示續訂日期的顯示效果
 */
export default function TestSubscriptionDisplay() {
  // 模擬不同狀態的用戶資料
  const testUsers: UserProfile[] = [
    {
      id: '1',
      clerk_user_id: 'test_1',
      subscription_plan: 'pro',
      subscription_status: 'active_recurring',
      monthly_usage_limit: 10000,
      last_active_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      polar_customer_id: 'cust_123',
      polar_subscription_id: 'sub_123',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天後
    },
    {
      id: '2',
      clerk_user_id: 'test_2',
      subscription_plan: 'pro',
      subscription_status: 'active_ending',
      monthly_usage_limit: 10000,
      last_active_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      polar_customer_id: 'cust_456',
      polar_subscription_id: 'sub_456',
      current_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天後
    },
    {
      id: '3',
      clerk_user_id: 'test_3',
      subscription_plan: null,
      subscription_status: 'inactive',
      monthly_usage_limit: 1000,
      last_active_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  const renderSubscriptionCard = (profile: UserProfile, title: string) => (
    <div key={profile.id} className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Crown className="w-5 h-5 mr-2 text-yellow-500" />
          {title}
        </h3>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionStatusClass(profile.subscription_status)}`}>
            {getSubscriptionStatusText(profile.subscription_status)}
          </span>
          <div className="text-xs text-gray-500 mt-1">
            {getUserStatusDescription(profile)}
          </div>
        </div>
      </div>

      {/* 狀態提示 */}
      {isWillExpire(profile) && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              您的訂閱將在 {profile.current_period_end ? new Date(profile.current_period_end).toLocaleDateString('zh-TW') : '計費週期結束時'} 到期。
              如需繼續使用專業版功能，請重新啟用自動續訂。
            </span>
          </div>
        </div>
      )}

      {isAutoRenewing(profile) && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <Check className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800">
              您的專業版訂閱將自動續訂，無需任何操作。
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3 text-sm">
        <div className="flex items-center text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <strong className="text-blue-600">{formatBillingInfo(profile)}</strong>
        </div>
        <div className="text-gray-600">
          方案：{profile.subscription_plan === 'pro' ? '專業版' : '基礎用戶'}
        </div>
        <div className="text-gray-600">
          每月額度：{profile.monthly_usage_limit?.toLocaleString()} 次 API 呼叫
        </div>
        {profile.current_period_end && (
          <div className="text-gray-600">
            週期結束：{new Date(profile.current_period_end).toLocaleDateString('zh-TW')}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            SF10 訂閱狀態顯示測試
          </h1>
          <p className="text-gray-600">
            展示簡化版的訂閱狀態顯示功能，特別是續訂日期的顯示效果
          </p>
        </div>

        <div className="grid md:grid-cols-1 gap-6">
          {renderSubscriptionCard(testUsers[0], '會自動續訂的專業版用戶')}
          {renderSubscriptionCard(testUsers[1], '即將到期的專業版用戶')}
          {renderSubscriptionCard(testUsers[2], '基礎用戶')}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            SF10 簡化版特色
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
              <div>
                <strong>會自動續訂 (active_recurring)</strong>：顯示「下次計費：[日期]」
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
              <div>
                <strong>即將到期 (active_ending)</strong>：顯示「專業版將於 [日期] 到期」
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
              <div>
                <strong>未訂閱 (inactive)</strong>：顯示「基礎用戶（無限期）」
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
              <div>
                <strong>狀態簡化</strong>：從 6 個狀態簡化為 3 個清晰的枚舉值
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
              <div>
                <strong>程式碼簡化</strong>：移除 cancel_at_period_end 欄位，直接使用狀態枚舉
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/dashboard/subscription" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            查看實際訂閱管理頁面
          </a>
        </div>
      </div>
    </div>
  );
}
