import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userProfileService } from '@/lib/userProfileService';

export async function GET() {
  try {
    // 驗證用戶身份
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '未授權存取'
      }, { status: 401 });
    }

    // 獲取用戶資料
    const userProfile = await userProfileService.getUserProfile(userId);
    
    if (!userProfile) {
      return NextResponse.json({
        success: false,
        error: '找不到用戶資料'
      }, { status: 404 });
    }

    // 返回詳細的用戶資料用於調試
    return NextResponse.json({
      success: true,
      data: {
        userId,
        userProfile,
        // 特別關注的欄位
        debugInfo: {
          polar_subscription_id: userProfile.polar_subscription_id,
          subscription_status: userProfile.subscription_status,
          cancel_at_period_end: userProfile.cancel_at_period_end,
          current_period_end: userProfile.current_period_end,
          subscription_plan: userProfile.subscription_plan
        }
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
