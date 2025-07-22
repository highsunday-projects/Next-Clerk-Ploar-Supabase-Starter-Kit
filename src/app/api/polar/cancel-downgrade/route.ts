/**
 * Polar 取消降級 API 端點
 *
 * 允許用戶取消已安排的降級操作，恢復正常的訂閱續費
 */

import { auth } from '@clerk/nextjs/server';
import { polarApi } from '@/lib/polar';
import { userProfileService } from '@/lib/userProfileService';
// SF10 簡化版：移除不需要的類型導入

/**
 * POST /api/polar/cancel-downgrade
 * 取消已安排的降級
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

    // SF10 簡化版：不需要解析請求資料，直接處理取消降級
    console.log('Processing cancel downgrade request for user:', userId);

    // 獲取用戶當前訂閱資料
    const userProfile = await userProfileService.getOrCreateUserProfile(userId);

    // SF10 簡化版：檢查用戶是否有活躍的付費訂閱
    if (!userProfile.polar_subscription_id || userProfile.subscription_plan !== 'pro') {
      return Response.json({
        error: '您目前沒有活躍的付費訂閱'
      }, { status: 400 });
    }

    // SF10 簡化版：檢查是否為即將到期狀態
    if (userProfile.subscription_status !== 'active_ending') {
      return Response.json({
        error: '您目前沒有待執行的降級操作'
      }, { status: 400 });
    }

    console.log('Cancelling downgrade:', {
      userId,
      currentPlan: userProfile.subscription_plan,
      currentStatus: userProfile.subscription_status,
      subscriptionId: userProfile.polar_subscription_id
    });

    // 使用 Polar SDK 取消期末取消設定
    const updatedSubscription = await polarApi.subscriptions.update({
      id: userProfile.polar_subscription_id,
      subscriptionUpdate: {
        cancelAtPeriodEnd: false
      }
    });

    console.log('Polar subscription updated to cancel downgrade:', {
      subscriptionId: updatedSubscription.id,
      cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd
    });

    // SF10 簡化版：更新資料庫狀態為會續訂
    await userProfileService.updateUserProfile(userId, {
      subscriptionStatus: 'active_recurring'
    });

    console.log('Downgrade cancelled successfully for user:', userId);

    // 返回成功響應
    return Response.json({
      success: true,
      message: '降級已成功取消，您的訂閱將正常續費'
    });

  } catch (error) {
    console.error('Error cancelling downgrade:', error);

    return Response.json({
      error: error instanceof Error ? error.message : '取消降級失敗，請稍後再試'
    }, { status: 500 });
  }
}
