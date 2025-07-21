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
// SF09: 簡化的降級請求類型
interface PolarDowngradeRequest {
  targetPlan: 'free';
  userId: string;
}

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
    if (!requestData.targetPlan || requestData.targetPlan !== 'free') {
      return Response.json({
        error: '無效的目標方案，僅支援 free'
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

    // SF09: 檢查用戶是否有活躍的付費訂閱
    if (!userProfile.polar_subscription_id || userProfile.subscription_plan !== 'pro') {
      return Response.json({
        error: '您目前沒有活躍的付費訂閱'
      }, { status: 400 });
    }

    // SF09: 檢查是否已經是目標方案（只支援降級到免費版）
    // 此處已於驗證必要欄位時檢查，無需重複檢查

    // SF10 簡化版：檢查是否已經是即將到期狀態
    if (userProfile.subscription_status === 'active_ending') {
      return Response.json({
        error: '您已經安排取消訂閱，無需重複操作'
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

    // SF10 簡化版：更新資料庫狀態為即將到期
    await userProfileService.updateUserProfile(userId, {
      subscriptionStatus: 'active_ending'
    });

    console.log('Downgrade scheduled successfully for user:', userId);

    // 返回成功響應
    return Response.json({
      success: true,
      message: '訂閱取消已安排成功，將在當前計費週期結束時生效',
      effectiveDate: updatedSubscription.currentPeriodEnd
    });

  } catch (error) {
    console.error('Error scheduling subscription cancellation:', error);
    const isProd = process.env.NODE_ENV === 'production';
    return Response.json({
      error: isProd ? '安排取消訂閱失敗，請稍後再試' : (error instanceof Error ? error.message : '安排取消訂閱失敗，請稍後再試')
    }, { status: 500 });
  }
}
