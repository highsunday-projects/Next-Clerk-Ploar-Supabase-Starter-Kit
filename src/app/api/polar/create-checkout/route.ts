/**
 * Polar Checkout API 端點
 *
 * 處理用戶訂閱方案升級/切換請求
 * - 新用戶：建立 Polar Checkout Session
 * - 現有訂閱用戶：使用 Polar 訂閱更新 API
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { getPolarProductId, polarApi } from '@/lib/polar';
import { userProfileService } from '@/lib/userProfileService';
import type { PolarCheckoutRequest, UserProfile } from '@/types/supabase';

/**
 * POST /api/polar/create-checkout
 * 處理訂閱方案升級/切換請求
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
    if (!requestData.plan || !['pro'].includes(requestData.plan)) {
      return Response.json({
        error: '無效的訂閱方案，僅支援 pro'
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
        error: `您已經是專業版用戶`
      }, { status: 400 });
    }

    // 檢查是否為現有付費訂閱用戶（需要使用訂閱更新而非新建 Checkout）
    const hasActiveSubscription = userProfile.polar_subscription_id &&
                                  userProfile.subscription_plan !== 'free' &&
                                  userProfile.subscription_status === 'active';

    if (hasActiveSubscription) {
      // 現有訂閱用戶：使用訂閱更新 API
      return await handleSubscriptionUpdate(userProfile, requestData);
    } else {
      // 新用戶或免費用戶：建立新的 Checkout Session
      return await handleNewCheckout(userProfile, requestData, userId);
    }

  } catch (error) {
    console.error('Error in subscription management:', error);

    // 處理 AlreadyActiveSubscriptionError
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('AlreadyActiveSubscriptionError')) {
        return Response.json({
          error: '您已有活躍的訂閱，請使用訂閱管理功能來變更方案'
        }, { status: 400 });
      }
    }

    return Response.json({
      error: error instanceof Error ? error.message : '處理訂閱請求失敗，請稍後再試'
    }, { status: 500 });
  }
}

/**
 * 處理現有訂閱用戶的方案切換
 */
async function handleSubscriptionUpdate(
  userProfile: UserProfile,
  requestData: PolarCheckoutRequest
): Promise<Response> {
  try {
    // 檢查是否有有效的訂閱 ID
    if (!userProfile.polar_subscription_id) {
      return Response.json({
        error: '找不到有效的訂閱 ID，請聯繫客服'
      }, { status: 400 });
    }

    // 獲取目標產品 ID
    const targetProductId = getPolarProductId(requestData.plan);
    if (!targetProductId) {
      return Response.json({
        error: '找不到對應的產品配置，請聯繫客服'
      }, { status: 500 });
    }

    console.log('Updating subscription with params:', {
      subscriptionId: userProfile.polar_subscription_id,
      currentPlan: userProfile.subscription_plan,
      targetPlan: requestData.plan,
      targetProductId: targetProductId,
      prorationBehavior: 'prorate'
    });

    // 使用 Polar SDK 更新訂閱
    // 使用 'invoice' 會立即產生發票和計費差額
    const updatedSubscription = await polarApi.subscriptions.update({
      id: userProfile.polar_subscription_id,
      subscriptionUpdate: {
        productId: targetProductId,
        prorationBehavior: 'invoice' // 立即產生發票
      }
    });

    console.log('Subscription updated successfully:', {
      subscriptionId: updatedSubscription.id,
      newProductId: updatedSubscription.product?.id,
      amount: updatedSubscription.amount,
      currency: updatedSubscription.currency,
      status: updatedSubscription.status,
      currentPeriodStart: updatedSubscription.currentPeriodStart,
      currentPeriodEnd: updatedSubscription.currentPeriodEnd
    });

    // 返回成功響應（不需要重定向，直接更新）
    return Response.json({
      success: true,
      message: '訂閱方案已成功更新',
      subscriptionId: updatedSubscription.id,
      newPlan: requestData.plan
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error; // 讓上層處理錯誤
  }
}

/**
 * 處理新用戶或免費用戶的 Checkout 建立
 */
async function handleNewCheckout(
  userProfile: UserProfile,
  requestData: PolarCheckoutRequest,
  userId: string
): Promise<Response> {
  try {
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

    if (!userEmail) {
      return Response.json({
        error: '無法獲取用戶電子郵件，請確保您的帳戶已驗證電子郵件'
      }, { status: 400 });
    }

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
        upgrade_from: userProfile.subscription_plan || 'free'
      }
    });

    // 返回 Checkout URL
    return Response.json({
      checkoutUrl: checkout.url,
      sessionId: checkout.id
    });

  } catch (error) {
    console.error('Error creating new checkout:', error);
    throw error; // 讓上層處理錯誤
  }
}
