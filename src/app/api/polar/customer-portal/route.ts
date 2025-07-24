/**
 * Polar Customer Portal API 端點
 *
 * 處理用戶客戶門戶訪問請求
 * - 為現有 Polar 客戶創建客戶門戶訪問連結
 * - 支援多語言本地化
 */

import { auth } from '@clerk/nextjs/server';
import { polarApi } from '@/lib/polar';
import { userProfileService } from '@/lib/userProfileService';

/**
 * Map our locale codes to Polar supported locales
 * Polar supports: en, es, fr, de, it, pt, sv, da, nb, fi, ja, ko, zh-cn, zh-tw
 */
function mapToPolarLocale(locale?: string): string | undefined {
  if (!locale) return undefined;
  
  const localeMap: Record<string, string> = {
    'en': 'en',
    'zh-TW': 'zh-tw',
    'zh-CN': 'zh-cn'
  };
  
  return localeMap[locale];
}

/**
 * POST /api/polar/customer-portal
 * 創建客戶門戶訪問連結
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
    let requestData: { userId: string; locale?: string };
    try {
      requestData = await request.json();
    } catch {
      return Response.json({
        error: '無效的請求資料格式'
      }, { status: 400 });
    }

    // 確保只能為自己創建門戶連結
    if (requestData.userId !== userId) {
      return Response.json({
        error: '無權限為其他用戶創建門戶連結'
      }, { status: 403 });
    }

    // 獲取用戶當前訂閱資料
    const userProfile = await userProfileService.getOrCreateUserProfile(userId);

    // 檢查用戶是否有 Polar 客戶 ID
    if (!userProfile.polar_customer_id) {
      return Response.json({
        error: '找不到客戶資料，請確保您已有有效的訂閱'
      }, { status: 400 });
    }

    // Map locale to Polar supported locales
    const polarLocale = mapToPolarLocale(requestData.locale);

    // 使用 Polar SDK 創建客戶門戶會話
    const portalSession = await polarApi.customerSessions.create({
      customerId: userProfile.polar_customer_id,
      ...(polarLocale && { locale: polarLocale }) // Add locale if available
    });

    // 返回門戶 URL
    return Response.json({
      portalUrl: portalSession.customerPortalUrl,
      sessionId: portalSession.id
    });

  } catch (error) {
    console.error('Error creating customer portal:', error);

    // 處理特定錯誤
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Customer not found')) {
        return Response.json({
          error: '找不到客戶資料，請確保您已有有效的訂閱'
        }, { status: 400 });
      }
    }

    return Response.json({
      error: error instanceof Error ? error.message : '創建客戶門戶失敗，請稍後再試'
    }, { status: 500 });
  }
}