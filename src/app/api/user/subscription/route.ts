/**
 * 用戶訂閱資料 API 路由
 * 
 * 處理用戶訂閱資料的 CRUD 操作
 * GET: 獲取用戶訂閱資料
 * POST: 建立新的用戶訂閱記錄
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userProfileService } from '@/lib/userProfileService';
import type { UserProfileResponse, CreateUserProfileRequest } from '@/types/supabase';

/**
 * GET /api/user/subscription
 * 獲取當前用戶的訂閱資料
 */
export async function GET(): Promise<NextResponse<UserProfileResponse>> {
  try {
    // 驗證用戶身份
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '未授權的請求，請先登入'
      }, { status: 401 });
    }

    // 獲取或建立用戶訂閱記錄
    const profile = await userProfileService.getOrCreateUserProfile(userId);

    return NextResponse.json({
      success: true,
      data: profile,
      message: '成功獲取用戶訂閱資料'
    });

  } catch (error) {
    console.error('Error in GET /api/user/subscription:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '獲取訂閱資料失敗'
    }, { status: 500 });
  }
}

/**
 * POST /api/user/subscription
 * 建立新的用戶訂閱記錄
 */
export async function POST(request: NextRequest): Promise<NextResponse<UserProfileResponse>> {
  try {
    // 驗證用戶身份
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '未授權的請求，請先登入'
      }, { status: 401 });
    }

    // 解析請求資料
    let requestData: CreateUserProfileRequest;
    try {
      requestData = await request.json();
    } catch {
      return NextResponse.json({
        success: false,
        error: '無效的請求資料格式'
      }, { status: 400 });
    }

    // 驗證必要欄位
    if (!requestData.clerkUserId) {
      requestData.clerkUserId = userId;
    }

    // 確保只能建立自己的訂閱記錄
    if (requestData.clerkUserId !== userId) {
      return NextResponse.json({
        success: false,
        error: '無權限建立其他用戶的訂閱記錄'
      }, { status: 403 });
    }

    // 建立用戶訂閱記錄
    const profile = await userProfileService.createUserProfile(requestData);

    return NextResponse.json({
      success: true,
      data: profile,
      message: '成功建立用戶訂閱記錄'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/user/subscription:', error);
    
    // 處理特定錯誤
    if (error instanceof Error && error.message.includes('已存在')) {
      return NextResponse.json({
        success: false,
        error: '用戶訂閱記錄已存在'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '建立訂閱記錄失敗'
    }, { status: 500 });
  }
}

/**
 * PATCH /api/user/subscription
 * 更新用戶訂閱資料
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<UserProfileResponse>> {
  try {
    // 驗證用戶身份
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '未授權的請求，請先登入'
      }, { status: 401 });
    }

    // 解析請求資料
    let updateData;
    try {
      updateData = await request.json();
    } catch {
      return NextResponse.json({
        success: false,
        error: '無效的請求資料格式'
      }, { status: 400 });
    }

    // 更新用戶訂閱記錄
    const profile = await userProfileService.updateUserProfile(userId, updateData);

    return NextResponse.json({
      success: true,
      data: profile,
      message: '成功更新用戶訂閱資料'
    });

  } catch (error) {
    console.error('Error in PATCH /api/user/subscription:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '更新訂閱資料失敗'
    }, { status: 500 });
  }
}
