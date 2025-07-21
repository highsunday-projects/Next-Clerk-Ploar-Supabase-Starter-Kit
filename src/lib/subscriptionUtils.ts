/**
 * 訂閱管理工具函數 - SF09 簡化版
 *
 * 基於單一產品邏輯，僅通過訂閱狀態來區分用戶權限
 */

import type { UserProfile, SubscriptionStatus } from '@/types/supabase';
import {
  hasProAccess,
  getUserConfig,
  getUserStatusDescription
} from '@/types/supabase';

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
 * 檢查訂閱狀態是否為活躍 - SF10 簡化版
 */
export function isActiveSubscription(status: SubscriptionStatus): boolean {
  return status === 'active_recurring' || status === 'active_ending';
}

/**
 * 檢查是否可以管理付款方式
 */
export function canManagePayment(profile: UserProfile): boolean {
  return hasProAccess(profile);
}

/**
 * 獲取訂閱狀態顯示文字 - SF10 簡化版
 */
export function getSubscriptionStatusText(status: SubscriptionStatus): string {
  switch (status) {
    case 'active_recurring':
      return '訂閱中 (會續訂)';
    case 'active_ending':
      return '訂閱中 (即將到期)';
    case 'inactive':
      return '免費版';
    default:
      return '未知狀態';
  }
}

/**
 * 獲取訂閱狀態樣式類別 - SF10 簡化版
 */
export function getSubscriptionStatusClass(status: SubscriptionStatus): string {
  switch (status) {
    case 'active_recurring':
      return 'bg-green-100 text-green-800';
    case 'active_ending':
      return 'bg-yellow-100 text-yellow-800';
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
 * 格式化計費週期顯示 - SF10 簡化版：基於新的 3 種狀態
 */
export function formatBillingInfo(profile: UserProfile): string {
  if (!hasProAccess(profile)) {
    return '基礎用戶（無限期）';
  }

  // SF10: 基於新的簡化狀態邏輯
  switch (profile.subscription_status) {
    case 'active_recurring':
      // 會續訂狀態
      if (profile.current_period_end) {
        return `下次計費：${new Date(profile.current_period_end).toLocaleDateString('zh-TW')}`;
      }
      return '專業版（自動續訂）';

    case 'active_ending':
      // 會到期狀態
      if (profile.current_period_end) {
        return `專業版將於 ${new Date(profile.current_period_end).toLocaleDateString('zh-TW')} 到期`;
      }
      return '專業版（已安排取消）';

    case 'inactive':
      return '基礎用戶（無限期）';

    default:
      return '未知狀態';
  }
}

/**
 * 獲取用戶顯示名稱 - 根據三種狀態提供詳細描述
 */
export function getUserDisplayName(profile: UserProfile): string {
  return getUserStatusDescription(profile);
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


