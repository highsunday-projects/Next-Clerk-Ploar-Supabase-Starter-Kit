---
title: Polar Webhook 訂閱狀態同步修正
author: 開發團隊
date: 2025-07-19
version: 1.0
uuid: b7821cd9e4f4427a9b3e8f2c5a8d9172
---

# SF06 - Polar Webhook 訂閱狀態同步修正 (簡化需求)

## 1. 功能概述 (Feature Overview)

目前 Polar 付費功能已成功串聯，用戶可以完成付費流程，但在訂閱成功後，Webhook 事件未能正確更新 Supabase 資料庫中的用戶訂閱資料，導致前端仍顯示舊的訂閱狀態。本功能旨在修正 Polar Webhook 事件處理邏輯，確保付費成功後能即時同步更新用戶的訂閱狀態到 Supabase 資料庫。

## 2. 需求描述 (Requirement/User Story)

- **As a** 完成 Polar 付費的用戶
- **I want** 付費成功後我的訂閱狀態立即在系統中更新
- **So that** 我可以馬上享受新方案的功能和額度，而不需要等待或手動刷新

## 3. 功能要求 (Functional Requirements)

- **基本要求**：
  - 要求 1：Polar Webhook 接收到 `subscription.created` 事件後，正確解析用戶資訊
  - 要求 2：根據 Polar 訂閱資料更新 Supabase `user_profiles` 表格中的相關欄位
  - 要求 3：更新欄位包含：`subscription_plan`、`subscription_status`、`polar_subscription_id`、`current_period_end`、`monthly_usage_limit`
  - 要求 4：前端 Dashboard 在用戶返回後顯示更新後的訂閱狀態
  - 要求 5：添加詳細的 Webhook 處理日誌，便於除錯

- **例外處理**：
  - 情況 1：Webhook 簽名驗證失敗時記錄錯誤並拒絕處理
  - 情況 2：找不到對應用戶時記錄警告但不中斷處理
  - 情況 3：資料庫更新失敗時記錄錯誤並嘗試重試

## 4. 驗收標準 (Acceptance Criteria)

- [ ] **Webhook 接收**：`/api/webhooks/polar` 端點能正確接收並驗證 Polar 事件
- [ ] **資料庫更新**：付費成功後 Supabase 中的用戶資料正確更新為新的訂閱方案
- [ ] **前端同步**：用戶返回 Dashboard 後立即看到更新的訂閱狀態和額度
- [ ] **錯誤處理**：異常情況下有適當的錯誤記錄和處理機制
- [ ] **日誌記錄**：完整的 Webhook 處理過程日誌，便於問題排查

## 5. 實作註記 (Implementation Notes)

- **技術規格**：Next.js 15 + Polar Webhooks + Supabase + TypeScript
- **API 介面**：
  - 端點：`/api/webhooks/polar` - 接收 Polar Webhook 事件
  - 輸入：Polar 事件 Payload（包含 subscription 和 customer 資訊）
  - 輸出：`{ success: boolean, message: string }`

- **資料庫更新邏輯**：
  - 根據 `event.data.customer.metadata.clerk_user_id` 找到對應用戶
  - 根據 `event.data.product_id` 判斷訂閱方案（pro/enterprise）
  - 更新 `user_profiles` 表格的相關欄位
  - 設定正確的 `monthly_usage_limit`（pro: 10,000, enterprise: 100,000）

- **需要檢查的 Webhook 事件**：
  - `subscription.created` - 訂閱建立成功
  - `checkout.completed` - 付費流程完成
  - `payment.succeeded` - 付款處理成功

- **外部相依性**：
  - Polar Webhook 配置正確
  - Supabase 資料庫連線正常
  - Clerk 用戶 ID 對應關係正確

## 6. 非功能性需求 (Non-Functional Requirements)

- **效能要求**：Webhook 處理在 3 秒內完成，資料庫更新在 1 秒內完成
- **安全性要求**：
  - 驗證 Polar Webhook 簽名確保事件來源可信
  - 確保只更新對應用戶的資料
- **可用性要求**：
  - 提供清晰的錯誤訊息便於除錯
  - 失敗時不影響其他用戶的正常使用
- **維護性要求**：
  - 詳細的日誌記錄便於問題排查
  - 模組化的事件處理邏輯便於擴展

## 7. 補充說明 (Additional Notes)

### 當前問題分析
根據現有文檔，Polar 付費功能已完成以下部分：
- ✅ Checkout 流程正常
- ✅ Webhook 端點存在
- ✅ 簽名驗證機制
- ❌ 資料庫更新邏輯可能有問題

### 重點檢查項目
1. **Webhook URL 配置**：確認 Polar Dashboard 中的 Webhook URL 正確指向應用程式
2. **事件類型**：確認訂閱了正確的 Webhook 事件類型
3. **用戶對應**：檢查 Clerk User ID 與 Polar Customer metadata 的對應關係
4. **資料庫權限**：確認 Webhook 處理有足夠權限更新 Supabase 資料

### 測試建議
1. 使用 Polar 測試模式完成一筆付費
2. 檢查伺服器日誌確認 Webhook 事件接收情況
3. 手動查詢 Supabase 資料庫確認資料是否更新
4. 前端重新載入確認狀態顯示

---

## 開發提醒 (Development Notes)

此功能是對現有 Polar 整合的關鍵修正，需要：

1. **問題定位**：先確認 Webhook 是否正確接收到事件
2. **資料對應**：檢查 Clerk User ID 與 Polar Customer 的對應關係
3. **資料庫更新**：確認 Supabase 更新邏輯和權限設定
4. **測試驗證**：使用 Polar 測試環境進行端到端測試

**開發流程建議**：
1. 檢查現有 Webhook 處理邏輯
2. 添加詳細的日誌記錄
3. 修正資料庫更新邏輯
4. 測試付費到狀態更新的完整流程
5. 驗證前端狀態同步