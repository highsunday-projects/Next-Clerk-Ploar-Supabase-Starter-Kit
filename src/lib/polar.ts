/**
 * Polar 付費系統客戶端配置
 *
 * 提供 Polar API 客戶端實例和相關的工具函數
 */

import { Polar } from '@polar-sh/sdk';
import crypto from 'crypto';

// 環境變數驗證
const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;
const POLAR_ORGANIZATION_ID = process.env.NEXT_PUBLIC_POLAR_ORGANIZATION_ID;
const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET;
const POLAR_ENVIRONMENT = process.env.NEXT_PUBLIC_POLAR_ENVIRONMENT || 'sandbox';

// 在開發環境中，如果沒有設定環境變數，使用預設值避免錯誤
const isDevelopment = process.env.NODE_ENV === 'development';

if (!POLAR_ACCESS_TOKEN && !isDevelopment) {
  throw new Error('Missing POLAR_ACCESS_TOKEN environment variable');
}

if (!POLAR_ORGANIZATION_ID && !isDevelopment) {
  throw new Error('Missing POLAR_ORGANIZATION_ID environment variable');
}

if (!POLAR_WEBHOOK_SECRET && !isDevelopment) {
  throw new Error('Missing POLAR_WEBHOOK_SECRET environment variable');
}

// Polar API 客戶端實例
export const polarApi = new Polar({
  accessToken: POLAR_ACCESS_TOKEN || 'dev_token',
  server: POLAR_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
});

// 常數配置
export const POLAR_CONFIG = {
  ORGANIZATION_ID: POLAR_ORGANIZATION_ID || 'dev_org',
  WEBHOOK_SECRET: POLAR_WEBHOOK_SECRET || 'dev_secret',
  ENVIRONMENT: POLAR_ENVIRONMENT,
  BASE_URL: POLAR_ENVIRONMENT === 'production'
    ? 'https://polar.sh'
    : 'https://sandbox.polar.sh'
} as const;

// Polar 產品 ID 對應表（需要在 Polar Dashboard 建立產品後更新）
export const POLAR_PRODUCT_IDS = {
  free: '', // 免費方案不需要 Polar 產品
  pro: process.env.POLAR_PRO_PRODUCT_ID || ''
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
    price: 5,
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
  }
} as const;

/**
 * 驗證 Polar Webhook 簽名
 * Polar 使用 HMAC-SHA256 簽名驗證
 */
export function verifyPolarWebhook(
  payload: string,
  signature: string,
  webhookSecret: string = POLAR_CONFIG.WEBHOOK_SECRET
): boolean {
  try {
    // 移除 'sha256=' 前綴（如果存在）
    const cleanSignature = signature.replace(/^sha256=/, '');

    // 使用 HMAC-SHA256 計算簽名
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    // 使用時間安全的比較方法
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying Polar webhook signature:', error);
    return false;
  }
}

/**
 * 根據訂閱方案獲取 Polar 產品 ID
 */
export function getPolarProductId(plan: 'free' | 'pro'): string | null {
  return POLAR_PRODUCT_IDS[plan] || null;
}

/**
 * 根據訂閱方案獲取方案配置
 */
export function getPolarPlanConfig(plan: 'free' | 'pro') {
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
