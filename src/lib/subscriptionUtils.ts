/**
 * 訂閱管理工具函數
 * 
 * 提供訂閱相關的工具函數，包含方案比較、狀態檢查等功能
 */

import type { UserProfile, SubscriptionPlan, SubscriptionStatus } from '@/types/supabase';
import { SUBSCRIPTION_PLANS } from '@/types/supabase';

/**
 * 檢查是否可以升級到指定方案
 */
export function canUpgradeTo(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
  const currentPrice = SUBSCRIPTION_PLANS[currentPlan].price;
  const targetPrice = SUBSCRIPTION_PLANS[targetPlan].price;
  return targetPrice > currentPrice;
}

/**
 * 檢查是否可以降級到指定方案
 */
export function canDowngradeTo(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
  const currentPrice = SUBSCRIPTION_PLANS[currentPlan].price;
  const targetPrice = SUBSCRIPTION_PLANS[targetPlan].price;
  return targetPrice < currentPrice;
}

/**
 * 獲取方案變更類型
 */
export function getPlanChangeType(
  currentPlan: SubscriptionPlan, 
  targetPlan: SubscriptionPlan
): 'upgrade' | 'downgrade' | 'same' {
  if (canUpgradeTo(currentPlan, targetPlan)) {
    return 'upgrade';
  } else if (canDowngradeTo(currentPlan, targetPlan)) {
    return 'downgrade';
  } else {
    return 'same';
  }
}

/**
 * 檢查訂閱狀態是否為活躍
 */
export function isActiveSubscription(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trial';
}

/**
 * 檢查是否可以管理付款方式
 */
export function canManagePayment(profile: UserProfile): boolean {
  return profile.subscription_plan !== 'free' && isActiveSubscription(profile.subscription_status);
}

/**
 * 檢查是否可以取消訂閱
 */
export function canCancelSubscription(profile: UserProfile): boolean {
  return profile.subscription_plan !== 'free' && profile.subscription_status === 'active';
}

/**
 * 獲取訂閱狀態顯示文字
 */
export function getSubscriptionStatusText(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return '使用中';
    case 'trial':
      return '試用中';
    case 'cancelled':
      return '已取消';
    case 'expired':
      return '已過期';
    default:
      return '未知狀態';
  }
}

/**
 * 獲取訂閱狀態樣式類別
 */
export function getSubscriptionStatusClass(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'trial':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'expired':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * 格式化價格顯示
 */
export function formatPrice(price: number): string {
  return price === 0 ? '免費' : `$${price}`;
}

/**
 * 格式化計費週期顯示
 */
export function formatBillingInfo(profile: UserProfile): string {
  if (profile.subscription_plan === 'free') {
    return '免費方案（無限期）';
  }
  
  if (profile.subscription_status === 'trial' && profile.trial_ends_at) {
    return `試用期至：${new Date(profile.trial_ends_at).toLocaleDateString('zh-TW')}`;
  }
  
  if (profile.subscription_status === 'cancelled') {
    return '訂閱已取消';
  }
  
  if (profile.subscription_status === 'expired') {
    return '訂閱已過期';
  }
  
  // 對於付費方案，顯示下次計費日期（這裡使用模擬資料）
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  return `下次計費：${nextBilling.toLocaleDateString('zh-TW')}`;
}

/**
 * 檢查是否需要顯示升級提示
 */
export function shouldShowUpgradePrompt(profile: UserProfile): boolean {
  return profile.subscription_plan === 'free' && profile.subscription_status === 'active';
}

/**
 * 獲取推薦的升級方案
 */
export function getRecommendedUpgrade(currentPlan: SubscriptionPlan): SubscriptionPlan | null {
  switch (currentPlan) {
    case 'free':
      return 'pro';
    case 'pro':
      return 'enterprise';
    case 'enterprise':
      return null;
    default:
      return null;
  }
}
