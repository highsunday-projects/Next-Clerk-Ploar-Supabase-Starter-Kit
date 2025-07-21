-- =====================================================
-- Next-Clerk-Polar-Supabase 簡化資料庫建立腳本
-- =====================================================
-- 建立日期: 2025-07-21
-- 版本: 5.0 (簡化訂閱邏輯)

-- =====================================================
-- 1. 清理舊資料（謹慎使用）
-- =====================================================

DROP TABLE IF EXISTS user_profiles CASCADE;

-- =====================================================
-- 2. 建立主要資料表
-- =====================================================

CREATE TABLE user_profiles (
  -- 基本識別欄位
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- 簡化後的訂閱狀態欄位
  subscription_status VARCHAR(20) DEFAULT 'inactive' NOT NULL,
  subscription_plan VARCHAR(20) DEFAULT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE,
  
  -- 其他業務欄位
  monthly_usage_limit INTEGER DEFAULT 1000,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Polar 付費系統整合欄位
  polar_customer_id VARCHAR(255),
  polar_subscription_id VARCHAR(255),
  
  -- 系統追蹤欄位
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. 建立約束條件
-- =====================================================

-- 訂閱狀態檢查約束（3種狀態）
ALTER TABLE user_profiles 
ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('active_recurring', 'active_ending', 'inactive'));

-- 訂閱方案檢查約束
ALTER TABLE user_profiles 
ADD CONSTRAINT valid_subscription_plan 
CHECK (subscription_plan IS NULL OR subscription_plan = 'pro');

-- 月使用額度必須為正數
ALTER TABLE user_profiles 
ADD CONSTRAINT positive_monthly_usage_limit 
CHECK (monthly_usage_limit > 0);

-- 業務邏輯約束：活躍狀態必須有方案
ALTER TABLE user_profiles 
ADD CONSTRAINT active_status_requires_plan 
CHECK (
  (subscription_status = 'inactive' AND subscription_plan IS NULL) OR
  (subscription_status IN ('active_recurring', 'active_ending') AND subscription_plan IS NOT NULL)
);

-- =====================================================
-- 4. 建立索引
-- =====================================================

CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles (clerk_user_id);
CREATE INDEX idx_user_profiles_subscription_status ON user_profiles (subscription_status);
CREATE INDEX idx_user_profiles_subscription_plan ON user_profiles (subscription_plan);
CREATE INDEX idx_subscription_status_plan ON user_profiles (subscription_status, subscription_plan);

CREATE UNIQUE INDEX idx_polar_customer_id 
ON user_profiles (polar_customer_id) 
WHERE polar_customer_id IS NOT NULL;

CREATE UNIQUE INDEX idx_polar_subscription_id 
ON user_profiles (polar_subscription_id) 
WHERE polar_subscription_id IS NOT NULL;

-- =====================================================
-- 5. 啟用 Row Level Security
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

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

-- 服務角色完整存取
CREATE POLICY "Service role full access" ON user_profiles
  FOR ALL 
  USING (current_setting('role') = 'service_role');

-- =====================================================
-- 6. 建立觸發器
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. 設定權限
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;