/**
 * Supabase 資料庫類型定義
 * 
 * 此檔案定義了與 Supabase 資料庫相關的 TypeScript 類型，
 * 包含用戶訂閱資料的介面和相關類型。
 */

// 訂閱方案類型
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

// 訂閱狀態類型
export type SubscriptionStatus = 'active' | 'trial' | 'cancelled' | 'expired';

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
  // Polar 付費系統相關欄位
  polar_customer_id?: string;
  polar_subscription_id?: string;
  polar_product_id?: string;
  last_payment_date?: string;
  next_billing_date?: string;
}

// 建立用戶訂閱記錄的請求參數
export interface CreateUserProfileRequest {
  clerkUserId: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  monthlyUsageLimit?: number;
  trialEndsAt?: string;
  // Polar 付費系統相關欄位
  polarCustomerId?: string;
  polarSubscriptionId?: string;
  polarProductId?: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
}

// 更新用戶訂閱記錄的請求參數
export interface UpdateUserProfileRequest {
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  monthlyUsageLimit?: number;
  trialEndsAt?: string;
  lastActiveDate?: string;
  // Polar 付費系統相關欄位
  polarCustomerId?: string;
  polarSubscriptionId?: string;
  polarProductId?: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
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

// 預設的訂閱方案配置（基於 Demo 文件）
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanConfig> = {
  free: {
    name: 'free',
    displayName: '免費方案',
    monthlyUsageLimit: 1000,
    price: 0,
    features: [
      '每月 1,000 次 API 呼叫',
      '基本功能存取',
      '社群支援'
    ]
  },
  pro: {
    name: 'pro',
    displayName: '專業方案',
    monthlyUsageLimit: 10000,
    price: 29,
    features: [
      '每月 10,000 次 API 呼叫',
      '進階功能存取',
      '優先支援',
      '詳細分析報告'
    ],
    popular: true
  },
  enterprise: {
    name: 'enterprise',
    displayName: '企業方案',
    monthlyUsageLimit: 100000,
    price: 99,
    features: [
      '每月 100,000 次 API 呼叫',
      '所有功能存取',
      '24/7 專屬支援',
      '自訂整合',
      '進階安全功能'
    ]
  }
};

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

// Polar Webhook 事件類型
export interface PolarWebhookEvent {
  type: string;
  data: {
    id: string;
    [key: string]: unknown;
  };
}
