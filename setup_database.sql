-- =====================================================
-- Next-Clerk-Polar-Supabase Starter Kit 資料庫建立腳本
-- =====================================================
-- 此腳本可以直接在 Supabase SQL Editor 中執行
-- 建立日期: 2025-07-19
-- 版本: 3.0 (雙方案架構 - 免費 + 專業版)

-- =====================================================
-- 1. 清理舊資料（謹慎使用）
-- =====================================================

-- 刪除現有表格（如果存在）
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 刪除現有視圖
DROP VIEW IF EXISTS active_users CASCADE;
DROP VIEW IF EXISTS paid_users CASCADE;
DROP VIEW IF EXISTS expiring_subscriptions CASCADE;

-- 刪除現有函數
DROP FUNCTION IF EXISTS get_subscription_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- 2. 建立主要資料表
-- =====================================================

-- 建立用戶訂閱資料表
CREATE TABLE user_profiles (
  -- 基本識別欄位
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- 訂閱方案相關欄位
  subscription_plan VARCHAR(20) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',
  monthly_usage_limit INTEGER DEFAULT 1000,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Polar 付費系統整合欄位
  polar_customer_id VARCHAR(255),
  polar_subscription_id VARCHAR(255),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- 系統追蹤欄位
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. 建立約束條件
-- =====================================================

-- 訂閱方案檢查約束（雙方案架構）
ALTER TABLE user_profiles 
ADD CONSTRAINT valid_subscription_plan 
CHECK (subscription_plan IN ('free', 'pro'));

-- 訂閱狀態檢查約束
ALTER TABLE user_profiles 
ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('active', 'trial', 'cancelled', 'expired', 'past_due'));

-- 月使用額度必須為正數
ALTER TABLE user_profiles 
ADD CONSTRAINT positive_monthly_usage_limit 
CHECK (monthly_usage_limit > 0);

-- =====================================================
-- 4. 建立索引
-- =====================================================

-- 主要查詢索引
CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles (clerk_user_id);
CREATE INDEX idx_user_profiles_subscription_plan ON user_profiles (subscription_plan);
CREATE INDEX idx_user_profiles_subscription_status ON user_profiles (subscription_status);
CREATE INDEX idx_user_profiles_created_at ON user_profiles (created_at);
CREATE INDEX idx_user_profiles_last_active_date ON user_profiles (last_active_date);

-- Polar 相關索引（允許 NULL 值）
CREATE UNIQUE INDEX idx_polar_customer_id 
ON user_profiles (polar_customer_id) 
WHERE polar_customer_id IS NOT NULL;

CREATE UNIQUE INDEX idx_polar_subscription_id 
ON user_profiles (polar_subscription_id) 
WHERE polar_subscription_id IS NOT NULL;

-- 計費週期索引
CREATE INDEX idx_user_profiles_current_period_end 
ON user_profiles (current_period_end)
WHERE current_period_end IS NOT NULL;

-- =====================================================
-- 5. 啟用 Row Level Security (RLS)
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. 建立 RLS 安全政策
-- =====================================================

-- 用戶查看自己的資料
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT 
  USING (auth.uid()::text = clerk_user_id);

-- 用戶更新自己的資料
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE 
  USING (auth.uid()::text = clerk_user_id);

-- 用戶插入自己的資料
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid()::text = clerk_user_id);

-- 服務角色完整存取（用於 API 和 Webhook）
CREATE POLICY "Service role full access" ON user_profiles
  FOR ALL 
  USING (current_setting('role') = 'service_role');

-- =====================================================
-- 7. 建立觸發器函數
-- =====================================================

-- 自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 建立觸發器
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. 建立實用視圖
-- =====================================================

-- 活躍用戶視圖（最近 30 天）
CREATE VIEW active_users AS
SELECT 
    id,
    clerk_user_id,
    subscription_plan,
    subscription_status,
    monthly_usage_limit,
    last_active_date,
    created_at
FROM user_profiles
WHERE last_active_date >= NOW() - INTERVAL '30 days'
  AND subscription_status IN ('active', 'trial');

-- 付費用戶視圖（僅專業版）
CREATE VIEW paid_users AS
SELECT 
    id,
    clerk_user_id,
    subscription_plan,
    subscription_status,
    monthly_usage_limit,
    polar_customer_id,
    polar_subscription_id,
    current_period_end,
    cancel_at_period_end,
    created_at
FROM user_profiles
WHERE subscription_plan = 'pro'
  AND polar_subscription_id IS NOT NULL;

-- 即將到期的訂閱視圖（7 天內）
CREATE VIEW expiring_subscriptions AS
SELECT 
    id,
    clerk_user_id,
    subscription_plan,
    subscription_status,
    current_period_end,
    polar_subscription_id,
    cancel_at_period_end
FROM user_profiles
WHERE current_period_end IS NOT NULL
  AND current_period_end <= NOW() + INTERVAL '7 days'
  AND current_period_end > NOW()
  AND subscription_status = 'active';

-- =====================================================
-- 9. 建立統計函數
-- =====================================================

-- 訂閱統計函數
CREATE OR REPLACE FUNCTION get_subscription_stats()
RETURNS TABLE (
    plan VARCHAR(20),
    user_count BIGINT,
    active_count BIGINT,
    trial_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.subscription_plan as plan,
        COUNT(*) as user_count,
        COUNT(*) FILTER (WHERE up.subscription_status = 'active') as active_count,
        COUNT(*) FILTER (WHERE up.subscription_status = 'trial') as trial_count
    FROM user_profiles up
    GROUP BY up.subscription_plan
    ORDER BY 
        CASE up.subscription_plan 
            WHEN 'free' THEN 1 
            WHEN 'pro' THEN 2 
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. 設定權限
-- =====================================================

-- 授予 authenticated 角色基本權限
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 授予 service_role 完整權限
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- 授予視圖查詢權限
GRANT SELECT ON active_users TO authenticated;
GRANT SELECT ON paid_users TO authenticated;
GRANT SELECT ON expiring_subscriptions TO service_role;

-- 授予函數執行權限
GRANT EXECUTE ON FUNCTION get_subscription_stats() TO service_role;

-- =====================================================
-- 11. 資料庫架構建立完成（空資料庫）
-- =====================================================

-- 資料庫架構已建立完成，表格為空狀態
-- 用戶資料將透過應用程式 API 自動建立

-- =====================================================
-- 12. 驗證建立結果
-- =====================================================

-- 檢查表格是否建立成功
SELECT 
    'user_profiles' as table_name,
    0 as record_count,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE table_name = 'user_profiles' AND constraint_type = 'CHECK') as check_constraints,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE table_name = 'user_profiles' AND constraint_type = 'UNIQUE') as unique_constraints;

-- 檢查索引
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'user_profiles'
ORDER BY indexname;

-- 檢查視圖
SELECT 
    viewname,
    definition
FROM pg_views 
WHERE viewname IN ('active_users', 'paid_users', 'expiring_subscriptions');

-- 檢查 RLS 是否啟用
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- =====================================================
-- 完成訊息
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Next-Clerk-Polar-Supabase 資料庫建立完成！';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ user_profiles 表格已建立';
    RAISE NOTICE '✅ 雙方案架構約束條件已設定 (free, pro)';
    RAISE NOTICE '✅ 索引和 RLS 安全政策已建立';
    RAISE NOTICE '✅ 實用視圖和統計函數已建立';
    RAISE NOTICE '✅ 空資料庫架構已建立完成';
    RAISE NOTICE '================================================';
    RAISE NOTICE '接下來可以：';
    RAISE NOTICE '1. 測試 API 連接';
    RAISE NOTICE '2. 驗證 Clerk 整合';
    RAISE NOTICE '3. 設定 Polar Webhook';
    RAISE NOTICE '================================================';
END $$;