/**
 * Supabase 資料庫類型定義
 * 
 * 此檔案定義了與 Supabase 資料庫相關的 TypeScript 類型，
 * 包含用戶訂閱資料的介面和相關類型。
 */

// 訂閱方案類型 - 簡化為單一產品邏輯
export type SubscriptionPlan = 'pro' | null;

// 訂閱狀態類型 - 簡化版 (SF10)
export type SubscriptionStatus = 'active_recurring' | 'active_ending' | 'inactive';

// 用戶訂閱資料介面
export interface UserProfile {
  id: string;
  clerk_user_id: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  monthly_usage_limit: number;
  trial_ends_at?: string;
  last_active_date: string;
  created_at: string;
  updated_at: string;
  // Polar 整合相關欄位 - SF10 簡化版：移除 cancel_at_period_end
  polar_customer_id?: string;
  polar_subscription_id?: string;
  current_period_end?: string;
}

// 建立用戶訂閱記錄的請求參數
export interface CreateUserProfileRequest {
  clerkUserId: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  monthlyUsageLimit?: number;
  trialEndsAt?: string;
  polarCustomerId?: string;
  polarSubscriptionId?: string;
  currentPeriodEnd?: string;
}

// 更新用戶訂閱記錄的請求參數
export interface UpdateUserProfileRequest {
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  monthlyUsageLimit?: number;
  trialEndsAt?: string;
  lastActiveDate?: string;
  polarCustomerId?: string;
  polarSubscriptionId?: string;
  currentPeriodEnd?: string;
}

// API 回應格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 用戶訂閱資料 API 回應
export type UserProfileResponse = ApiResponse<UserProfile>;

// 訂閱方案配置
export interface SubscriptionPlanConfig {
  name: string;
  displayName: string;
  monthlyUsageLimit: number;
  price: number;
  features: string[];
  popular?: boolean;
}

// 訂閱方案配置 - 簡化為單一產品邏輯
export const SUBSCRIPTION_CONFIG = {
  // 未訂閱用戶的預設配置
  unsubscribed: {
    displayName: '基礎用戶',
    monthlyUsageLimit: 1000,
    price: 0,
    features: [
      '每月 1,000 次 API 呼叫',
      '基本功能存取',
      '社群支援'
    ]
  },
  // 專業版訂閱配置
  pro: {
    name: 'pro',
    displayName: '專業版用戶',
    monthlyUsageLimit: 10000,
    price: 5,
    features: [
      '每月 10,000 次 API 呼叫',
      '進階功能存取',
      '優先支援',
      '詳細分析報告'
    ],
    popular: true
  }
} as const;

// 權限檢查輔助函數 - SF10 簡化版：基於新的 3 欄位結構
export function hasProAccess(user: UserProfile): boolean {
  // 檢查基本條件：必須是專業版
  if (user.subscription_plan !== 'pro') {
    return false;
  }

  // 檢查訂閱狀態：只有 active_recurring 和 active_ending 有權限
  const activeStatuses: SubscriptionStatus[] = ['active_recurring', 'active_ending'];
  if (!activeStatuses.includes(user.subscription_status)) {
    return false;
  }

  // 檢查訂閱是否還在有效期內
  if (user.current_period_end) {
    const currentTime = new Date();
    const periodEnd = new Date(user.current_period_end);

    // 如果已過期，則無權限
    if (periodEnd <= currentTime) {
      return false;
    }
  }

  // 所有檢查都通過，用戶有專業版權限
  return true;
}

// 獲取用戶配置
export function getUserConfig(user: UserProfile) {
  return hasProAccess(user)
    ? SUBSCRIPTION_CONFIG.pro
    : SUBSCRIPTION_CONFIG.unsubscribed;
}

// 用戶訂閱狀態類型
export type UserSubscriptionStatus = 'subscribed' | 'unsubscribed';

// 獲取用戶訂閱狀態
export function getUserSubscriptionStatus(user: UserProfile): UserSubscriptionStatus {
  return hasProAccess(user) ? 'subscribed' : 'unsubscribed';
}

// 檢查用戶是否為「會續訂」狀態 - SF10 簡化版
export function isAutoRenewing(user: UserProfile): boolean {
  return user.subscription_status === 'active_recurring' && hasProAccess(user);
}

// 檢查用戶是否為「會到期」狀態 - SF10 簡化版
export function isWillExpire(user: UserProfile): boolean {
  return user.subscription_status === 'active_ending' && hasProAccess(user);
}

// 檢查用戶是否為「免費版」狀態 - SF10 簡化版
export function isFreeUser(user: UserProfile): boolean {
  return user.subscription_status === 'inactive' || !hasProAccess(user);
}

// 獲取詳細的用戶狀態描述 - SF10 簡化版
export type DetailedUserStatus = 'active_recurring' | 'active_ending' | 'inactive';

export function getDetailedUserStatus(user: UserProfile): DetailedUserStatus {
  return user.subscription_status;
}

// 獲取用戶狀態的中文描述 - SF10 簡化版
export function getUserStatusDescription(user: UserProfile): string {
  switch (user.subscription_status) {
    case 'active_recurring':
      return '訂閱中 (會自動續訂)';
    case 'active_ending':
      return '訂閱中 (即將到期)';
    case 'inactive':
      return '免費版';
    default:
      return '未知狀態';
  }
}

// Supabase 資料庫表格定義
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'clerk_user_id' | 'created_at'>>;
      };
    };
  };
}

// 錯誤類型
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// 用戶訂閱服務介面
export interface UserProfileService {
  getUserProfile(clerkUserId: string): Promise<UserProfile | null>;
  getUserProfileByPolarCustomerId(polarCustomerId: string): Promise<UserProfile | null>;
  createUserProfile(data: CreateUserProfileRequest): Promise<UserProfile>;
  updateUserProfile(clerkUserId: string, data: UpdateUserProfileRequest): Promise<UserProfile>;
  updateLastActiveDate(clerkUserId: string): Promise<void>;
  getOrCreateUserProfile(clerkUserId: string): Promise<UserProfile>;
}

// Polar 相關類型定義
export interface PolarCustomer {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  modified_at: string;
}

export interface PolarProduct {
  id: string;
  name: string;
  description?: string;
  is_recurring: boolean;
  is_archived: boolean;
  organization_id: string;
  prices: PolarPrice[];
  created_at: string;
  modified_at: string;
}

export interface PolarPrice {
  id: string;
  amount_type: 'fixed' | 'custom';
  is_archived: boolean;
  price_amount?: number;
  price_currency?: string;
  recurring_interval?: 'month' | 'year';
  created_at: string;
  modified_at: string;
}

export interface PolarSubscription {
  id: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  started_at?: string;
  ended_at?: string;
  customer_id: string;
  product_id: string;
  price_id: string;
  created_at: string;
  modified_at: string;
}

export interface PolarCheckoutSession {
  id: string;
  url: string;
  customer_id?: string;
  product_id: string;
  price_id: string;
  success_url: string;
  created_at: string;
  expires_at: string;
}

// Polar Webhook 事件類型（已移至下方統一定義）

// =============================================================================
// Polar 付費系統相關類型定義
// =============================================================================

// Polar Checkout 請求參數
export interface PolarCheckoutRequest {
  plan: 'pro';
  userId: string;
  successUrl?: string;
  cancelUrl?: string;
}

// Polar Checkout 回應
export interface PolarCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

// Polar Webhook 事件
export interface PolarWebhookEvent {
  type: string;
  data: {
    id: string;
    object: string;
    [key: string]: unknown;
  };
}

// Polar 訂閱資料（已移至上方統一定義）

// Polar 客戶資料
export interface PolarCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, unknown>;
}
