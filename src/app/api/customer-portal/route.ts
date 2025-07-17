/**
 * Polar Customer Portal API 路由
 * 
 * 生成 Customer Portal 連結讓用戶管理訂閱
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { polarService } from '@/lib/polarService';

/**
 * GET /api/customer-portal
 * 生成 Customer Portal 連結讓用戶管理訂閱
 */
export async function GET(): Promise<NextResponse> {
  try {
    // 驗證用戶身份
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '未授權的請求，請先登入'
      }, { status: 401 });
    }
    
    // 建立 Customer Portal URL
    const portalUrl = await polarService.createCustomerPortalUrl(userId);
    
    // 重定向到 Customer Portal
    return NextResponse.redirect(portalUrl);
    
  } catch (error) {
    console.error('Error in GET /api/customer-portal:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '無法存取客戶門戶'
    }, { status: 500 });
  }
}

/**
 * POST /api/customer-portal
 * 生成 Customer Portal URL（用於 AJAX 請求）
 */
export async function POST(): Promise<NextResponse> {
  try {
    // 驗證用戶身份
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '未授權的請求，請先登入'
      }, { status: 401 });
    }
    
    // 建立 Customer Portal URL
    const portalUrl = await polarService.createCustomerPortalUrl(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        portalUrl
      },
      message: '成功生成客戶門戶連結'
    });
    
  } catch (error) {
    console.error('Error in POST /api/customer-portal:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '無法存取客戶門戶'
    }, { status: 500 });
  }
}
