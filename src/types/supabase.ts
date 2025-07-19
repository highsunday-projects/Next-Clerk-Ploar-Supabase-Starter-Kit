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
}

// 建立用戶訂閱記錄的請求參數
export interface CreateUserProfileRequest {
  clerkUserId: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  monthlyUsageLimit?: number;
  trialEndsAt?: string;
}

// 更新用戶訂閱記錄的請求參數
export interface UpdateUserProfileRequest {
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  monthlyUsageLimit?: number;
  trialEndsAt?: string;
  lastActiveDate?: string;
}

// API 回應格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 用戶訂閱資料 API 回應
export interface UserProfileResponse extends ApiResponse<UserProfile> {}

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
    price: 5,
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
    price: 10,
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
    public details?: any
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// 用戶訂閱服務介面
export interface UserProfileService {
  getUserProfile(clerkUserId: string): Promise<UserProfile | null>;
  createUserProfile(data: CreateUserProfileRequest): Promise<UserProfile>;
  updateUserProfile(clerkUserId: string, data: UpdateUserProfileRequest): Promise<UserProfile>;
  updateLastActiveDate(clerkUserId: string): Promise<void>;
}
