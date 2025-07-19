/**
 * Polar Webhook 處理端點
 *
 * 接收並處理 Polar 的 Webhook 事件，同步訂閱狀態到 Supabase 資料庫
 * 使用 Polar Next.js 適配器
 */

import { Webhooks } from '@polar-sh/nextjs';
import { userProfileService } from '@/lib/userProfileService';
// SF09: 移除未使用的導入
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
 * 處理訂閱建立事件 - SF09 簡化版
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

  // SF09: 簡化邏輯 - 所有 Polar 訂閱都是專業版
  // 獲取或建立用戶記錄，然後更新為專業版訂閱
  await userProfileService.getOrCreateUserProfile(clerkUserId);

  await userProfileService.updateUserProfile(clerkUserId, {
    subscriptionPlan: 'pro',
    subscriptionStatus: mapPolarStatusToLocal(subscription.status),
    monthlyUsageLimit: 10000, // 專業版固定額度
    polarCustomerId: subscription.customer_id,
    polarSubscriptionId: subscription.id,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false
  });

  console.log(`Subscription created for user ${clerkUserId}: pro`);
}

/**
 * 處理訂閱更新事件 - SF09 簡化版
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
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end
  });

  // SF09: 簡化邏輯 - 所有 Polar 訂閱都是專業版
  const updateData = {
    subscriptionPlan: 'pro' as SubscriptionPlan,
    subscriptionStatus: mapPolarStatusToLocal(subscription.status),
    monthlyUsageLimit: 10000, // 專業版固定額度
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false
  };

  const result = await userProfileService.updateUserProfile(clerkUserId, updateData);
  console.log('Database update result:', result);

  console.log(`Subscription updated for user ${clerkUserId}: ${subscription.status} (pro plan)`);
}

/**
 * 處理訂閱取消事件 - SF09 簡化版
 */
async function handleSubscriptionCanceled(event: any): Promise<void> {
  const subscription = event.data;
  const clerkUserId = subscription.metadata?.clerk_user_id;

  if (!clerkUserId) {
    console.error('Missing clerk_user_id in subscription metadata');
    return;
  }

  // SF09: 簡化邏輯 - 取消訂閱時回到未訂閱狀態
  await userProfileService.getOrCreateUserProfile(clerkUserId);

  await userProfileService.updateUserProfile(clerkUserId, {
    subscriptionPlan: null,
    subscriptionStatus: 'inactive',
    monthlyUsageLimit: 1000, // 回到基礎額度
    polarSubscriptionId: undefined,
    polarCustomerId: undefined,
    currentPeriodEnd: undefined,
    cancelAtPeriodEnd: false
  });

  console.log(`Subscription canceled for user ${clerkUserId} - reverted to unsubscribed state`);
}

/**
 * 處理 Checkout 完成事件 - SF09 簡化版
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

  // SF09: 簡化邏輯 - 所有 checkout 都是專業版訂閱
  if (checkout.product_id) {
    console.log('Creating pro subscription from checkout');

    try {
      await userProfileService.getOrCreateUserProfile(clerkUserId);

      await userProfileService.updateUserProfile(clerkUserId, {
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        monthlyUsageLimit: 10000, // 專業版固定額度
        polarCustomerId: checkout.customer_id || '',
        // checkout 通常沒有 subscription_id，先留空
        polarSubscriptionId: '',
        cancelAtPeriodEnd: false
      });

      console.log(`Pro subscription updated from checkout for user ${clerkUserId}`);
    } catch (error) {
      console.error('Error updating subscription from checkout:', error);
    }
  }
}

/**
 * 處理付款成功事件 - SF09 簡化版
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

  // SF09: 簡化邏輯 - 所有付款成功都是專業版訂閱
  if (order.subscription && order.productId) {
    console.log('Updating pro subscription from order.paid event');

    try {
      await userProfileService.getOrCreateUserProfile(clerkUserId);

      await userProfileService.updateUserProfile(clerkUserId, {
        subscriptionPlan: 'pro',
        subscriptionStatus: order.subscription.status === 'active' ? 'active' : mapPolarStatusToLocal(order.subscription.status),
        monthlyUsageLimit: 10000, // 專業版固定額度
        polarCustomerId: order.customerId || '',
        polarSubscriptionId: order.subscription.id, // 重要：設置 polar_subscription_id
        currentPeriodEnd: order.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: order.subscription.cancelAtPeriodEnd || false
      });

      console.log(`Pro subscription updated from order.paid for user ${clerkUserId}, subscription_id: ${order.subscription.id}`);
    } catch (error) {
      console.error('Error updating subscription from order.paid:', error);
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

// SF09: 移除產品 ID 映射函數，因為所有 Polar 訂閱都是專業版

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
