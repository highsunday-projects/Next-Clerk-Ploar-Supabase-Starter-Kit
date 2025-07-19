/**
 * Polar Checkout API 端點
 *
 * 處理用戶訂閱方案升級請求，建立 Polar Checkout Session
 * 使用 Polar SDK 直接建立 Checkout Session
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { getPolarProductId, polarApi } from '@/lib/polar';
import { userProfileService } from '@/lib/userProfileService';
import type { PolarCheckoutRequest } from '@/types/supabase';

/**
 * POST /api/polar/create-checkout
 * 使用 Polar SDK 建立 Checkout Session
 */
export async function POST(request: Request) {
  try {
    // 驗證用戶身份
    const { userId } = await auth();

    if (!userId) {
      return Response.json({
        error: '未授權的請求，請先登入'
      }, { status: 401 });
    }

    // 解析請求資料
    let requestData: PolarCheckoutRequest;
    try {
      requestData = await request.json();
    } catch {
      return Response.json({
        error: '無效的請求資料格式'
      }, { status: 400 });
    }

    // 驗證必要欄位
    if (!requestData.plan || !['pro', 'enterprise'].includes(requestData.plan)) {
      return Response.json({
        error: '無效的訂閱方案，僅支援 pro 或 enterprise'
      }, { status: 400 });
    }

    // 確保只能為自己建立 Checkout
    if (requestData.userId !== userId) {
      return Response.json({
        error: '無權限為其他用戶建立 Checkout'
      }, { status: 403 });
    }

    // 獲取用戶當前訂閱資料
    const userProfile = await userProfileService.getOrCreateUserProfile(userId);

    // 檢查是否已經是目標方案
    if (userProfile.subscription_plan === requestData.plan) {
      return Response.json({
        error: `您已經是 ${requestData.plan === 'pro' ? '專業版' : '企業版'} 用戶`
      }, { status: 400 });
    }

    // 獲取 Polar 產品 ID
    const productId = getPolarProductId(requestData.plan);
    if (!productId) {
      return Response.json({
        error: '找不到對應的產品配置，請聯繫客服'
      }, { status: 500 });
    }

    // 獲取用戶 email（從 Clerk）
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses?.[0]?.emailAddress;

    // 使用 Polar SDK 建立 Checkout Session
    const successUrl = requestData.successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`;

    const checkout = await polarApi.checkouts.create({
      products: [productId],
      successUrl: successUrl,
      customerEmail: userEmail,
      externalCustomerId: userId,
      metadata: {
        clerk_user_id: userId,
        subscription_plan: requestData.plan,
        upgrade_from: userProfile.subscription_plan
      }
    });

    // 返回 Checkout URL
    return Response.json({
      checkoutUrl: checkout.url,
      sessionId: checkout.id
    });

  } catch (error) {
    console.error('Error creating Polar checkout:', error);

    return Response.json({
      error: error instanceof Error ? error.message : '建立付費流程失敗，請稍後再試'
    }, { status: 500 });
  }
}

// GET 函數已移除，只保留 POST 函數用於建立 Checkout
