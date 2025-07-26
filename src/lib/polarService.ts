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
          const response = await polarApi.customers.get({
            id: userProfile.polar_customer_id
          });
          return response as unknown as PolarCustomer;
        } catch (error) {
          console.warn('Failed to fetch existing Polar customer, creating new one:', error);
        }
      }
      
      // 建立新的 Polar 客戶
      const response = await polarApi.customers.create({
        email,
        name: name || undefined,
        organizationId: POLAR_CONFIG.ORGANIZATION_ID
      });

      const customer = response as unknown as PolarCustomer;
      
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
      const response = await polarApi.products.list({
        organizationId: POLAR_CONFIG.ORGANIZATION_ID,
        isArchived: false
      });

      const products = [];
      for await (const product of response) {
        products.push(product);
      }
      return products as unknown as PolarProduct[];
    } catch (error) {
      handlePolarError(error);
    }
  }
  
  /**
   * 根據訂閱方案獲取產品
   */
  async getProductByPlan(plan: 'pro'): Promise<PolarProduct | null> {
    try {
      const productId = getPolarProductId(plan);
      if (!productId) {
        return null;
      }
      
      const response = await polarApi.products.get({
        id: productId
      });

      return response as unknown as PolarProduct;
    } catch (error) {
      console.error('Error fetching product by plan:', error);
      return null;
    }
  }
  
  /**
   * 建立 Checkout Session（目前只支援專業版）
   */
  async createCheckoutSession(
    clerkUserId: string,
    plan: 'pro',
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
      const response = await polarApi.checkouts.create({
        products: [productId],
        customerId: customer.id,
        successUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/checkout-success`
      });

      return (response as { url: string }).url;
    } catch (error) {
      handlePolarError(error);
    }
  }
  
  /**
   * 獲取客戶的訂閱
   */
  async getCustomerSubscriptions(customerId: string): Promise<PolarSubscription[]> {
    try {
      const response = await polarApi.subscriptions.list({
        customerId,
        organizationId: POLAR_CONFIG.ORGANIZATION_ID
      });

      const subscriptions = [];
      for await (const subscription of response) {
        subscriptions.push(subscription);
      }
      return subscriptions as unknown as PolarSubscription[];
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
      const response = await polarApi.subscriptions.get({
        id: subscriptionId
      });

      return response as unknown as PolarSubscription;
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
      const response = await polarApi.subscriptions.update({
        id: subscriptionId,
        subscriptionUpdate: {
          cancelAtPeriodEnd: true
        }
      });

      return response as unknown as PolarSubscription;
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
   * @deprecated 此函數已不再使用，實際的訂閱同步邏輯已移至 /api/webhooks/polar/route.ts
   * 保留此函數僅作為參考
   */
  async syncSubscriptionToSupabase(
    clerkUserId: string,
    subscription: PolarSubscription,
    product: PolarProduct
  ): Promise<void> {
    try {
      // 根據 Polar 產品 ID 判斷訂閱方案（簡化版：只支援專業版）
      let subscriptionPlan: 'pro' | null = null;
      let monthlyUsageLimit = 1000;

      if (product.id === getPolarProductId('pro')) {
        subscriptionPlan = 'pro';
        monthlyUsageLimit = 10000;
      }
      // 注意：此函數已不再使用，僅作為參考保留
      
      // 轉換 Polar 訂閱狀態（使用新的 3 狀態系統）
      let subscriptionStatus: 'active_recurring' | 'active_ending' | 'inactive' = 'inactive';
      switch (subscription.status) {
        case 'trialing':
        case 'active':
          subscriptionStatus = 'active_recurring';
          break;
        case 'canceled':
        case 'unpaid':
        case 'incomplete_expired':
        case 'past_due':
          subscriptionStatus = 'inactive';
          break;
        default:
          subscriptionStatus = 'inactive';
      }
      // 注意：此函數已不再使用，實際狀態映射請參考 /api/webhooks/polar/route.ts
      
      // 更新 Supabase 用戶資料
      await userProfileService.updateUserProfile(clerkUserId, {
        subscriptionPlan,
        subscriptionStatus,
        monthlyUsageLimit,
        polarSubscriptionId: subscription.id,
      });
      
    } catch (error) {
      console.error('Error syncing subscription to Supabase:', error);
      throw error;
    }
  }
  
  /**
   * 處理訂閱降級（取消後回到未訂閱狀態）
   */
  async handleSubscriptionDowngrade(clerkUserId: string): Promise<void> {
    try {
      await userProfileService.updateUserProfile(clerkUserId, {
        subscriptionPlan: null,           // 未訂閱狀態
        subscriptionStatus: 'inactive',   // 未啟用狀態
        monthlyUsageLimit: 1000,
        polarSubscriptionId: undefined,
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
