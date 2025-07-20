/**
 * 調試用 API - 重置用戶訂閱狀態為基礎用戶
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { userProfileService } from '@/lib/userProfileService';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 重置為基礎用戶狀態
    await userProfileService.updateUserProfile(userId, {
      subscriptionPlan: null,
      subscriptionStatus: 'inactive',
      monthlyUsageLimit: 1000,
      polarSubscriptionId: undefined,
      polarCustomerId: undefined,
      currentPeriodEnd: undefined,
      cancelAtPeriodEnd: false
    });

    return NextResponse.json({ 
      success: true, 
      message: '用戶狀態已重置為基礎用戶' 
    });

  } catch (error) {
    console.error('Error resetting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}