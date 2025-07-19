/**
 * Polar Webhook 處理端點
 *
 * 接收並處理 Polar 的 Webhook 事件，同步訂閱狀態到 Supabase 資料庫
 * 使用 Polar Next.js 適配器
 */

import { Webhooks } from '@polar-sh/nextjs';
import { userProfileService } from '@/lib/userProfileService';
import { SUBSCRIPTION_PLANS } from '@/types/supabase';
import type { SubscriptionPlan, SubscriptionStatus } from '@/types/supabase';

/**
 * 使用 Polar Next.js 適配器處理 Webhook 事件
 */
export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onSubscriptionCreated: async (payload) => {
    console.log('Subscription created:', payload.data.id);
    await handleSubscriptionCreated(payload);
  },
  onSubscriptionUpdated: async (payload) => {
    console.log('Subscription updated:', payload.data.id);
    await handleSubscriptionUpdated(payload);
  },
  onSubscriptionCanceled: async (payload) => {
    console.log('Subscription canceled:', payload.data.id);
    await handleSubscriptionCanceled(payload);
  },
  onCheckoutCreated: async (payload) => {
    console.log('Checkout created:', payload.data.id);
    await handleCheckoutCompleted(payload);
  },
  onOrderCreated: async (payload) => {
    console.log('Order created:', payload.data.id);
    // 處理訂單建立事件
  },
  onOrderPaid: async (payload) => {
    console.log('Order paid:', payload.data.id);
    await handlePaymentSucceeded(payload);
  },
  onPayload: async (payload) => {
    // 捕獲所有其他事件
    console.log('Received webhook event:', payload.type);
  }
});

/**
 * 處理訂閱建立事件
 */
async function handleSubscriptionCreated(event: any): Promise<void> {
  const subscription = event.data;
  const clerkUserId = subscription.metadata?.clerk_user_id;
  
  if (!clerkUserId) {
    console.error('Missing clerk_user_id in subscription metadata');
    return;
  }

  // 根據產品 ID 判斷訂閱方案
  const subscriptionPlan = getSubscriptionPlanFromProductId(subscription.product_id);
  if (!subscriptionPlan) {
    console.error('Unknown product ID:', subscription.product_id);
    return;
  }

  // 更新用戶訂閱資料
  await userProfileService.updateUserProfile(clerkUserId, {
    subscriptionPlan,
    subscriptionStatus: mapPolarStatusToLocal(subscription.status),
    monthlyUsageLimit: SUBSCRIPTION_PLANS[subscriptionPlan].monthlyUsageLimit,
    polarCustomerId: subscription.customer_id,
    polarSubscriptionId: subscription.id,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false
  });

  console.log(`Subscription created for user ${clerkUserId}: ${subscriptionPlan}`);
}

/**
 * 處理訂閱更新事件
 */
async function handleSubscriptionUpdated(event: any): Promise<void> {
  const subscription = event.data;
  const clerkUserId = subscription.metadata?.clerk_user_id;
  
  if (!clerkUserId) {
    console.error('Missing clerk_user_id in subscription metadata');
    return;
  }

  // 更新訂閱狀態
  await userProfileService.updateUserProfile(clerkUserId, {
    subscriptionStatus: mapPolarStatusToLocal(subscription.status),
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false
  });

  console.log(`Subscription updated for user ${clerkUserId}: ${subscription.status}`);
}

/**
 * 處理訂閱取消事件
 */
async function handleSubscriptionCanceled(event: any): Promise<void> {
  const subscription = event.data;
  const clerkUserId = subscription.metadata?.clerk_user_id;
  
  if (!clerkUserId) {
    console.error('Missing clerk_user_id in subscription metadata');
    return;
  }

  // 更新為取消狀態
  await userProfileService.updateUserProfile(clerkUserId, {
    subscriptionStatus: 'cancelled',
    cancelAtPeriodEnd: true
  });

  console.log(`Subscription canceled for user ${clerkUserId}`);
}

/**
 * 處理 Checkout 完成事件
 */
async function handleCheckoutCompleted(event: any): Promise<void> {
  const checkout = event.data;
  const clerkUserId = checkout.metadata?.clerk_user_id;
  
  if (!clerkUserId) {
    console.error('Missing clerk_user_id in checkout metadata');
    return;
  }

  console.log(`Checkout completed for user ${clerkUserId}`);
  // Checkout 完成後，通常會觸發 subscription.created 事件，所以這裡不需要額外處理
}

/**
 * 處理付款成功事件
 */
async function handlePaymentSucceeded(event: any): Promise<void> {
  const payment = event.data;
  console.log(`Payment succeeded: ${payment.id}`);
  // 付款成功通常會自動更新訂閱狀態，這裡可以記錄日誌或發送通知
}

/**
 * 處理付款失敗事件
 */
async function handlePaymentFailed(event: any): Promise<void> {
  const payment = event.data;
  const clerkUserId = payment.metadata?.clerk_user_id;
  
  if (clerkUserId) {
    // 付款失敗時，可能需要更新訂閱狀態為 past_due
    await userProfileService.updateUserProfile(clerkUserId, {
      subscriptionStatus: 'past_due'
    });
  }

  console.log(`Payment failed: ${payment.id}`);
}

/**
 * 根據 Polar 產品 ID 獲取訂閱方案
 */
function getSubscriptionPlanFromProductId(productId: string): SubscriptionPlan | null {
  const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
  const enterpriseProductId = process.env.POLAR_ENTERPRISE_PRODUCT_ID;
  
  if (productId === proProductId) {
    return 'pro';
  } else if (productId === enterpriseProductId) {
    return 'enterprise';
  }
  
  return null;
}

/**
 * 將 Polar 訂閱狀態對應到本地狀態
 */
function mapPolarStatusToLocal(polarStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    'incomplete': 'trial',
    'incomplete_expired': 'expired',
    'trialing': 'trial',
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'cancelled',
    'unpaid': 'past_due'
  };
  
  return statusMap[polarStatus] || 'active';
}
