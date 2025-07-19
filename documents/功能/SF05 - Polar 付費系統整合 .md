---
title: Polar 付費系統整合
author: 開發團隊
date: 2025-07-19
version: 1.0
uuid: 93450ca6afdc445db021df46a5bd7391
---

# SF05 - Polar 付費系統整合 (簡化需求)

## 1. 功能概述 (Feature Overview)

本功能旨在整合 Polar 付費系統，讓使用者能夠從免費方案升級到付費方案（專業版 $5/月、企業版 $10/月）。透過 Polar 提供的 API 和 Checkout 流程，實現完整的訂閱付費功能，包含付款處理、訂閱狀態管理和 Webhook 事件處理，為 SaaS 平台建立穩定的營收來源。

## 2. 需求描述 (Requirement/User Story)

- **As a** 使用免費方案的用戶
- **I want** 能夠點選「升級到專業版」或「升級到企業版」按鈕進行付費
- **So that** 我可以獲得更多的 API 呼叫額度和進階功能，提升我的使用體驗

## 3. 功能要求 (Functional Requirements)

- **基本要求**：
  - 要求 1：在訂閱管理頁面提供「升級方案」按鈕，點選後跳轉到 Polar Checkout 頁面
  - 要求 2：整合 Polar API 建立訂閱商品（專業版 $5/月、企業版 $10/月）
  - 要求 3：處理 Polar Webhook 事件，同步訂閱狀態到 Supabase 資料庫
  - 要求 4：付款成功後自動更新用戶的 subscription_plan 和 monthly_usage_limit
  - 要求 5：在 Dashboard 顯示當前訂閱狀態和付費管理連結

- **例外處理**：
  - 情況 1：付款失敗時顯示友善錯誤訊息，並提供重試機制
  - 情況 2：Webhook 事件處理失敗時記錄錯誤，並提供手動同步功能
  - 情況 3：重複付款或異常訂閱狀態時進行適當的資料校正

## 4. 驗收標準 (Acceptance Criteria)

- [x] **方案升級流程**：免費用戶點選升級按鈕後能成功跳轉到 Polar Checkout ✅ 已完成
- [ ] **付款處理**：使用者能完成信用卡付款並收到確認通知
- [ ] **訂閱狀態同步**：付款成功後 Supabase 中的用戶資料正確更新
- [ ] **Dashboard 更新**：付費後 Dashboard 顯示新的方案名稱和額度
- [x] **Webhook 安全性**：Polar Webhook 事件經過簽名驗證確保安全性 ✅ 已完成
- [x] **錯誤處理**：付款失敗或網路異常時顯示適當的錯誤訊息 ✅ 已完成

## 5. 實作註記 (Implementation Notes)

- **技術規格**：Next.js 15 + Polar API + Supabase + TypeScript
- **API 介面**：
  - 端點：`/api/polar/create-checkout` - 建立 Polar Checkout Session
  - 參數：`{ plan: 'pro' | 'enterprise', user_id: string }`
  - 回應：`{ checkout_url: string, session_id: string }`
  
  - 端點：`/api/webhooks/polar` - 接收 Polar Webhook 事件
  - 參數：Polar 事件 Payload（訂閱建立、付款成功等）
  - 回應：`{ status: 'success' | 'error', message: string }`

- **資料庫設計**：
  - 更新 `user_profiles` 表格：
    - `polar_subscription_id`: Polar 訂閱 ID
    - `subscription_plan`: 'free' | 'pro' | 'enterprise'
    - `subscription_status`: 'active' | 'cancelled' | 'past_due'
    - `current_period_end`: 當前計費週期結束時間

- **外部相依性**：
  - Polar API（需要 API Token）
  - Polar Webhook 端點設定
  - Supabase 資料庫更新權限

## 6. 非功能性需求 (Non-Functional Requirements)

- **效能要求**：Checkout 頁面跳轉在 2 秒內完成，Webhook 處理在 5 秒內完成
- **安全性要求**：
  - Polar Webhook 簽名驗證
  - 使用者身份認證（透過 Clerk）
  - 敏感資料加密傳輸
- **可用性要求**：
  - 付費流程簡單直觀，減少用戶流失
  - 清晰的方案比較和價格顯示
  - 支援手機和桌面裝置
- **維護性要求**：
  - 模組化設計便於未來新增方案
  - 完整的錯誤日誌記錄
  - 易於測試的 API 介面

## 7. 補充說明 (Additional Notes)

### 實作階段規劃

**第一階段：基礎整合**
- 設定 Polar 開發者帳號和 API Token
- 在 Polar 中建立商品（專業版、企業版）
- 實作基本的 Checkout 流程

**第二階段：Webhook 整合**
- 設定 Polar Webhook 端點
- 實作訂閱狀態同步邏輯
- 測試付款成功/失敗情境

**第三階段：UI/UX 優化**
- 完善訂閱管理介面
- 添加付費歷史和發票功能
- 實作取消訂閱流程

### 環境變數需求
```env
# Polar Configuration
POLAR_ACCESS_TOKEN=polar_at_xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=org_xxx
```

### 參考資源
- [Polar API 文檔](https://docs.polar.sh/)
- [Polar Webhooks 指南](https://docs.polar.sh/webhooks)
- [現有 Supabase 整合文檔](./Supabase訂閱資料整合.md)

---

## 開發提醒 (Development Notes)

此功能建立在已完成的 Clerk 認證系統和 Supabase 資料庫整合基礎上，需要：

1. **先決條件檢查**：確保 Clerk 和 Supabase 整合正常運作
2. **Polar 帳號設定**：註冊 Polar 開發者帳號並取得 API 憑證
3. **段階式開發**：建議先實作基本付費流程，再完善進階功能
4. **測試環境**：使用 Polar 的測試模式進行開發和測試
5. **安全考量**：特別注意 Webhook 安全性和用戶資料保護

**開發流程建議**：
1. 設定 Polar 開發環境和 API 憑證
2. 實作基本的 Checkout Session 建立
3. 開發 Webhook 事件處理邏輯
4. 整合前端訂閱升級介面
5. 測試完整的付費流程
6. 部署到生產環境並設定 Webhook URL

## 功能模組完成情況

### 已完成模組

✅ **Polar SDK 整合**: 成功整合 @polar-sh/sdk 套件，使用正確的 API 參數格式
✅ **環境變數配置**: 修正 NEXT_PUBLIC_POLAR_ORGANIZATION_ID 和 NEXT_PUBLIC_APP_URL 設定
✅ **Checkout API 實作**: 使用 Polar SDK 直接建立 Checkout Session，支援用戶 email 和外部 ID
✅ **Webhook 處理**: 完整的 Webhook 事件處理和簽名驗證
✅ **前端整合**: 訂閱管理頁面支援真實的升級流程
✅ **錯誤處理**: 完善的錯誤處理和用戶回饋機制

### 技術修正記錄

**2025-07-19 修正內容**:
- 修正 Polar Checkout API 參數格式（successUrl, customerEmail, externalCustomerId）
- 修正環境變數 NEXT_PUBLIC_POLAR_ORGANIZATION_ID 設定
- 新增 NEXT_PUBLIC_APP_URL 環境變數
- 整合 Clerk 用戶 email 獲取功能
- 改用 Polar SDK 直接建立 Checkout Session 而非手動建立 URL