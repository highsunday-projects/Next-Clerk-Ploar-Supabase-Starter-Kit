/**
 * Authentication Test API Route
 * 
 * 測試 Clerk 認證功能是否正常運作
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 取得認證資訊
    const { userId } = await auth();
    const user = await currentUser();

    // 詳細的用戶資訊除錯
    console.log('Auth Test - Full Debug Info:', {
      userId,
      userExists: !!user,
      userType: typeof user,
      userKeys: user ? Object.keys(user) : [],
      emailAddresses: user?.emailAddresses || null,
      emailAddressesType: typeof user?.emailAddresses,
      emailAddressesLength: user?.emailAddresses?.length || 0,
      emailAddressesIsArray: Array.isArray(user?.emailAddresses),
      firstEmailAddress: user?.emailAddresses?.[0] || null,
      firstEmailAddressType: typeof user?.emailAddresses?.[0],
      primaryEmailAddress: user?.emailAddresses?.[0]?.emailAddress || null,
      firstName: user?.firstName || null,
      lastName: user?.lastName || null,
      createdAt: user?.createdAt || null,
      updatedAt: user?.updatedAt || null,
      requestHeaders: Object.fromEntries(request.headers.entries()),
      requestUrl: request.url,
      requestMethod: request.method
    });

    // 如果有用戶，詳細檢查 emailAddresses 結構
    if (user && user.emailAddresses) {
      console.log('Email Addresses Deep Inspection:', {
        emailAddresses: user.emailAddresses,
        emailAddressesStringified: JSON.stringify(user.emailAddresses, null, 2),
        individualEmailAddresses: user.emailAddresses.map((ea, index) => ({
          index,
          emailAddress: ea.emailAddress,
          id: ea.id,
          verification: ea.verification
        }))
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        userExists: !!user,
        emailAddresses: user?.emailAddresses || null,
        emailCount: user?.emailAddresses?.length || 0,
        primaryEmail: user?.emailAddresses?.[0]?.emailAddress || null,
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
        fullName: user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user?.firstName || user?.lastName || null,
        createdAt: user?.createdAt || null,
        updatedAt: user?.updatedAt || null
      },
      message: 'Authentication test completed'
    });

  } catch (error) {
    console.error('Auth Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication test failed',
      details: error instanceof Error ? error.stack : 'Unknown error'
    }, { status: 500 });
  }
}