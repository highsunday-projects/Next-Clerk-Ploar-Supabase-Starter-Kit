/**
 * Clerk Webhook 處理器
 * 
 * 處理 Clerk 用戶事件，包含用戶註冊、更新、刪除等事件
 * 自動建立和管理用戶的 Supabase 訂閱記錄
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { userProfileService } from '@/lib/userProfileService';

// Clerk Webhook 事件類型
type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{
      email_address: string;
      verification?: {
        status: string;
      };
    }>;
    first_name?: string;
    last_name?: string;
    created_at?: number;
    updated_at?: number;
  };
};

/**
 * POST /api/webhooks/clerk
 * 處理 Clerk Webhook 事件
 */
export async function POST(request: NextRequest) {
  try {
    // 獲取 Webhook 簽名驗證所需的標頭
    const headerPayload = await headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    // 檢查必要的標頭
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing required Svix headers');
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // 獲取請求內容
    const payload = await request.text();

    // 驗證 Webhook 簽名
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing CLERK_WEBHOOK_SECRET environment variable');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: ClerkWebhookEvent;
    try {
      const wh = new Webhook(webhookSecret);
      event = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 處理不同的事件類型
    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event);
        break;
      
      case 'user.updated':
        await handleUserUpdated(event);
        break;
      
      case 'user.deleted':
        await handleUserDeleted(event);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing Clerk webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 處理用戶建立事件
 * 自動為新用戶建立免費方案的訂閱記錄
 */
async function handleUserCreated(event: ClerkWebhookEvent) {
  try {
    const userId = event.data.id;
    
    console.log(`Processing user.created event for user: ${userId}`);

    // 建立預設的免費方案訂閱記錄
    const profile = await userProfileService.createUserProfile({
      clerkUserId: userId,
      subscriptionPlan: 'free',
      subscriptionStatus: 'active',
      monthlyUsageLimit: 1000
    });

    console.log(`Successfully created user profile for user: ${userId}`, profile);

  } catch (error) {
    console.error('Error handling user.created event:', error);
    
    // 如果用戶已存在，不視為錯誤
    if (error instanceof Error && error.message.includes('已存在')) {
      console.log('User profile already exists, skipping creation');
      return;
    }
    
    throw error;
  }
}

/**
 * 處理用戶更新事件
 * 更新用戶的最後活躍時間
 */
async function handleUserUpdated(event: ClerkWebhookEvent) {
  try {
    const userId = event.data.id;
    
    console.log(`Processing user.updated event for user: ${userId}`);

    // 更新最後活躍時間
    await userProfileService.updateLastActiveDate(userId);

    console.log(`Successfully updated last active date for user: ${userId}`);

  } catch (error) {
    console.error('Error handling user.updated event:', error);
    
    // 如果用戶不存在，嘗試建立新記錄
    if (error instanceof Error && error.message.includes('找不到')) {
      console.log('User profile not found, creating new profile');
      await handleUserCreated(event);
      return;
    }
    
    throw error;
  }
}

/**
 * 處理用戶刪除事件
 * 目前僅記錄事件，不刪除 Supabase 中的資料以保留歷史記錄
 */
async function handleUserDeleted(event: ClerkWebhookEvent) {
  try {
    const userId = event.data.id;
    
    console.log(`Processing user.deleted event for user: ${userId}`);
    
    // 目前不刪除 Supabase 中的用戶資料，僅記錄事件
    // 未來可以考慮將訂閱狀態設為 'cancelled' 或添加 deleted_at 欄位
    
    console.log(`User deletion event logged for user: ${userId}`);

  } catch (error) {
    console.error('Error handling user.deleted event:', error);
    throw error;
  }
}
