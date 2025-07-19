-- =====================================================
-- Next-Clerk-Polar-Supabase Starter Kit 資料庫架構
-- =====================================================
-- 此腳本建立完整的用戶訂閱資料表，支援 Polar 付費系統整合
-- 建立日期: 2025-07-19
-- 版本: 2.0 (包含 Polar 整合)

-- 刪除現有表格（如果存在）
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 建立用戶訂閱資料表（包含 Polar 整合欄位）
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
-- 建立約束條件
-- =====================================================

-- 訂閱方案檢查約束
ALTER TABLE user_profiles 
ADD CONSTRAINT valid_subscription_plan 
CHECK (subscription_plan IN ('free', 'pro', 'enterprise'));

-- 訂閱狀態檢查約束（新增 past_due 狀態）
ALTER TABLE user_profiles 
ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('active', 'trial', 'cancelled', 'expired', 'past_due'));

-- 月使用額度必須為正數
ALTER TABLE user_profiles 
ADD CONSTRAINT positive_monthly_usage_limit 
CHECK (monthly_usage_limit > 0);

-- Polar 客戶 ID 唯一性約束（允許 NULL）
CREATE UNIQUE INDEX idx_polar_customer_id 
ON user_profiles (polar_customer_id) 
WHERE polar_customer_id IS NOT NULL;

-- Polar 訂閱 ID 唯一性約束（允許 NULL）
CREATE UNIQUE INDEX idx_polar_subscription_id 
ON user_profiles (polar_subscription_id) 
WHERE polar_subscription_id IS NOT NULL;

-- =====================================================
-- 建立索引以提升查詢效能
-- =====================================================

-- Clerk 用戶 ID 索引（主要查詢欄位）
CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles (clerk_user_id);

-- 訂閱方案索引（用於統計和查詢）
CREATE INDEX idx_user_profiles_subscription_plan ON user_profiles (subscription_plan);

-- 訂閱狀態索引（用於狀態篩選）
CREATE INDEX idx_user_profiles_subscription_status ON user_profiles (subscription_status);

-- 建立時間索引（用於時間範圍查詢）
CREATE INDEX idx_user_profiles_created_at ON user_profiles (created_at);

-- 最後活躍時間索引（用於用戶活躍度分析）
CREATE INDEX idx_user_profiles_last_active_date ON user_profiles (last_active_date);

-- 計費週期結束時間索引（用於續費提醒）
CREATE INDEX idx_user_profiles_current_period_end ON user_profiles (current_period_end)
WHERE current_period_end IS NOT NULL;

-- =====================================================
-- 啟用 Row Level Security (RLS)
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 建立 RLS 安全政策
-- =====================================================

-- 查看政策：用戶只能查看自己的資料
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT 
  USING (auth.uid()::text = clerk_user_id);

-- 更新政策：用戶只能更新自己的資料
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE 
  USING (auth.uid()::text = clerk_user_id);

-- 插入政策：用戶只能插入自己的資料
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid()::text = clerk_user_id);

-- 刪除政策：用戶只能刪除自己的資料（通常不建議允許）
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE 
  USING (auth.uid()::text = clerk_user_id);

-- 服務角色政策：允許服務端完整存取（用於 Webhook 和管理操作）
CREATE POLICY "Service role full access" ON user_profiles
  FOR ALL 
  USING (current_setting('role') = 'service_role');

-- =====================================================
-- 建立觸發器函數
-- =====================================================

-- 自動更新 updated_at 欄位的函數
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
-- 建立有用的視圖
-- =====================================================

-- 活躍用戶視圖（最近 30 天有活動）
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

-- 付費用戶視圖
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
WHERE subscription_plan IN ('pro', 'enterprise')
  AND polar_subscription_id IS NOT NULL;

-- 即將到期的訂閱視圖（7 天內到期）
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
-- 插入範例資料（可選，用於測試）
-- =====================================================

-- 範例免費用戶
INSERT INTO user_profiles (
    clerk_user_id,
    subscription_plan,
    subscription_status,
    monthly_usage_limit
) VALUES (
    'user_example_free_123',
    'free',
    'active',
    1000
) ON CONFLICT (clerk_user_id) DO NOTHING;

-- 範例專業版用戶
INSERT INTO user_profiles (
    clerk_user_id,
    subscription_plan,
    subscription_status,
    monthly_usage_limit,
    polar_customer_id,
    polar_subscription_id,
    current_period_end,
    cancel_at_period_end
) VALUES (
    'user_example_pro_456',
    'pro',
    'active',
    10000,
    'cus_example_polar_customer',
    'sub_example_polar_subscription',
    NOW() + INTERVAL '30 days',
    false
) ON CONFLICT (clerk_user_id) DO NOTHING;

-- =====================================================
-- 建立統計查詢函數
-- =====================================================

-- 獲取訂閱統計的函數
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
            WHEN 'enterprise' THEN 3 
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 權限設定
-- =====================================================

-- 授予 authenticated 角色基本權限
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 授予 service_role 完整權限（用於 API 和 Webhook）
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- 授予視圖查詢權限
GRANT SELECT ON active_users TO authenticated;
GRANT SELECT ON paid_users TO authenticated;
GRANT SELECT ON expiring_subscriptions TO service_role;

-- 授予統計函數執行權限
GRANT EXECUTE ON FUNCTION get_subscription_stats() TO service_role;

-- =====================================================
-- 完成訊息
-- =====================================================

-- 顯示建立完成訊息
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Next-Clerk-Polar-Supabase 資料庫架構建立完成！';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '✅ user_profiles 表格已建立（包含 Polar 整合欄位）';
    RAISE NOTICE '✅ 約束條件和索引已建立';
    RAISE NOTICE '✅ Row Level Security 已啟用';
    RAISE NOTICE '✅ 觸發器和視圖已建立';
    RAISE NOTICE '✅ 範例資料已插入';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '下一步：';
    RAISE NOTICE '1. 在 Supabase Dashboard 中執行此 SQL';
    RAISE NOTICE '2. 確認 RLS 政策符合您的安全需求';
    RAISE NOTICE '3. 測試 API 連接和資料操作';
    RAISE NOTICE '=================================================';
END $$;
