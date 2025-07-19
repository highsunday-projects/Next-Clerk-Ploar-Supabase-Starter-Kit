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
// 先添加一個原始的 POST 處理器來調試
export async function POST(request: Request) {
  console.log('=== WEBHOOK DEBUG START ===');
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  const body = await request.text();
  console.log('Raw body:', body);
  console.log('=== WEBHOOK DEBUG END ===');
  
  // 重建 request 因為我們已經讀取了 body
  const newRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: body
  });
  
  // 調用原始的 webhook 處理器
  return webhookHandler(newRequest);
}

const webhookHandler = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onSubscriptionCreated: async (payload) => {
    console.log('🎉 Subscription created:', payload.data.id);
    console.log('Subscription created data:', JSON.stringify(payload.data, null, 2));
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
    console.log('Checkout data:', JSON.stringify(payload.data, null, 2));
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
    console.log('Full payload:', JSON.stringify(payload, null, 2));
  }
});

/**
 * 處理訂閱建立事件
 */
async function handleSubscriptionCreated(event: any): Promise<void> {
  const subscription = event.data;
  console.log('Raw subscription data:', JSON.stringify(subscription, null, 2));
  
  const clerkUserId = subscription.metadata?.clerk_user_id;
  
  if (!clerkUserId) {
    console.error('Missing clerk_user_id in subscription metadata');
    console.error('Available metadata:', subscription.metadata);
    return;
  }

  // 根據產品 ID 判斷訂閱方案
  const subscriptionPlan = getSubscriptionPlanFromProductId(subscription.product_id);
  if (!subscriptionPlan) {
    console.error('Unknown product ID:', subscription.product_id);
    return;
  }

  // 獲取或建立用戶記錄，然後更新訂閱資料
  const profile = await userProfileService.getOrCreateUserProfile(clerkUserId);
  
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

  console.log('Processing subscription update:', {
    subscriptionId: subscription.id,
    userId: clerkUserId,
    status: subscription.status,
    productId: subscription.product_id,
    amount: subscription.amount,
    currency: subscription.currency,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end
  });

  // 獲取當前用戶資料以比較變更
  const currentProfile = await userProfileService.getOrCreateUserProfile(clerkUserId);
  console.log('Current user profile:', {
    currentPlan: currentProfile.subscription_plan,
    currentStatus: currentProfile.subscription_status,
    currentLimit: currentProfile.monthly_usage_limit
  });

  // 檢查是否有產品變更（方案切換）
  const subscriptionPlan = getSubscriptionPlanFromProductId(subscription.product_id);
  console.log('Product ID mapping result:', {
    productId: subscription.product_id,
    mappedPlan: subscriptionPlan,
    proProductId: process.env.POLAR_PRO_PRODUCT_ID,
    enterpriseProductId: process.env.POLAR_ENTERPRISE_PRODUCT_ID
  });

  const updateData: any = {
    subscriptionStatus: mapPolarStatusToLocal(subscription.status),
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false
  };

  // 如果檢測到方案變更，更新訂閱方案和額度
  if (subscriptionPlan) {
    updateData.subscriptionPlan = subscriptionPlan;
    updateData.monthlyUsageLimit = SUBSCRIPTION_PLANS[subscriptionPlan].monthlyUsageLimit;

    console.log(`Plan changed from ${currentProfile.subscription_plan} to ${subscriptionPlan} for user ${clerkUserId}`);
    console.log('Update data:', updateData);
  } else {
    console.warn('No subscription plan found for product ID:', subscription.product_id);
  }

  const result = await userProfileService.updateUserProfile(clerkUserId, updateData);
  console.log('Database update result:', result);

  console.log(`Subscription updated for user ${clerkUserId}: ${subscription.status}${subscriptionPlan ? ` (plan: ${subscriptionPlan})` : ''}`);
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

  // 確保用戶記錄存在，然後更新為取消狀態
  await userProfileService.getOrCreateUserProfile(clerkUserId);
  
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
    console.error('Available checkout metadata:', checkout.metadata);
    return;
  }

  console.log(`Checkout completed for user ${clerkUserId}`);
  
  // 檢查 checkout 是否包含產品資訊，如果有則創建訂閱
  if (checkout.product_id) {
    console.log('Creating subscription from checkout for product:', checkout.product_id);
    
    const subscriptionPlan = getSubscriptionPlanFromProductId(checkout.product_id);
    if (subscriptionPlan) {
      try {
        // 獲取或建立用戶記錄，然後更新訂閱資料
        const profile = await userProfileService.getOrCreateUserProfile(clerkUserId);
        
        await userProfileService.updateUserProfile(clerkUserId, {
          subscriptionPlan,
          subscriptionStatus: 'active',
          monthlyUsageLimit: SUBSCRIPTION_PLANS[subscriptionPlan].monthlyUsageLimit,
          polarCustomerId: checkout.customer_id || '',
          // checkout 通常沒有 subscription_id，先留空
          polarSubscriptionId: '',
          cancelAtPeriodEnd: false
        });
        
        console.log(`Subscription updated from checkout for user ${clerkUserId}: ${subscriptionPlan}`);
      } catch (error) {
        console.error('Error updating subscription from checkout:', error);
      }
    }
  }
}

/**
 * 處理付款成功事件
 */
async function handlePaymentSucceeded(event: any): Promise<void> {
  const order = event.data;
  const clerkUserId = order.metadata?.clerk_user_id;
  
  console.log(`Payment succeeded: ${order.id}`);
  
  if (!clerkUserId) {
    console.error('Missing clerk_user_id in order metadata');
    console.error('Available order metadata:', order.metadata);
    return;
  }
  
  // 如果訂單包含訂閱資訊，更新用戶訂閱資料
  if (order.subscription && order.productId) {
    console.log('Updating subscription from order.paid event');
    
    const subscriptionPlan = getSubscriptionPlanFromProductId(order.productId);
    if (subscriptionPlan) {
      try {
        // 獲取或建立用戶記錄，然後更新訂閱資料
        const profile = await userProfileService.getOrCreateUserProfile(clerkUserId);
        
        await userProfileService.updateUserProfile(clerkUserId, {
          subscriptionPlan,
          subscriptionStatus: order.subscription.status === 'active' ? 'active' : mapPolarStatusToLocal(order.subscription.status),
          monthlyUsageLimit: SUBSCRIPTION_PLANS[subscriptionPlan].monthlyUsageLimit,
          polarCustomerId: order.customerId || '',
          polarSubscriptionId: order.subscription.id, // 重要：設置 polar_subscription_id
          currentPeriodEnd: order.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: order.subscription.cancelAtPeriodEnd || false
        });
        
        console.log(`Subscription updated from order.paid for user ${clerkUserId}: ${subscriptionPlan}, subscription_id: ${order.subscription.id}`);
      } catch (error) {
        console.error('Error updating subscription from order.paid:', error);
      }
    } else {
      console.error('Unknown product ID in order.paid:', order.productId);
    }
  }
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
