/**
 * 訂閱管理工具函數 - SF09 簡化版
 *
 * 基於單一產品邏輯，僅通過訂閱狀態來區分用戶權限
 */

import type { UserProfile, SubscriptionStatus } from '@/types/supabase';
import { hasProAccess, getUserConfig } from '@/types/supabase';

/**
 * 檢查用戶是否可以升級到專業版
 */
export function canUpgradeToPro(profile: UserProfile): boolean {
  return !hasProAccess(profile);
}

/**
 * 檢查用戶是否可以取消訂閱
 */
export function canCancelSubscription(profile: UserProfile): boolean {
  return hasProAccess(profile);
}

/**
 * 獲取訂閱變更類型
 */
export function getSubscriptionChangeType(profile: UserProfile): 'upgrade' | 'cancel' | 'none' {
  if (canUpgradeToPro(profile)) {
    return 'upgrade';
  } else if (canCancelSubscription(profile)) {
    return 'cancel';
  } else {
    return 'none';
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
  return hasProAccess(profile);
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
    case 'inactive':
      return '未訂閱';
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
    case 'inactive':
      return 'bg-gray-100 text-gray-600';
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
  if (!hasProAccess(profile)) {
    return '基礎用戶（無限期）';
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

  // 對於付費方案，顯示下次計費日期
  if (profile.current_period_end) {
    return `下次計費：${new Date(profile.current_period_end).toLocaleDateString('zh-TW')}`;
  }

  return '專業版用戶';
}

/**
 * 獲取用戶顯示名稱
 */
export function getUserDisplayName(profile: UserProfile): string {
  return hasProAccess(profile) ? '專業版用戶' : '基礎用戶';
}

/**
 * 檢查是否需要顯示升級提示
 */
export function shouldShowUpgradePrompt(profile: UserProfile): boolean {
  return !hasProAccess(profile);
}

/**
 * 獲取用戶權限描述
 */
export function getUserPermissionDescription(profile: UserProfile): string {
  const config = getUserConfig(profile);
  return `${config.displayName} - ${config.features[0]}`;
}

/**
 * 檢查用戶是否有特定功能權限
 */
export function hasFeatureAccess(profile: UserProfile, feature: string): boolean {
  const config = getUserConfig(profile);
  return (config.features as readonly string[]).includes(feature);
}


