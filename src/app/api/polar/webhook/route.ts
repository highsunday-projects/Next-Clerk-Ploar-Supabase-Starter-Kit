/**
 * Polar Webhook 處理程序
 * 
 * 處理來自 Polar 的 Webhook 事件，同步訂閱狀態到 Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPolarWebhook } from '@/lib/polar';
import { polarService } from '@/lib/polarService';

/**
 * POST /api/polar/webhook
 * 處理 Polar Webhook 事件
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.text();
    const signature = request.headers.get('polar-signature') || '';
    
    // 驗證 Webhook 簽名
    if (!verifyPolarWebhook(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({
        success: false,
        error: 'Invalid webhook signature'
      }, { status: 401 });
    }
    
    const event = JSON.parse(body);
    console.log('Received Polar webhook event:', event.type);
    
    // 處理不同的事件類型
    switch (event.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event);
        break;
        
      case 'subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
        
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event);
        break;
        
      case 'checkout.completed':
        await handleCheckoutCompleted(event);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });
    
  } catch (error) {
    console.error('Error processing Polar webhook:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    }, { status: 500 });
  }
}

/**
 * 處理訂閱建立事件
 */
async function handleSubscriptionCreated(event: any) {
  try {
    const { subscription, product } = event.data;
    
    // 從 subscription 中獲取客戶資訊
    const customerId = subscription.customer_id;
    
    // 這裡需要根據 customer_id 找到對應的 Clerk 用戶
    // 可能需要在資料庫中建立 customer_id -> clerk_user_id 的對應關係
    
    console.log('Subscription created:', {
      subscriptionId: subscription.id,
      customerId,
      productId: product.id,
      status: subscription.status
    });
    
    // TODO: 同步訂閱到 Supabase
    // await polarService.syncSubscriptionToSupabase(clerkUserId, subscription, product);
    
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

/**
 * 處理訂閱更新事件
 */
async function handleSubscriptionUpdated(event: any) {
  try {
    const { subscription, product } = event.data;
    
    console.log('Subscription updated:', {
      subscriptionId: subscription.id,
      status: subscription.status,
      productId: product.id
    });
    
    // TODO: 更新 Supabase 中的訂閱狀態
    
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

/**
 * 處理訂閱取消事件
 */
async function handleSubscriptionCancelled(event: any) {
  try {
    const { subscription } = event.data;
    
    console.log('Subscription cancelled:', {
      subscriptionId: subscription.id,
      customerId: subscription.customer_id
    });
    
    // TODO: 處理訂閱降級
    // await polarService.handleSubscriptionDowngrade(clerkUserId);
    
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
    throw error;
  }
}

/**
 * 處理結帳完成事件
 */
async function handleCheckoutCompleted(event: any) {
  try {
    const { checkout, subscription, product } = event.data;
    
    console.log('Checkout completed:', {
      checkoutId: checkout.id,
      subscriptionId: subscription?.id,
      productId: product.id,
      customerId: checkout.customer_id
    });
    
    // TODO: 處理結帳完成後的邏輯
    
  } catch (error) {
    console.error('Error handling checkout completed:', error);
    throw error;
  }
}