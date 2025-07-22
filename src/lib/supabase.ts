/**
 * Supabase 客戶端配置
 * 
 * 此檔案配置 Supabase 客戶端連接，提供資料庫操作的基礎設定。
 * 包含客戶端和服務端的不同配置，以及錯誤處理機制。
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// 環境變數檢查
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * 客戶端 Supabase 實例
 * 用於前端組件中的資料庫操作，使用匿名金鑰
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

/**
 * 服務端 Supabase 實例
 * 用於 API 路由和伺服器端操作，使用服務角色金鑰
 * 具有完整的資料庫存取權限，繞過 RLS
 */
export const supabaseAdmin = (() => {
  if (!supabaseServiceRoleKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY - admin operations will be limited');
    return null;
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
})();

/**
 * 資料庫操作錯誤處理
 */
export function handleSupabaseError(error: unknown): never {
  console.error('Supabase error:', error);

  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message?: string };
    switch (supabaseError.code) {
      case 'PGRST116':
        throw new Error('找不到指定的資料記錄');
      case '23505':
        throw new Error('資料已存在，無法重複建立');
      case '23503':
        throw new Error('參照的資料不存在');
      case '42501':
        throw new Error('權限不足，無法執行此操作');
      default:
        throw new Error(`資料庫操作失敗: ${supabaseError.message || '未知錯誤'}`);
    }
  }

  if (error instanceof Error) {
    throw new Error(error.message);
  }

  throw new Error('資料庫連接失敗');
}

/**
 * 檢查 Supabase 連接狀態
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('user_profiles').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * 取得 Supabase 客戶端實例
 * 根據執行環境返回適當的客戶端
 */
export function getSupabaseClient(useAdmin = false) {
  if (useAdmin) {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client is not available');
    }
    return supabaseAdmin;
  }
  return supabase;
}

/**
 * 資料庫表格名稱常數
 */
export const TABLES = {
  USER_PROFILES: 'user_profiles'
} as const;

/**
 * 常用的資料庫查詢選項
 */
export const QUERY_OPTIONS = {
  // 用戶訂閱資料的標準欄位 - SF10 簡化版：移除 cancel_at_period_end
  USER_PROFILE_FIELDS: `
    id,
    clerk_user_id,
    subscription_plan,
    subscription_status,
    monthly_usage_limit,
    trial_ends_at,
    last_active_date,
    created_at,
    updated_at,
    polar_customer_id,
    polar_subscription_id,
    current_period_end
  `.replace(/\s+/g, ' ').trim()
} as const;

/**
 * 預設的用戶訂閱設定（SF09 簡化邏輯）
 */
export const DEFAULT_USER_PROFILE = {
  subscription_plan: null as const,
  subscription_status: 'inactive' as const,
  monthly_usage_limit: 1000,
  trial_ends_at: null
} as const;

/**
 * Supabase 實時訂閱配置
 */
export const REALTIME_CONFIG = {
  // 用戶訂閱資料變更通知
  USER_PROFILE_CHANGES: 'user_profile_changes'
} as const;

/**
 * 建立實時訂閱
 */
export function createRealtimeSubscription(
  table: string,
  filter?: string,
  callback?: (payload: unknown) => void
) {
  return supabase
    .channel(`realtime:${table}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table,
        filter 
      }, 
      callback || (() => {})
    )
    .subscribe();
}

/**
 * 清理實時訂閱
 */
export function cleanupRealtimeSubscription(subscription: unknown) {
  if (subscription) {
    supabase.removeChannel(subscription as Parameters<typeof supabase.removeChannel>[0]);
  }
}
