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
    subscriptionStatus: mapPolarStatusToLocal(subscription.status, subscription.cancel_at_period_end),
    monthlyUsageLimit: 10000, // 專業版固定額度
    polarCustomerId: subscription.customer_id,
    polarSubscriptionId: subscription.id,
    currentPeriodEnd: subscription.current_period_end
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
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end
  });

  // SF10 簡化版：檢查是否為真正的過期/取消狀態
  const isExpiredCancellation = (subscription.status === 'canceled' || subscription.status === 'cancelled');

  let updateData;

  if (isExpiredCancellation) {
    // 訂閱真正過期，降級為免費版
    updateData = {
      subscriptionPlan: null,
      subscriptionStatus: 'inactive' as SubscriptionStatus,
      monthlyUsageLimit: 1000, // 回到基礎額度
      polarSubscriptionId: undefined,
      polarCustomerId: undefined,
      currentPeriodEnd: undefined
    };
    console.log(`Subscription expired for user ${clerkUserId} - downgrading to free plan`);
  } else {
    // 一般的訂閱更新，保持專業版
    updateData = {
      subscriptionPlan: 'pro' as SubscriptionPlan,
      subscriptionStatus: mapPolarStatusToLocal(subscription.status, subscription.cancel_at_period_end),
      monthlyUsageLimit: 10000, // 專業版固定額度
      currentPeriodEnd: subscription.current_period_end
    };
  }

  const result = await userProfileService.updateUserProfile(clerkUserId, updateData);
  console.log('Database update result:', result);

  console.log(`Subscription updated for user ${clerkUserId}: ${subscription.status} (${isExpiredCancellation ? 'downgraded to free' : 'pro plan'})`);
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

  console.log('Processing subscription cancellation:', {
    subscriptionId: subscription.id,
    userId: clerkUserId,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: subscription.current_period_end
  });

  await userProfileService.getOrCreateUserProfile(clerkUserId);

  // SF10 簡化版：取消訂閱時直接設定為 active_ending 狀態
  // 讓用戶享受到期前的完整服務，Polar 會在期間結束時自動觸發真正的過期事件
  await userProfileService.updateUserProfile(clerkUserId, {
    subscriptionPlan: 'pro', // 保持專業版
    subscriptionStatus: 'active_ending', // SF10: 直接設定為即將到期狀態
    monthlyUsageLimit: 10000, // 保持專業版額度
    currentPeriodEnd: subscription.current_period_end // 保持期間結束時間
  });

  console.log(`Subscription canceled for user ${clerkUserId} - marked for cancellation at period end (${subscription.current_period_end})`);
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
        subscriptionStatus: 'active_recurring', // SF10: 使用新的狀態枚舉
        monthlyUsageLimit: 10000, // 專業版固定額度
        polarCustomerId: checkout.customer_id || '',
        // checkout 通常沒有 subscription_id，先留空
        polarSubscriptionId: ''
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
        subscriptionStatus: mapPolarStatusToLocal(order.subscription.status, order.subscription.cancelAtPeriodEnd),
        monthlyUsageLimit: 10000, // 專業版固定額度
        polarCustomerId: order.customerId || '',
        polarSubscriptionId: order.subscription.id, // 重要：設置 polar_subscription_id
        currentPeriodEnd: order.subscription.currentPeriodEnd
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
    // SF10 簡化版：付款失敗時設定為 inactive 狀態
    await userProfileService.updateUserProfile(clerkUserId, {
      subscriptionStatus: 'inactive'
    });
  }

  console.log(`Payment failed: ${payment.id}`);
}

// SF09: 移除產品 ID 映射函數，因為所有 Polar 訂閱都是專業版

/**
 * 將 Polar 訂閱狀態對應到本地狀態 - SF10 簡化版
 * 根據 cancel_at_period_end 和狀態決定最終的訂閱狀態
 */
function mapPolarStatusToLocal(polarStatus: string, cancelAtPeriodEnd: boolean = false): SubscriptionStatus {
  // SF10: 簡化為 3 種狀態
  switch (polarStatus) {
    case 'active':
      // 活躍狀態：根據是否安排取消來決定
      return cancelAtPeriodEnd ? 'active_ending' : 'active_recurring';
    case 'canceled':
    case 'cancelled':
    case 'incomplete_expired':
    case 'unpaid':
    case 'past_due':
      // 所有非活躍狀態都視為 inactive
      return 'inactive';
    case 'incomplete':
    case 'trialing':
      // 試用或未完成狀態視為會續訂的活躍狀態
      return 'active_recurring';
    default:
      // 預設為 inactive
      return 'inactive';
  }
}
