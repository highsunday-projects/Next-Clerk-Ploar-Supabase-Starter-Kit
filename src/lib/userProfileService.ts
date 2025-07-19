/**
 * 用戶訂閱資料服務
 * 
 * 提供用戶訂閱資料的 CRUD 操作，包含建立、讀取、更新用戶訂閱記錄。
 * 整合 Supabase 資料庫操作和錯誤處理。
 */

import { 
  getSupabaseClient, 
  handleSupabaseError, 
  TABLES, 
  QUERY_OPTIONS,
  DEFAULT_USER_PROFILE 
} from '@/lib/supabase';
import type { 
  UserProfile, 
  CreateUserProfileRequest, 
  UpdateUserProfileRequest,
  UserProfileService,
  SupabaseError
} from '@/types/supabase';

/**
 * 用戶訂閱資料服務實作
 */
class UserProfileServiceImpl implements UserProfileService {
  
  /**
   * 根據 Clerk 用戶 ID 獲取用戶訂閱資料
   */
  async getUserProfile(clerkUserId: string): Promise<UserProfile | null> {
    try {
      const supabase = getSupabaseClient(true); // 使用 admin 客戶端
      
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .select(QUERY_OPTIONS.USER_PROFILE_FIELDS)
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 找不到記錄，返回 null
          return null;
        }
        handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * 建立新的用戶訂閱記錄
   */
  async createUserProfile(data: CreateUserProfileRequest): Promise<UserProfile> {
    try {
      const supabase = getSupabaseClient(true); // 使用 admin 客戶端
      
      // 檢查用戶是否已存在
      const existingProfile = await this.getUserProfile(data.clerkUserId);
      if (existingProfile) {
        throw new SupabaseError('用戶訂閱記錄已存在', '23505');
      }

      // 準備插入資料
      const insertData = {
        clerk_user_id: data.clerkUserId,
        subscription_plan: data.subscriptionPlan || DEFAULT_USER_PROFILE.subscription_plan,
        subscription_status: data.subscriptionStatus || DEFAULT_USER_PROFILE.subscription_status,
        monthly_usage_limit: data.monthlyUsageLimit || DEFAULT_USER_PROFILE.monthly_usage_limit,
        trial_ends_at: data.trialEndsAt || null,
        last_active_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Polar 相關欄位
        polar_customer_id: data.polarCustomerId || null,
        polar_subscription_id: data.polarSubscriptionId || null,
        current_period_end: data.currentPeriodEnd || null,
        cancel_at_period_end: data.cancelAtPeriodEnd || false
      };

      const { data: newProfile, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .insert(insertData)
        .select(QUERY_OPTIONS.USER_PROFILE_FIELDS)
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return newProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * 更新用戶訂閱記錄
   */
  async updateUserProfile(
    clerkUserId: string, 
    data: UpdateUserProfileRequest
  ): Promise<UserProfile> {
    try {
      const supabase = getSupabaseClient(true); // 使用 admin 客戶端
      
      // 準備更新資料
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.subscriptionPlan !== undefined) {
        updateData.subscription_plan = data.subscriptionPlan;
      }
      if (data.subscriptionStatus !== undefined) {
        updateData.subscription_status = data.subscriptionStatus;
      }
      if (data.monthlyUsageLimit !== undefined) {
        updateData.monthly_usage_limit = data.monthlyUsageLimit;
      }
      if (data.trialEndsAt !== undefined) {
        updateData.trial_ends_at = data.trialEndsAt;
      }
      if (data.lastActiveDate !== undefined) {
        updateData.last_active_date = data.lastActiveDate;
      }
      // Polar 相關欄位
      if (data.polarCustomerId !== undefined) {
        updateData.polar_customer_id = data.polarCustomerId;
      }
      if (data.polarSubscriptionId !== undefined) {
        updateData.polar_subscription_id = data.polarSubscriptionId;
      }
      if (data.currentPeriodEnd !== undefined) {
        updateData.current_period_end = data.currentPeriodEnd;
      }
      if (data.cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = data.cancelAtPeriodEnd;
      }

      console.log('Updating user profile with data:', {
        clerkUserId,
        updateData
      });

      const { data: updatedProfile, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update(updateData)
        .eq('clerk_user_id', clerkUserId)
        .select(QUERY_OPTIONS.USER_PROFILE_FIELDS)
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        handleSupabaseError(error);
      }

      console.log('User profile updated successfully:', {
        clerkUserId,
        updatedProfile: {
          subscription_plan: updatedProfile?.subscription_plan,
          subscription_status: updatedProfile?.subscription_status,
          monthly_usage_limit: updatedProfile?.monthly_usage_limit,
          polar_subscription_id: updatedProfile?.polar_subscription_id
        }
      });

      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * 更新用戶最後活躍時間
   */
  async updateLastActiveDate(clerkUserId: string): Promise<void> {
    try {
      const supabase = getSupabaseClient(true); // 使用 admin 客戶端
      
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ 
          last_active_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', clerkUserId);

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error updating last active date:', error);
      throw error;
    }
  }

  /**
   * 獲取或建立用戶訂閱記錄
   * 如果用戶不存在，自動建立預設的免費方案記錄
   */
  async getOrCreateUserProfile(clerkUserId: string): Promise<UserProfile> {
    try {
      // 先嘗試獲取現有記錄
      let profile = await this.getUserProfile(clerkUserId);
      
      if (!profile) {
        // 如果不存在，建立新的未訂閱用戶記錄
        profile = await this.createUserProfile({
          clerkUserId,
          subscriptionPlan: null,
          subscriptionStatus: 'inactive',
          monthlyUsageLimit: 1000
        });
      } else {
        // 更新最後活躍時間
        await this.updateLastActiveDate(clerkUserId);
      }

      return profile;
    } catch (error) {
      console.error('Error getting or creating user profile:', error);
      throw error;
    }
  }
}

// 匯出服務實例
export const userProfileService = new UserProfileServiceImpl();

// 匯出類別供測試使用
export { UserProfileServiceImpl };
