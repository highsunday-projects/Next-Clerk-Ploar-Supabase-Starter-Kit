/**
 * Polar Webhook 處理器
 * 
 * 處理 Polar 事件並同步到 Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyPolarWebhook } from '@/lib/polar';
import { polarService } from '@/lib/polarService';
import { userProfileService } from '@/lib/userProfileService';
import type { PolarWebhookEvent } from '@/types/supabase';

/**
 * POST /api/webhooks/polar
 * 處理 Polar 事件並同步到 Supabase
 */
export async function POST(request: NextRequest) {
  try {
    // 獲取 Webhook 簽名驗證所需的標頭
    const headerPayload = await headers();
    const signature = headerPayload.get('polar-signature');
    
    if (!signature) {
      console.error('Missing Polar signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }
    
    // 獲取請求內容
    const payload = await request.text();
    
    // 驗證 Webhook 簽名
    if (!verifyPolarWebhook(payload, signature)) {
      console.error('Invalid Polar webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // 解析事件資料
    let event: PolarWebhookEvent;
    try {
      event = JSON.parse(payload);
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    
    console.log(`Processing Polar webhook event: ${event.type}`, event.data.id);
    
    // 處理不同的事件類型
    switch (event.type) {
      case 'checkout.created':
        await handleCheckoutCreated(event);
        break;
      
      case 'checkout.updated':
        await handleCheckoutUpdated(event);
        break;
      
      case 'subscription.created':
        await handleSubscriptionCreated(event);
        break;
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
      
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event);
        break;
      
      default:
        console.log(`Unhandled Polar webhook event type: ${event.type}`);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error processing Polar webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 處理 Checkout 建立事件
 */
async function handleCheckoutCreated(event: PolarWebhookEvent) {
  try {
    console.log(`Processing checkout.created event for checkout: ${event.data.id}`);
    // 這裡可以記錄 checkout 開始的事件，但通常不需要特別處理
  } catch (error) {
    console.error('Error handling checkout.created event:', error);
    throw error;
  }
}

/**
 * 處理 Checkout 更新事件（通常是付款完成）
 */
async function handleCheckoutUpdated(event: PolarWebhookEvent) {
  try {
    console.log(`Processing checkout.updated event for checkout: ${event.data.id}`);
    
    // 如果 checkout 完成，相關的訂閱事件會隨後觸發
    // 這裡主要用於記錄付款狀態
    if (event.data.status === 'completed') {
      console.log(`Checkout ${event.data.id} completed successfully`);
    }
  } catch (error) {
    console.error('Error handling checkout.updated event:', error);
    throw error;
  }
}

/**
 * 處理訂閱建立事件
 */
async function handleSubscriptionCreated(event: PolarWebhookEvent) {
  try {
    console.log(`Processing subscription.created event for subscription: ${event.data.id}`);
    
    // 獲取訂閱詳情
    const subscription = await polarService.getSubscription(event.data.id);
    if (!subscription) {
      throw new Error(`Subscription ${event.data.id} not found`);
    }
    
    // 獲取產品詳情
    const products = await polarService.getProducts();
    const product = products.find(p => p.id === subscription.product_id);
    if (!product) {
      throw new Error(`Product ${subscription.product_id} not found`);
    }
    
    // 根據客戶 ID 找到對應的用戶
    const clerkUserId = await findClerkUserIdByCustomerId(subscription.customer_id);
    if (!clerkUserId) {
      console.warn(`No Clerk user found for Polar customer: ${subscription.customer_id}`);
      return;
    }
    
    // 同步訂閱狀態到 Supabase
    await polarService.syncSubscriptionToSupabase(clerkUserId, subscription, product);
    
    console.log(`Successfully synced subscription ${subscription.id} for user ${clerkUserId}`);
    
  } catch (error) {
    console.error('Error handling subscription.created event:', error);
    throw error;
  }
}

/**
 * 處理訂閱更新事件
 */
async function handleSubscriptionUpdated(event: PolarWebhookEvent) {
  try {
    console.log(`Processing subscription.updated event for subscription: ${event.data.id}`);
    
    // 獲取訂閱詳情
    const subscription = await polarService.getSubscription(event.data.id);
    if (!subscription) {
      throw new Error(`Subscription ${event.data.id} not found`);
    }
    
    // 獲取產品詳情
    const products = await polarService.getProducts();
    const product = products.find(p => p.id === subscription.product_id);
    if (!product) {
      throw new Error(`Product ${subscription.product_id} not found`);
    }
    
    // 根據客戶 ID 找到對應的用戶
    const clerkUserId = await findClerkUserIdByCustomerId(subscription.customer_id);
    if (!clerkUserId) {
      console.warn(`No Clerk user found for Polar customer: ${subscription.customer_id}`);
      return;
    }
    
    // 同步訂閱狀態到 Supabase
    await polarService.syncSubscriptionToSupabase(clerkUserId, subscription, product);
    
    console.log(`Successfully updated subscription ${subscription.id} for user ${clerkUserId}`);
    
  } catch (error) {
    console.error('Error handling subscription.updated event:', error);
    throw error;
  }
}

/**
 * 處理訂閱取消事件
 */
async function handleSubscriptionCanceled(event: PolarWebhookEvent) {
  try {
    console.log(`Processing subscription.canceled event for subscription: ${event.data.id}`);
    
    // 獲取訂閱詳情
    const subscription = await polarService.getSubscription(event.data.id);
    if (!subscription) {
      throw new Error(`Subscription ${event.data.id} not found`);
    }
    
    // 根據客戶 ID 找到對應的用戶
    const clerkUserId = await findClerkUserIdByCustomerId(subscription.customer_id);
    if (!clerkUserId) {
      console.warn(`No Clerk user found for Polar customer: ${subscription.customer_id}`);
      return;
    }
    
    // 處理訂閱降級
    await polarService.handleSubscriptionDowngrade(clerkUserId);
    
    console.log(`Successfully downgraded user ${clerkUserId} after subscription cancellation`);
    
  } catch (error) {
    console.error('Error handling subscription.canceled event:', error);
    throw error;
  }
}

/**
 * 根據 Polar Customer ID 找到對應的 Clerk User ID
 */
async function findClerkUserIdByCustomerId(customerId: string): Promise<string | null> {
  try {
    const userProfile = await userProfileService.getUserProfileByPolarCustomerId(customerId);
    return userProfile?.clerk_user_id || null;
  } catch (error) {
    console.error('Error finding Clerk user ID by customer ID:', error);
    return null;
  }
}
