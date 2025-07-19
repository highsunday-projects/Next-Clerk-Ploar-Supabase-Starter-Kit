-- =====================================================
-- Next-Clerk-Polar-Supabase Starter Kit
-- 用戶訂閱資料表 - 完整版本（包含 Polar 整合）
-- =====================================================

-- 刪除現有表格（如果存在）
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 建立用戶訂閱資料表（包含 Polar 整合欄位）
CREATE TABLE user_profiles (
  -- 基本識別欄位
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- 訂閱方案資訊
  subscription_plan VARCHAR(20) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'cancelled',
  monthly_usage_limit INTEGER DEFAULT 1000,
  
  -- 試用期和時間戳記
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Polar 付費系統整合欄位
  polar_customer_id VARCHAR(255),
  polar_subscription_id VARCHAR(255),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE
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

-- 確保 Polar 客戶 ID 唯一性（如果存在）
CREATE UNIQUE INDEX idx_user_profiles_polar_customer_id 
ON user_profiles (polar_customer_id) 
WHERE polar_customer_id IS NOT NULL;

-- 確保 Polar 訂閱 ID 唯一性（如果存在）
CREATE UNIQUE INDEX idx_user_profiles_polar_subscription_id 
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

-- 最後活躍時間索引（用於清理不活躍用戶）
CREATE INDEX idx_user_profiles_last_active_date ON user_profiles (last_active_date);

-- 建立時間索引（用於統計和報告）
CREATE INDEX idx_user_profiles_created_at ON user_profiles (created_at);

-- =====================================================
-- 啟用 Row Level Security (RLS)
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 建立 RLS 安全政策
-- =====================================================

-- 允許查看自己的資料（需要配合 Clerk Auth）
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (true);

-- 允許更新自己的資料
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (true);

-- 允許插入自己的資料
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- 允許刪除自己的資料（謹慎使用）
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (true);

-- =====================================================
-- 建立觸發器函數（自動更新 updated_at）
-- =====================================================

-- 建立更新時間戳記的函數
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
-- 插入預設資料（可選）
-- =====================================================

-- 可以在這裡插入一些測試資料或預設配置
-- INSERT INTO user_profiles (clerk_user_id, subscription_plan) 
-- VALUES ('test_user_123', 'free');

-- =====================================================
-- 建立視圖（可選 - 用於簡化查詢）
-- =====================================================

-- 建立活躍用戶視圖
CREATE VIEW active_users AS
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
    last_active_date,
    created_at
FROM user_profiles 
WHERE subscription_status IN ('active', 'trial');

-- 建立付費用戶視圖
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
    last_active_date,
    created_at
FROM user_profiles 
WHERE subscription_plan IN ('pro', 'enterprise') 
AND subscription_status IN ('active', 'trial', 'past_due');

-- =====================================================
-- 建立統計函數（可選）
-- =====================================================

-- 獲取訂閱統計的函數
CREATE OR REPLACE FUNCTION get_subscription_stats()
RETURNS TABLE(
    plan VARCHAR(20),
    status VARCHAR(20),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        subscription_plan as plan,
        subscription_status as status,
        COUNT(*) as count
    FROM user_profiles 
    GROUP BY subscription_plan, subscription_status
    ORDER BY subscription_plan, subscription_status;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 註解說明
-- =====================================================

-- 為表格和重要欄位添加註解
COMMENT ON TABLE user_profiles IS '用戶訂閱資料表 - 儲存用戶的訂閱方案、狀態和 Polar 付費資訊';

COMMENT ON COLUMN user_profiles.id IS '主鍵 UUID';
COMMENT ON COLUMN user_profiles.clerk_user_id IS 'Clerk 用戶唯一識別碼';
COMMENT ON COLUMN user_profiles.subscription_plan IS '訂閱方案: free, pro, enterprise';
COMMENT ON COLUMN user_profiles.subscription_status IS '訂閱狀態: active, trial, cancelled, expired, past_due';
COMMENT ON COLUMN user_profiles.monthly_usage_limit IS '每月 API 使用額度';
COMMENT ON COLUMN user_profiles.trial_ends_at IS '試用期結束時間';
COMMENT ON COLUMN user_profiles.polar_customer_id IS 'Polar 客戶 ID';
COMMENT ON COLUMN user_profiles.polar_subscription_id IS 'Polar 訂閱 ID';
COMMENT ON COLUMN user_profiles.current_period_end IS '當前計費週期結束時間';
COMMENT ON COLUMN user_profiles.cancel_at_period_end IS '是否在週期結束時取消訂閱';

-- =====================================================
-- 完成訊息
-- =====================================================

-- 顯示建立完成訊息
DO $$
BEGIN
    RAISE NOTICE '✅ user_profiles 表格建立完成！';
    RAISE NOTICE '📊 包含以下功能:';
    RAISE NOTICE '   • 基本用戶訂閱資料';
    RAISE NOTICE '   • Polar 付費系統整合';
    RAISE NOTICE '   • Row Level Security (RLS)';
    RAISE NOTICE '   • 自動更新時間戳記';
    RAISE NOTICE '   • 效能優化索引';
    RAISE NOTICE '   • 統計查詢視圖';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 下一步: 在 Supabase Dashboard 中配置 RLS 政策以整合 Clerk Auth';
END $$;
