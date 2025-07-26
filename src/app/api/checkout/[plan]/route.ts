/**
 * Polar Checkout API 路由
 * 
 * 處理訂閱方案的付費流程，建立 Polar Checkout Session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { polarService } from '@/lib/polarService';

/**
 * GET /api/checkout/[plan]
 * 建立 Polar Checkout Session 並重定向到付款頁面
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ plan: string }> }
): Promise<NextResponse> {
  try {
    // 驗證用戶身份
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({
        success: false,
        error: '未授權的請求，請先登入'
      }, { status: 401 });
    }

    // 驗證訂閱方案
    const resolvedParams = await params;
    const plan = resolvedParams.plan;
    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({
        success: false,
        error: '無效的訂閱方案'
      }, { status: 400 });
    }
    
    // 獲取用戶資訊
    const email = user.emailAddresses[0]?.emailAddress;
    const name = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || user.lastName || undefined;
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: '無法獲取用戶電子郵件地址'
      }, { status: 400 });
    }
    
    // 建立 Checkout Session（目前只支援專業版）
    if (plan !== 'pro') {
      return NextResponse.json({
        success: false,
        error: '目前只支援專業版訂閱'
      }, { status: 400 });
    }

    const checkoutUrl = await polarService.createCheckoutSession(
      userId,
      plan as 'pro',
      email,
      name
    );
    
    // 重定向到 Polar Checkout 頁面
    return NextResponse.redirect(checkoutUrl);
    
  } catch (error) {
    console.error('Error in GET /api/checkout/[plan]:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '建立付費流程失敗'
    }, { status: 500 });
  }
}

/**
 * POST /api/checkout/[plan]
 * 建立 Checkout Session 並返回 URL（用於 AJAX 請求）
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ plan: string }> }
): Promise<NextResponse> {
  try {
    // 驗證用戶身份
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({
        success: false,
        error: '未授權的請求，請先登入'
      }, { status: 401 });
    }

    // 驗證訂閱方案
    const resolvedParams = await params;
    const plan = resolvedParams.plan;
    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({
        success: false,
        error: '無效的訂閱方案'
      }, { status: 400 });
    }
    
    // 獲取用戶資訊
    const email = user.emailAddresses[0]?.emailAddress;
    const name = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || user.lastName || undefined;
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: '無法獲取用戶電子郵件地址'
      }, { status: 400 });
    }
    
    // 建立 Checkout Session
    const checkoutUrl = await polarService.createCheckoutSession(
      userId,
      plan as 'pro',
      email,
      name
    );
    
    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl,
        plan,
        email
      },
      message: '成功建立付費流程'
    });
    
  } catch (error) {
    console.error('Error in POST /api/checkout/[plan]:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '建立付費流程失敗'
    }, { status: 500 });
  }
}
