/**
 * Polar 付費系統服務
 * 
 * 提供 Polar API 的封裝服務，包含客戶管理、產品管理、訂閱管理等功能
 */

import {
  polarApi,
  POLAR_CONFIG,
  getPolarProductId,
  handlePolarError,
  buildCustomerPortalUrl
} from '@/lib/polar';
import { userProfileService } from '@/lib/userProfileService';
import type {
  PolarCustomer,
  PolarProduct,
  PolarSubscription
} from '@/types/supabase';

/**
 * Polar 付費系統服務類別
 */
class PolarService {
  
  /**
   * 建立或獲取 Polar 客戶
   */
  async getOrCreateCustomer(clerkUserId: string, email: string, name?: string): Promise<PolarCustomer> {
    try {
      // 先檢查用戶是否已有 Polar Customer ID
      const userProfile = await userProfileService.getUserProfile(clerkUserId);
      
      if (userProfile?.polar_customer_id) {
        // 嘗試獲取現有客戶
        try {
          const response = await polarApi.customersGet({
            id: userProfile.polar_customer_id
          });
          return response.data as PolarCustomer;
        } catch (error) {
          console.warn('Failed to fetch existing Polar customer, creating new one:', error);
        }
      }
      
      // 建立新的 Polar 客戶
      const response = await polarApi.customersCreate({
        customerCreate: {
          email,
          name: name || undefined,
          organization_id: POLAR_CONFIG.ORGANIZATION_ID
        }
      });

      const customer = response.data as PolarCustomer;
      
      // 更新用戶資料中的 Polar Customer ID
      if (userProfile) {
        await userProfileService.updateUserProfile(clerkUserId, {
          polarCustomerId: customer.id
        });
      }
      
      return customer;
    } catch (error) {
      handlePolarError(error);
    }
  }
  
  /**
   * 獲取組織的所有產品
   */
  async getProducts(): Promise<PolarProduct[]> {
    try {
      const response = await polarApi.productsSearch({
        organizationId: POLAR_CONFIG.ORGANIZATION_ID,
        isArchived: false
      });

      return (response.data.items || []) as PolarProduct[];
    } catch (error) {
      handlePolarError(error);
    }
  }
  
  /**
   * 根據訂閱方案獲取產品
   */
  async getProductByPlan(plan: 'pro' | 'enterprise'): Promise<PolarProduct | null> {
    try {
      const productId = getPolarProductId(plan);
      if (!productId) {
        return null;
      }
      
      const response = await polarApi.productsGet({
        id: productId
      });

      return response.data as PolarProduct;
    } catch (error) {
      console.error('Error fetching product by plan:', error);
      return null;
    }
  }
  
  /**
   * 建立 Checkout Session
   */
  async createCheckoutSession(
    clerkUserId: string,
    plan: 'pro' | 'enterprise',
    email: string,
    name?: string
  ): Promise<string> {
    try {
      const productId = getPolarProductId(plan);
      if (!productId) {
        throw new Error(`No product ID found for plan: ${plan}`);
      }
      
      // 建立或獲取客戶
      const customer = await this.getOrCreateCustomer(clerkUserId, email, name);
      
      // 建立 Checkout Session
      const response = await polarApi.checkoutsCreate({
        checkoutCreate: {
          product_id: productId,
          customer_id: customer.id,
          success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/checkout-success`,
          organization_id: POLAR_CONFIG.ORGANIZATION_ID
        }
      });

      return (response.data as { url: string }).url;
    } catch (error) {
      handlePolarError(error);
    }
  }
  
  /**
   * 獲取客戶的訂閱
   */
  async getCustomerSubscriptions(customerId: string): Promise<PolarSubscription[]> {
    try {
      const response = await polarApi.subscriptionsSearch({
        customerId,
        organizationId: POLAR_CONFIG.ORGANIZATION_ID
      });

      return (response.data.items || []) as PolarSubscription[];
    } catch (error) {
      console.error('Error fetching customer subscriptions:', error);
      return [];
    }
  }
  
  /**
   * 獲取訂閱詳情
   */
  async getSubscription(subscriptionId: string): Promise<PolarSubscription | null> {
    try {
      const response = await polarApi.subscriptionsGet({
        id: subscriptionId
      });

      return response.data as PolarSubscription;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }
  
  /**
   * 取消訂閱
   */
  async cancelSubscription(subscriptionId: string): Promise<PolarSubscription> {
    try {
      const response = await polarApi.subscriptionsCancel({
        id: subscriptionId
      });

      return response.data as PolarSubscription;
    } catch (error) {
      handlePolarError(error);
    }
  }
  
  /**
   * 建立 Customer Portal URL
   */
  async createCustomerPortalUrl(clerkUserId: string): Promise<string> {
    try {
      const userProfile = await userProfileService.getUserProfile(clerkUserId);
      
      if (!userProfile?.polar_customer_id) {
        throw new Error('User does not have a Polar customer ID');
      }
      
      return buildCustomerPortalUrl(userProfile.polar_customer_id);
    } catch (error) {
      handlePolarError(error);
    }
  }
  
  /**
   * 同步 Polar 訂閱狀態到 Supabase
   */
  async syncSubscriptionToSupabase(
    clerkUserId: string,
    subscription: PolarSubscription,
    product: PolarProduct
  ): Promise<void> {
    try {
      // 根據 Polar 產品 ID 判斷訂閱方案
      let subscriptionPlan: 'free' | 'pro' | 'enterprise' = 'free';
      let monthlyUsageLimit = 1000;
      
      if (product.id === getPolarProductId('pro')) {
        subscriptionPlan = 'pro';
        monthlyUsageLimit = 10000;
      } else if (product.id === getPolarProductId('enterprise')) {
        subscriptionPlan = 'enterprise';
        monthlyUsageLimit = 100000;
      }
      
      // 轉換 Polar 訂閱狀態
      let subscriptionStatus: 'active' | 'trial' | 'cancelled' | 'expired' = 'active';
      switch (subscription.status) {
        case 'trialing':
          subscriptionStatus = 'trial';
          break;
        case 'active':
          subscriptionStatus = 'active';
          break;
        case 'canceled':
        case 'unpaid':
          subscriptionStatus = 'cancelled';
          break;
        case 'incomplete_expired':
        case 'past_due':
          subscriptionStatus = 'expired';
          break;
        default:
          subscriptionStatus = 'active';
      }
      
      // 更新 Supabase 用戶資料
      await userProfileService.updateUserProfile(clerkUserId, {
        subscriptionPlan,
        subscriptionStatus,
        monthlyUsageLimit,
        polarSubscriptionId: subscription.id,
        polarProductId: product.id,
        lastPaymentDate: subscription.started_at || subscription.created_at,
        nextBillingDate: subscription.current_period_end
      });
      
    } catch (error) {
      console.error('Error syncing subscription to Supabase:', error);
      throw error;
    }
  }
  
  /**
   * 處理訂閱降級（取消後回到免費方案）
   */
  async handleSubscriptionDowngrade(clerkUserId: string): Promise<void> {
    try {
      await userProfileService.updateUserProfile(clerkUserId, {
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        monthlyUsageLimit: 1000,
        polarSubscriptionId: undefined,
        polarProductId: undefined,
        nextBillingDate: undefined
      });
    } catch (error) {
      console.error('Error handling subscription downgrade:', error);
      throw error;
    }
  }
}

// 匯出服務實例
export const polarService = new PolarService();

// 匯出類別供測試使用
export { PolarService };
