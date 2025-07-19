/**
 * Debug endpoint for Polar configuration
 */

import { NextResponse } from 'next/server';
import { getPolarProductId, POLAR_CONFIG } from '@/lib/polar';

export async function GET(): Promise<NextResponse> {
  try {
    const debug = {
      polarConfig: {
        organizationId: POLAR_CONFIG.ORGANIZATION_ID,
        hasAccessToken: !!process.env.POLAR_ACCESS_TOKEN,
        environment: process.env.NEXT_PUBLIC_POLAR_ENVIRONMENT
      },
      productIds: {
        free: getPolarProductId('free'),
        pro: getPolarProductId('pro'),
        enterprise: getPolarProductId('enterprise')
      },
      envVars: {
        POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN ? '***SET***' : 'NOT SET',
        POLAR_ORGANIZATION_ID: process.env.POLAR_ORGANIZATION_ID || 'NOT SET',
        POLAR_FREE_PRODUCT_ID: process.env.POLAR_FREE_PRODUCT_ID || 'NOT SET',
        POLAR_PRO_PRODUCT_ID: process.env.POLAR_PRO_PRODUCT_ID || 'NOT SET',
        POLAR_ENTERPRISE_PRODUCT_ID: process.env.POLAR_ENTERPRISE_PRODUCT_ID || 'NOT SET'
      }
    };

    return NextResponse.json({
      success: true,
      data: debug
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}