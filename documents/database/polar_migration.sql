-- Polar 付費系統整合 - 資料庫遷移腳本
-- 此腳本為現有的 user_profiles 表格添加 Polar 相關欄位

-- 添加 Polar 相關欄位到 user_profiles 表格
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS polar_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS polar_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS polar_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

-- 為 Polar Customer ID 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_user_profiles_polar_customer_id 
ON user_profiles(polar_customer_id);

-- 為 Polar Subscription ID 建立索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_polar_subscription_id 
ON user_profiles(polar_subscription_id);

-- 為 Polar Product ID 建立索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_polar_product_id 
ON user_profiles(polar_product_id);

-- 添加註解說明新欄位的用途
COMMENT ON COLUMN user_profiles.polar_customer_id IS 'Polar 平台的客戶 ID，用於關聯付費系統';
COMMENT ON COLUMN user_profiles.polar_subscription_id IS 'Polar 平台的訂閱 ID，用於追蹤訂閱狀態';
COMMENT ON COLUMN user_profiles.polar_product_id IS 'Polar 平台的產品 ID，用於識別訂閱方案';
COMMENT ON COLUMN user_profiles.last_payment_date IS '最後一次付款日期';
COMMENT ON COLUMN user_profiles.next_billing_date IS '下次計費日期';

-- 更新 updated_at 觸發器（如果存在的話）
-- 確保新欄位的更新也會觸發 updated_at 的自動更新

-- 驗證遷移結果
-- 檢查新欄位是否成功添加
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN (
  'polar_customer_id', 
  'polar_subscription_id', 
  'polar_product_id', 
  'last_payment_date', 
  'next_billing_date'
)
ORDER BY column_name;
