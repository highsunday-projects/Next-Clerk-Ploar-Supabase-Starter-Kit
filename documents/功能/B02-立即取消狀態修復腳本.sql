-- B02 - Polar 立即取消訂閱狀態修復腳本
-- 用於修復因立即取消邏輯錯誤導致的用戶狀態不正確問題

-- 1. 查找所有可能受影響的用戶
-- 這些用戶的特徵：subscription_status = 'active_ending' 但實際上應該是 'inactive'
SELECT 
  clerk_user_id, 
  subscription_status, 
  subscription_plan, 
  current_period_end, 
  polar_subscription_id,
  updated_at,
  created_at
FROM user_profiles 
WHERE subscription_status = 'active_ending' 
  AND polar_subscription_id IS NOT NULL
ORDER BY updated_at DESC;

-- 2. 檢查特定用戶的狀態（替換為實際的 polar_subscription_id）
-- SELECT 
--   clerk_user_id, 
--   subscription_status, 
--   subscription_plan, 
--   current_period_end, 
--   polar_subscription_id,
--   updated_at
-- FROM user_profiles 
-- WHERE polar_subscription_id = 'b4ac366e-eb82-4df5-a6ed-1b9b94acecda';

-- 3. 手動修正特定用戶狀態（在確認 Polar 後台狀態後執行）
-- 注意：執行前請先確認該訂閱在 Polar 後台確實已經立即取消
-- UPDATE user_profiles 
-- SET 
--   subscription_status = 'inactive',
--   subscription_plan = NULL,
--   monthly_usage_limit = 1000,
--   polar_subscription_id = NULL,
--   polar_customer_id = NULL,
--   current_period_end = NULL,
--   updated_at = NOW()
-- WHERE polar_subscription_id = 'b4ac366e-eb82-4df5-a6ed-1b9b94acecda'
--   AND subscription_status = 'active_ending';

-- 4. 批量修正所有立即取消但狀態錯誤的用戶
-- 警告：這個腳本會影響所有 active_ending 狀態的用戶
-- 請在執行前仔細檢查每個用戶在 Polar 後台的實際狀態
-- 
-- UPDATE user_profiles 
-- SET 
--   subscription_status = 'inactive',
--   subscription_plan = NULL,
--   monthly_usage_limit = 1000,
--   polar_subscription_id = NULL,
--   polar_customer_id = NULL,
--   current_period_end = NULL,
--   updated_at = NOW()
-- WHERE subscription_status = 'active_ending'
--   AND polar_subscription_id IS NOT NULL
--   AND updated_at > '2025-07-21 00:00:00'  -- 只修正今天的錯誤狀態
--   -- 請根據實際情況調整時間範圍

-- 5. 驗證修正結果
SELECT 
  COUNT(*) as total_users,
  subscription_status,
  subscription_plan
FROM user_profiles 
GROUP BY subscription_status, subscription_plan
ORDER BY subscription_status;

-- 6. 檢查是否還有異常狀態
-- 正常情況下，不應該有 subscription_plan = 'pro' 但 subscription_status = 'inactive' 的用戶
SELECT 
  clerk_user_id,
  subscription_status,
  subscription_plan,
  polar_subscription_id,
  current_period_end
FROM user_profiles 
WHERE (subscription_plan = 'pro' AND subscription_status = 'inactive')
   OR (subscription_plan IS NULL AND subscription_status IN ('active_recurring', 'active_ending'))
   OR (polar_subscription_id IS NOT NULL AND subscription_status = 'inactive');

-- 7. 檢查最近的狀態變更
SELECT 
  clerk_user_id,
  subscription_status,
  subscription_plan,
  polar_subscription_id,
  updated_at
FROM user_profiles 
WHERE updated_at > NOW() - INTERVAL '1 day'
ORDER BY updated_at DESC
LIMIT 20;

-- 使用說明：
-- 1. 先執行查詢腳本（1, 5, 6, 7）了解當前狀態
-- 2. 對於特定用戶，使用腳本 2 檢查詳細資訊
-- 3. 在 Polar 後台確認該用戶的訂閱確實已經立即取消
-- 4. 使用腳本 3 修正特定用戶，或使用腳本 4 批量修正
-- 5. 執行腳本 5, 6 驗證修正結果
-- 
-- 注意事項：
-- - 執行 UPDATE 語句前請務必備份資料庫
-- - 確認 Polar 後台的實際狀態再執行修正
-- - 建議先在測試環境執行驗證
-- - 記錄修正的用戶清單以便後續追蹤
