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

// 事件去重機制 - 避免重複處理相同事件
const processedEvents = new Set<string>();
const processedCancellations = new Map<string, string>();

// 清理過期的事件記錄（每小時清理一次）
setInterval(() => {
  processedEvents.clear();
  processedCancellations.clear();
  console.log('Cleared processed events cache');
}, 60 * 60 * 1000);

/**
 * 檢查是否為立即取消（非週期結束取消）
 * 立即取消的特徵：
 * 1. status = 'canceled'
 * 2. cancelAtPeriodEnd = false
 * 3. endsAt 接近 canceledAt（而非 currentPeriodEnd）
 */
function isImmediateCancellation(subscription: any): boolean {
  if (subscription.status !== 'canceled') return false;
  if (subscription.cancelAtPeriodEnd === true) return false;

  // 檢查是否有取消時間和結束時間
  if (!subscription.canceledAt || !subscription.endsAt) return false;

  // 檢查結束時間是否接近取消時間
  const endsAt = new Date(subscription.endsAt);
  const canceledAt = new Date(subscription.canceledAt);
  const timeDiff = Math.abs(endsAt.getTime() - canceledAt.getTime());

  console.log('Immediate cancellation check:', {
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: subscription.canceledAt,
    endsAt: subscription.endsAt,
    timeDiff: timeDiff,
    isImmediate: timeDiff < 60000
  });

  return timeDiff < 60000; // 1分鐘內視為立即取消
}

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

  // 驗證關鍵欄位
  if (!clerkUserId) {
    console.error('Missing clerk_user_id in subscription metadata');
    console.error('Available metadata:', subscription.metadata);
    return;
  }
  if (!subscription.status || !subscription.customer_id || !subscription.id || !subscription.current_period_end) {
    console.error('Missing required subscription fields:', {
      status: subscription.status,
      customer_id: subscription.customer_id,
      id: subscription.id,
      current_period_end: subscription.current_period_end
    });
    return;
  }

  // SF09: 簡化邏輯 - 所有 Polar 訂閱都是專業版
  // 獲取或建立用戶記錄，然後更新為專業版訂閱
  await userProfileService.getOrCreateUserProfile(clerkUserId);

  await userProfileService.updateUserProfile(clerkUserId, {
    subscriptionPlan: 'pro',
    subscriptionStatus: mapPolarStatusToLocal(subscription.status, subscription.cancelAtPeriodEnd),
    monthlyUsageLimit: 10000, // 專業版固定額度
    polarCustomerId: subscription.customer_id,
    polarSubscriptionId: subscription.id,
    currentPeriodEnd: subscription.currentPeriodEnd
  });

  console.log(`Subscription created for user ${clerkUserId}: pro`);
}

/**
 * 處理訂閱更新事件 - SF09 簡化版
 * 加入事件去重機制避免重複處理
 */
async function handleSubscriptionUpdated(event: any): Promise<void> {
  const subscription = event.data;
  const clerkUserId = subscription.metadata?.clerk_user_id;

  console.log(`[handleSubscriptionUpdated] Processing event for subscription ${subscription.id}`);

  if (!clerkUserId) {
    console.error('Missing clerk_user_id in subscription metadata');
    return;
  }

  // 優先檢查立即取消，並設置強制去重標記
  if (isImmediateCancellation(subscription)) {
    const immediateCancelKey = `immediate-cancel-${subscription.id}`;

    if (processedEvents.has(immediateCancelKey)) {
      console.log(`[handleSubscriptionUpdated] Immediate cancellation already processed, skipping: ${immediateCancelKey}`);
      return;
    }

    // 立即設置去重標記，防止其他事件重複處理
    processedEvents.add(immediateCancelKey);
    processedCancellations.set(immediateCancelKey, 'immediate-cancel-processed');

    console.log(`[handleSubscriptionUpdated] Immediate cancellation detected for user ${clerkUserId}`);

    // 立即取消：直接降級為免費版
    const updateData = {
      subscriptionPlan: null,
      subscriptionStatus: 'inactive' as SubscriptionStatus,
      monthlyUsageLimit: 1000, // 回到基礎額度
      polarSubscriptionId: undefined,
      polarCustomerId: undefined,
      currentPeriodEnd: undefined
    };

    const result = await userProfileService.updateUserProfile(clerkUserId, updateData);
    console.log(`[handleSubscriptionUpdated] User ${clerkUserId} immediately downgraded to free plan:`, result);
    return;
  }

  // 事件去重檢查
  const eventKey = `updated-${subscription.id}-${subscription.modified_at || Date.now()}`;
  if (processedEvents.has(eventKey)) {
    console.log('[handleSubscriptionUpdated] Event already processed, skipping:', eventKey);
    return;
  }
  processedEvents.add(eventKey);

  console.log('Processing subscription update:', {
    subscriptionId: subscription.id,
    userId: clerkUserId,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd
  });

  // 立即取消已在函數開始處理，這裡不應該再執行到

  // 智能狀態判斷：優先檢查取消標誌
  const isExpiredCancellation = (subscription.status === 'canceled' || subscription.status === 'cancelled');
  const hasCancelFlag = subscription.cancelAtPeriodEnd === true || subscription.canceledAt;

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
  } else if (hasCancelFlag && subscription.status === 'active') {
    // 有取消標誌的活躍訂閱，直接設為 active_ending
    updateData = {
      subscriptionPlan: 'pro' as SubscriptionPlan,
      subscriptionStatus: 'active_ending' as SubscriptionStatus,
      monthlyUsageLimit: 10000, // 專業版固定額度
      currentPeriodEnd: subscription.currentPeriodEnd
    };
    console.log(`Subscription marked for cancellation for user ${clerkUserId} - set to active_ending`);
  } else {
    // 一般的訂閱更新，保持專業版
    updateData = {
      subscriptionPlan: 'pro' as SubscriptionPlan,
      subscriptionStatus: mapPolarStatusToLocal(subscription.status, subscription.cancelAtPeriodEnd),
      monthlyUsageLimit: 10000, // 專業版固定額度
      currentPeriodEnd: subscription.currentPeriodEnd
    };
    console.log(`Regular subscription update for user ${clerkUserId} - status: ${updateData.subscriptionStatus}`);
  }

  const result = await userProfileService.updateUserProfile(clerkUserId, updateData);
  console.log('Database update result:', result);

  console.log(`Subscription updated for user ${clerkUserId}: ${subscription.status} (${isExpiredCancellation ? 'downgraded to free' : 'pro plan'})`);
}

/**
 * 處理訂閱取消事件 - SF09 簡化版
 * 加入事件去重機制避免重複處理
 */
async function handleSubscriptionCanceled(event: any): Promise<void> {
  const subscription = event.data;
  const clerkUserId = subscription.metadata?.clerk_user_id;

  console.log(`[handleSubscriptionCanceled] Processing event for subscription ${subscription.id}`);

  if (!clerkUserId) {
    console.error('Missing clerk_user_id in subscription metadata');
    return;
  }

  // 優先檢查立即取消，並檢查是否已被處理
  if (isImmediateCancellation(subscription)) {
    const immediateCancelKey = `immediate-cancel-${subscription.id}`;

    if (processedEvents.has(immediateCancelKey) || processedCancellations.has(immediateCancelKey)) {
      console.log(`[handleSubscriptionCanceled] Immediate cancellation already processed by updated event, skipping: ${immediateCancelKey}`);
      return;
    }

    // 立即設置去重標記
    processedEvents.add(immediateCancelKey);
    processedCancellations.set(immediateCancelKey, 'immediate-cancel-processed');

    console.log(`[handleSubscriptionCanceled] Immediate cancellation detected for user ${clerkUserId}`);

    // 立即取消：直接降級為免費版
    const updateData = {
      subscriptionPlan: null,
      subscriptionStatus: 'inactive' as SubscriptionStatus,
      monthlyUsageLimit: 1000, // 回到基礎額度
      polarSubscriptionId: undefined,
      polarCustomerId: undefined,
      currentPeriodEnd: undefined
    };

    const result = await userProfileService.updateUserProfile(clerkUserId, updateData);
    console.log(`[handleSubscriptionCanceled] User ${clerkUserId} immediately downgraded to free plan:`, result);
    return;
  }

  // 事件去重檢查
  const eventKey = `canceled-${subscription.id}-${subscription.modified_at || Date.now()}`;
  if (processedEvents.has(eventKey)) {
    console.log('[handleSubscriptionCanceled] Event already processed, skipping:', eventKey);
    return;
  }
  processedEvents.add(eventKey);

  console.log('Processing subscription cancellation:', {
    subscriptionId: subscription.id,
    userId: clerkUserId,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: subscription.canceledAt,
    endsAt: subscription.endsAt,
    endedAt: subscription.endedAt,
    currentPeriodEnd: subscription.currentPeriodEnd
  });

  // 立即取消已在函數開始處理，這裡不應該再執行到

  await userProfileService.getOrCreateUserProfile(clerkUserId);

  // 週期結束取消：設為 active_ending 狀態
  // 讓用戶享受到期前的完整服務，Polar 會在期間結束時自動觸發真正的過期事件
  await userProfileService.updateUserProfile(clerkUserId, {
    subscriptionPlan: 'pro', // 保持專業版
    subscriptionStatus: 'active_ending', // 設定為即將到期狀態
    monthlyUsageLimit: 10000, // 保持專業版額度
    currentPeriodEnd: subscription.currentPeriodEnd // 保持期間結束時間
  });

  console.log(`Subscription canceled for user ${clerkUserId} - marked for cancellation at period end (${subscription.currentPeriodEnd})`);
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
 * 根據 cancelAtPeriodEnd 和狀態決定最終的訂閱狀態
 * 修正版：更安全地處理取消狀態邏輯
 */
function mapPolarStatusToLocal(polarStatus: string, cancelAtPeriodEnd: boolean = false): SubscriptionStatus {
  console.log('Mapping Polar status:', { polarStatus, cancelAtPeriodEnd });

  // SF10: 簡化為 3 種狀態
  switch (polarStatus) {
    case 'active':
      // 活躍狀態：根據是否安排取消來決定
      const result = cancelAtPeriodEnd ? 'active_ending' : 'active_recurring';
      console.log('Active status mapped to:', result);
      return result;
    case 'canceled':
    case 'cancelled':
    case 'incomplete_expired':
    case 'unpaid':
    case 'past_due':
      // 所有非活躍狀態都視為 inactive
      console.log('Non-active status mapped to: inactive');
      return 'inactive';
    case 'incomplete':
    case 'trialing':
      // 試用或未完成狀態視為會續訂的活躍狀態
      console.log('Trial/incomplete status mapped to: active_recurring');
      return 'active_recurring';
    default:
      // 預設為 inactive
      console.log('Unknown status mapped to: inactive');
      return 'inactive';
  }
}
