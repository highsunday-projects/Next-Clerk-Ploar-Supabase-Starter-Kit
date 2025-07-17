/**
 * Polar 付費系統客戶端配置
 * 
 * 提供 Polar API 客戶端實例和相關的工具函數
 */

// 注意：實際的 Polar SDK import 可能不同，這裡使用模擬的實作
// import { PolarApi, Configuration } from '@polar-sh/sdk';

// 環境變數驗證
const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;
const POLAR_ORGANIZATION_ID = process.env.POLAR_ORGANIZATION_ID;
const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET;
const POLAR_ENVIRONMENT = process.env.NEXT_PUBLIC_POLAR_ENVIRONMENT || 'sandbox';

if (!POLAR_ACCESS_TOKEN) {
  throw new Error('Missing POLAR_ACCESS_TOKEN environment variable');
}

if (!POLAR_ORGANIZATION_ID) {
  throw new Error('Missing POLAR_ORGANIZATION_ID environment variable');
}

if (!POLAR_WEBHOOK_SECRET) {
  throw new Error('Missing POLAR_WEBHOOK_SECRET environment variable');
}

// Polar API 配置（模擬實作）
// 實際使用時需要根據 Polar SDK 文檔進行正確的配置
export const polarApi = {
  // 模擬的 API 方法，實際使用時需要替換為真實的 Polar SDK
  customersGet: async (_params: { id: string }) => ({ data: {} }),
  customersCreate: async (_params: { customerCreate: unknown }) => ({ data: {} }),
  productsSearch: async (_params: { organizationId: string; isArchived: boolean }) => ({ data: { items: [] } }),
  productsGet: async (_params: { id: string }) => ({ data: {} }),
  checkoutsCreate: async (_params: { checkoutCreate: unknown }) => ({ data: { url: '' } }),
  subscriptionsSearch: async (_params: { customerId: string; organizationId: string }) => ({ data: { items: [] } }),
  subscriptionsGet: async (_params: { id: string }) => ({ data: {} }),
  subscriptionsCancel: async (_params: { id: string }) => ({ data: {} })
};

// 常數配置
export const POLAR_CONFIG = {
  ORGANIZATION_ID: POLAR_ORGANIZATION_ID,
  WEBHOOK_SECRET: POLAR_WEBHOOK_SECRET,
  ENVIRONMENT: POLAR_ENVIRONMENT,
  BASE_URL: POLAR_ENVIRONMENT === 'production' 
    ? 'https://polar.sh' 
    : 'https://sandbox.polar.sh'
} as const;

// Polar 產品 ID 對應表（需要在 Polar Dashboard 建立產品後更新）
export const POLAR_PRODUCT_IDS = {
  free: '', // 免費方案不需要 Polar 產品
  pro: process.env.POLAR_PRO_PRODUCT_ID || '',
  enterprise: process.env.POLAR_ENTERPRISE_PRODUCT_ID || ''
} as const;

// 訂閱方案對應的 Polar 產品配置
export const POLAR_SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free Plan',
    price: 0,
    currency: 'USD',
    interval: null,
    productId: null,
    features: [
      '1,000 次 API 呼叫/月',
      '基本功能存取',
      '社群支援',
      '標準文檔'
    ]
  },
  pro: {
    name: 'Pro Plan',
    price: 29,
    currency: 'USD',
    interval: 'month',
    productId: POLAR_PRODUCT_IDS.pro,
    features: [
      '10,000 次 API 呼叫/月',
      '進階功能存取',
      '優先支援',
      '詳細分析報告',
      'API 存取'
    ]
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 99,
    currency: 'USD',
    interval: 'month',
    productId: POLAR_PRODUCT_IDS.enterprise,
    features: [
      '100,000 次 API 呼叫/月',
      '所有功能存取',
      '24/7 專屬支援',
      '自訂整合',
      '進階分析',
      '白標解決方案'
    ]
  }
} as const;

/**
 * 驗證 Polar Webhook 簽名
 */
export function verifyPolarWebhook(
  payload: string,
  signature: string,
  webhookSecret: string = POLAR_CONFIG.WEBHOOK_SECRET
): boolean {
  try {
    // 這裡需要實作 Polar 的簽名驗證邏輯
    // 目前先返回 true，實際實作需要參考 Polar 文檔
    console.log('Verifying webhook with payload length:', payload.length, 'signature:', signature, 'secret length:', webhookSecret.length);
    return true;
  } catch (error) {
    console.error('Error verifying Polar webhook signature:', error);
    return false;
  }
}

/**
 * 根據訂閱方案獲取 Polar 產品 ID
 */
export function getPolarProductId(plan: 'free' | 'pro' | 'enterprise'): string | null {
  return POLAR_PRODUCT_IDS[plan] || null;
}

/**
 * 根據訂閱方案獲取方案配置
 */
export function getPolarPlanConfig(plan: 'free' | 'pro' | 'enterprise') {
  return POLAR_SUBSCRIPTION_PLANS[plan];
}

/**
 * 建立 Checkout URL
 */
export function buildCheckoutUrl(productId: string, customerId?: string): string {
  const baseUrl = POLAR_CONFIG.BASE_URL;
  const orgId = POLAR_CONFIG.ORGANIZATION_ID;
  
  let url = `${baseUrl}/checkout/${orgId}/${productId}`;
  
  if (customerId) {
    url += `?customer_id=${customerId}`;
  }
  
  return url;
}

/**
 * 建立 Customer Portal URL
 */
export function buildCustomerPortalUrl(customerId: string): string {
  const baseUrl = POLAR_CONFIG.BASE_URL;
  return `${baseUrl}/customer-portal/${customerId}`;
}

/**
 * 錯誤處理工具
 */
export class PolarError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'PolarError';
  }
}

/**
 * 處理 Polar API 錯誤
 */
export function handlePolarError(error: unknown): never {
  console.error('Polar API Error:', error);

  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response: { status: number; data?: { message?: string; code?: string } } }).response;
    const { status, data } = response;
    throw new PolarError(
      data?.message || `Polar API error: ${status}`,
      data?.code || status.toString(),
      data
    );
  }

  if (error instanceof Error) {
    throw new PolarError(error.message);
  }

  throw new PolarError('Unknown Polar API error');
}

/**
 * 格式化金額顯示
 */
export function formatPolarAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * 格式化訂閱狀態顯示
 */
export function formatSubscriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'incomplete': '未完成',
    'incomplete_expired': '已過期',
    'trialing': '試用中',
    'active': '訂閱中',
    'past_due': '逾期',
    'canceled': '已取消',
    'unpaid': '未付款'
  };
  
  return statusMap[status] || status;
}
