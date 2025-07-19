/**
 * Polar 降級請求 API 端點
 *
 * 處理用戶訂閱方案降級請求，支援：
 * - 企業版 → 專業版
 * - 企業版 → 免費版
 * - 專業版 → 免費版
 * 
 * 降級將在當前計費週期結束時生效
 */

import { auth } from '@clerk/nextjs/server';
import { polarApi } from '@/lib/polar';
import { userProfileService } from '@/lib/userProfileService';
import type { PolarDowngradeRequest } from '@/types/supabase';

/**
 * POST /api/polar/schedule-downgrade
 * 安排訂閱方案降級
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
    let requestData: PolarDowngradeRequest;
    try {
      requestData = await request.json();
    } catch {
      return Response.json({
        error: '無效的請求資料格式'
      }, { status: 400 });
    }

    // 驗證必要欄位
    if (!requestData.targetPlan || !['pro', 'free'].includes(requestData.targetPlan)) {
      return Response.json({
        error: '無效的目標方案，僅支援 pro 或 free'
      }, { status: 400 });
    }

    // 確保只能為自己安排降級
    if (requestData.userId !== userId) {
      return Response.json({
        error: '無權限為其他用戶安排降級'
      }, { status: 403 });
    }

    // 獲取用戶當前訂閱資料
    const userProfile = await userProfileService.getOrCreateUserProfile(userId);

    // 檢查用戶是否有活躍的付費訂閱
    if (!userProfile.polar_subscription_id || userProfile.subscription_plan === 'free') {
      return Response.json({
        error: '您目前沒有活躍的付費訂閱'
      }, { status: 400 });
    }

    // 檢查是否已經是目標方案
    if (userProfile.subscription_plan === requestData.targetPlan) {
      return Response.json({
        error: `您已經是 ${requestData.targetPlan === 'pro' ? '專業版' : '免費版'} 用戶`
      }, { status: 400 });
    }

    // 檢查降級邏輯是否有效
    const isValidDowngrade = validateDowngradeRequest(userProfile.subscription_plan, requestData.targetPlan);
    if (!isValidDowngrade) {
      return Response.json({
        error: '無效的降級請求'
      }, { status: 400 });
    }

    // 檢查是否已有待執行的降級
    if (userProfile.pending_downgrade_plan) {
      return Response.json({
        error: `您已安排降級到 ${userProfile.pending_downgrade_plan === 'pro' ? '專業版' : '免費版'}，請先取消現有降級`
      }, { status: 400 });
    }

    console.log('Scheduling downgrade:', {
      userId,
      currentPlan: userProfile.subscription_plan,
      targetPlan: requestData.targetPlan,
      subscriptionId: userProfile.polar_subscription_id
    });

    // 使用 Polar SDK 設定訂閱在期末取消
    const updatedSubscription = await polarApi.subscriptions.update({
      id: userProfile.polar_subscription_id,
      subscriptionUpdate: {
        cancelAtPeriodEnd: true
      }
    });

    console.log('Polar subscription updated for downgrade:', {
      subscriptionId: updatedSubscription.id,
      cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
      currentPeriodEnd: updatedSubscription.currentPeriodEnd
    });

    // 更新資料庫記錄降級資訊
    await userProfileService.updateUserProfile(userId, {
      cancelAtPeriodEnd: true,
      pendingDowngradePlan: requestData.targetPlan,
      downgradeEffectiveDate: updatedSubscription.currentPeriodEnd
    });

    console.log('Downgrade scheduled successfully for user:', userId);

    // 返回成功響應
    return Response.json({
      success: true,
      message: '降級已安排成功',
      downgradeInfo: {
        targetPlan: requestData.targetPlan,
        effectiveDate: updatedSubscription.currentPeriodEnd,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd
      }
    });

  } catch (error) {
    console.error('Error scheduling downgrade:', error);

    return Response.json({
      error: error instanceof Error ? error.message : '安排降級失敗，請稍後再試'
    }, { status: 500 });
  }
}

/**
 * 驗證降級請求是否有效
 */
function validateDowngradeRequest(currentPlan: string, targetPlan: string): boolean {
  const validDowngrades: Record<string, string[]> = {
    'pro': ['free'],                // 專業版只能降級到免費版
    'free': []                      // 免費版無法降級
  };

  return validDowngrades[currentPlan]?.includes(targetPlan) || false;
}
