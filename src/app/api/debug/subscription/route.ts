/**
 * 調試 API 端點 - 檢查訂閱方案切換相關配置
 * 
 * 用於診斷 Polar 整合和資料庫同步問題
 */

import { auth } from '@clerk/nextjs/server';
import { polarApi, getPolarProductId } from '@/lib/polar';
import { userProfileService } from '@/lib/userProfileService';

export async function GET(request: Request) {
  try {
    // 驗證用戶身份
    const { userId } = await auth();

    if (!userId) {
      return Response.json({
        error: '未授權的請求，請先登入'
      }, { status: 401 });
    }

    // 檢查環境變數配置
    const envConfig = {
      POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN ? '已設定' : '未設定',
      POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET ? '已設定' : '未設定',
      POLAR_PRO_PRODUCT_ID: process.env.POLAR_PRO_PRODUCT_ID || '未設定',
      POLAR_ENVIRONMENT: process.env.NEXT_PUBLIC_POLAR_ENVIRONMENT || 'sandbox',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '未設定'
    };

    // 檢查產品 ID 映射
    const productMapping = {
      pro: getPolarProductId('pro')
    };

    // 獲取用戶當前訂閱資料
    let userProfile;
    try {
      userProfile = await userProfileService.getOrCreateUserProfile(userId);
    } catch (error) {
      userProfile = { error: error instanceof Error ? error.message : '獲取用戶資料失敗' };
    }

    // 嘗試獲取 Polar 訂閱資料（如果用戶有訂閱）
    let polarSubscription = null;
    if (userProfile && userProfile.polar_subscription_id) {
      try {
        const subscription = await polarApi.subscriptions.get({
          id: userProfile.polar_subscription_id
        });
        polarSubscription = {
          id: subscription.id,
          status: subscription.status,
          productId: subscription.product?.id,
          amount: subscription.amount,
          currency: subscription.currency,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd
        };
      } catch (error) {
        polarSubscription = { error: error instanceof Error ? error.message : '獲取 Polar 訂閱失敗' };
      }
    }

    return Response.json({
      debug: {
        timestamp: new Date().toISOString(),
        userId,
        envConfig,
        productMapping,
        userProfile: userProfile ? {
          subscription_plan: userProfile.subscription_plan,
          subscription_status: userProfile.subscription_status,
          monthly_usage_limit: userProfile.monthly_usage_limit,
          polar_customer_id: userProfile.polar_customer_id,
          polar_subscription_id: userProfile.polar_subscription_id,
          current_period_end: userProfile.current_period_end,
          cancel_at_period_end: userProfile.cancel_at_period_end
        } : null,
        polarSubscription
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : '調試 API 失敗'
    }, { status: 500 });
  }
}

/**
 * 測試訂閱更新 API
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({
        error: '未授權的請求，請先登入'
      }, { status: 401 });
    }

    const { action, targetPlan } = await request.json();

    if (action === 'test_update' && targetPlan) {
      // 獲取用戶資料
      const userProfile = await userProfileService.getOrCreateUserProfile(userId);
      
      if (!userProfile.polar_subscription_id) {
        return Response.json({
          error: '用戶沒有活躍的 Polar 訂閱'
        }, { status: 400 });
      }

      // 獲取目標產品 ID
      const targetProductId = getPolarProductId(targetPlan);
      if (!targetProductId) {
        return Response.json({
          error: '無效的目標方案'
        }, { status: 400 });
      }

      // 測試訂閱更新
      try {
        const updatedSubscription = await polarApi.subscriptions.update({
          id: userProfile.polar_subscription_id,
          subscriptionUpdate: {
            productId: targetProductId,
            prorationBehavior: 'invoice'
          }
        });

        return Response.json({
          success: true,
          message: '訂閱更新測試成功',
          result: {
            subscriptionId: updatedSubscription.id,
            newProductId: updatedSubscription.product?.id,
            amount: updatedSubscription.amount,
            status: updatedSubscription.status
          }
        });

      } catch (error) {
        return Response.json({
          error: '訂閱更新測試失敗',
          details: error instanceof Error ? error.message : '未知錯誤'
        }, { status: 500 });
      }
    }

    return Response.json({
      error: '無效的測試動作'
    }, { status: 400 });

  } catch (error) {
    console.error('Debug POST API error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : '調試 API 失敗'
    }, { status: 500 });
  }
}
