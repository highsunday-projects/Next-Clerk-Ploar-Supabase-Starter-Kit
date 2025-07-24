---
uuid: 3672b7fbe56f4a1880b5a0d27f7da0fe
---
# Polar 付費系統配置指南

## 📋 什麼是 Polar？

Polar 是一個專為開發者設計的現代化付費平台，提供完整的訂閱管理、計費和付款處理解決方案。

### 🎯 主要優勢

- **💰 開發者友善定價**：低手續費、透明計價結構
- **🚀 快速整合**：完整的 SDK 和 API 文檔，快速上線
- **🔄 訂閱管理**：靈活的訂閱計劃、升級降級、試用期管理
- **📊 詳細分析**：收入報表、客戶洞察、業務指標追蹤
- **🛡️ 安全可靠**：企業級安全、PCI 合規、資料加密
- **🌐 全球支援**：多幣種、多語言、國際化付款方式
- **🔧 開發者工具**：Webhook、測試環境、詳細日誌

### 🏗️ 適用場景

- **SaaS 應用程式**：月費訂閱、使用量計費、企業方案
- **數位內容平台**：內容訂閱、一次性購買、會員制
- **開發者工具**：API 訂閱、使用量計費、免費增值模式
- **線上服務**：專業服務、課程訂閱、軟體授權

## 🚀 快速開始

### 步驟 1: 建立 Polar 帳戶

1. 前往 [Polar Sandbox](https://sandbox.polar.sh) **（重要：一開始使用 Sandbox 測試環境）**
2. 點擊 "Sign Up" 註冊新帳戶
3. 使用 GitHub 或 Google 帳戶快速註冊
4. 完成電子郵件驗證

**環境說明**：

Polar 提供兩個環境：
- **Sandbox** (https://sandbox.polar.sh): 測試環境，用於開發和測試，**建議從這裡開始**
- **Production** (https://polar.sh): 正式環境，用於實際營運

**重要提醒**：
- ✅ **必須先在 Sandbox 環境完成所有配置和測試**
- ✅ 確認所有功能正常運作後，再切換到 Production 環境
- ⚠️ 切勿直接在 Production 環境進行測試或學習

### 步驟 2: 設定組織

1. 登入 Polar Dashboard
2. 點擊 "Create Organization"
3. 填寫組織資訊：
   - **組織名稱**: 您的公司或專案名稱
   - **組織 Slug**: URL 友善的識別符
   - **描述**: 簡短的組織描述

完成組織建立後，記錄以下資訊：
- **Organization ID**: `12345678-abcd-1234-5678-123456789abc`
- **Organization Slug**: 您設定的 slug

### 步驟 3: 建立產品和方案

根據我們的訂閱方案，需要建立以下產品：

#### 專業方案 (Pro Plan)
```
產品名稱: Pro Plan
描述: 適合成長中的團隊和企業
價格: $5 USD / 月
功能:
- 10,000 次 API 呼叫/月
- 進階功能存取
- 優先支援
- 詳細分析報告
```

**建立步驟**：

1. 在 Polar Dashboard 中點擊 "Products"
2. 點擊 "Create Product"
3. 填寫產品資訊：
   - **名稱**: 如上述方案名稱
   - **描述**: 詳細的方案說明
   - **類型**: 選擇 "Subscription"
4. 設定價格：
   - **金額**: 5
   - **貨幣**: USD
   - **計費週期**: Monthly
5. 儲存產品

建立完成後，記錄產品的 ID：
- **Pro Plan Product ID**: `prod_xxxxxxxxxx`

### 步驟 4: 獲取 API 金鑰

1. 在 Polar Dashboard 中，前往 **"Settings"** → **"General"** → **"Developers"**
2. 在 **"Manage access tokens to authenticate with the Polar API"** 區域
3. 點擊 **"New Token"** 建立新的 API Token
4. 設定 Token 資訊：
   - **名稱**: "SaaS App Integration"
   - **權限**: 選擇所需的權限（建議全選所有權限）
5. 複製並安全保存 API Token

**API Token 格式**：
- **Sandbox**: `polar_oat_xxxxxxxxxx`
- **Production**: `polar_oat_xxxxxxxxxx`

### 步驟 5: 配置 Webhook

1. 在 Polar Dashboard 中前往 "Settings" > "Webhooks"
2. 點擊 "Create Webhook"
3. 設定 Webhook：
   - **URL**: `https://yourdomain.com/api/webhooks/polar` **（重要：必須包含 `/api/webhooks/polar` 路徑）**
   - **事件**: 勾選以下事件
     - `checkout.created`
     - `order.created`
     - `order.paid`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.uncanceled`

**Webhook URL 說明**：
- ✅ 正確格式：`https://yourdomain.com/api/webhooks/polar`
- ✅ 開發環境：`https://abc123.ngrok.io/api/webhooks/polar`
- ❌ 錯誤格式：`https://yourdomain.com`（缺少路徑）
- ❌ 錯誤格式：`https://yourdomain.com/webhooks/polar`（路徑錯誤）

建立 Webhook 後，Polar 會提供一個 Secret：
- **格式**: 32 位數的十六進制字串（例如：`a1b2c3d4e5f6789012345678901234ab`）
- **用途**: 驗證 Webhook 請求的真實性

**開發環境測試說明**：

由於 Webhook 需要公開的 URL，在開發環境中我們使用 ngrok 將本地 localhost 暴露到外網進行測試：

```bash
# 1. 安裝 ngrok（如果尚未安裝）
npm install -g ngrok

# 2. 啟動您的開發伺服器
npm run dev  # 通常在 port 3000

# 3. 在另一個終端視窗啟動 ngrok 隧道
ngrok http 3000

# 4. ngrok 會提供一個公開的 URL，類似：
# Forwarding    https://abc123.ngrok.io -> http://localhost:3000

# 5. 將 ngrok 提供的 URL 設定到 Polar Webhook（重要：加上 /api/webhooks/polar）
# 例如: https://abc123.ngrok.io/api/webhooks/polar
```

**重要提醒**：
- ngrok 會將您的 localhost:3000 暴露到公開網路
- 每次重啟 ngrok 都會產生新的 URL，需要更新 Polar Webhook 設定
- 這僅用於開發測試，正式環境請使用真實的域名

### 步驟 6: 環境變數配置

將以下環境變數添加到您的 `.env.local` 檔案：

```env
# Polar Configuration
POLAR_ACCESS_TOKEN=polar_oat_xxxxxxxxxx
POLAR_WEBHOOK_SECRET=a1b2c3d4e5f6789012345678901234ab
POLAR_ORGANIZATION_ID=12345678-abcd-1234-5678-123456789abc
NEXT_PUBLIC_POLAR_ENVIRONMENT=sandbox

# Polar Product IDs  
NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID=prod_xxxxxxxxxx
```

**環境變數說明**：

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `POLAR_ACCESS_TOKEN` | Polar API 存取權杖 | `polar_oat_xxx` |
| `POLAR_WEBHOOK_SECRET` | Webhook 簽名驗證密鑰 | `a1b2c3d4e5f6789012345678901234ab` |
| `POLAR_ORGANIZATION_ID` | 組織 ID | `12345678-abcd-1234-5678-123456789abc` |
| `NEXT_PUBLIC_POLAR_ENVIRONMENT` | 環境設定 | `sandbox` 或 `production` |
| `NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID` | 專業方案產品 ID | `prod_xxx` |

### 步驟 7: 測試配置

```bash
# 測試 API 連接
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/organizations/YOUR_ORG_ID
```

**測試產品獲取**：

```bash
# 測試產品列表
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/products?organization_id=YOUR_ORG_ID
```

**測試 Webhook（使用 ngrok）**：

由於 Webhook 需要公開的 URL，在開發環境中我們使用 ngrok 將本地 localhost 暴露到外網進行測試：

```bash
# 1. 安裝 ngrok（如果尚未安裝）
npm install -g ngrok

# 2. 啟動您的開發伺服器
npm run dev  # 通常在 port 3000

# 3. 在另一個終端視窗啟動 ngrok 隧道
ngrok http 3000

# 4. ngrok 會提供一個公開的 URL，類似：
# Forwarding    https://abc123.ngrok.io -> http://localhost:3000

# 5. 將 ngrok 提供的 URL 設定到 Polar Webhook（重要：加上 /api/webhooks/polar）
# 例如: https://abc123.ngrok.io/api/webhooks/polar
```

**重要說明**：
- ngrok 會將您的 localhost:3000 暴露到公開網路
- 每次重啟 ngrok 都會產生新的 URL，需要更新 Polar Webhook 設定
- 這僅用於開發測試，正式環境請使用真實的域名

## 🎁 推薦配置

### 基本配置（適合大多數應用）

```
環境設定:
✅ 先在 Sandbox 環境完成測試
✅ 確認所有功能正常運作
✅ 再切換到 Production 環境

產品設定:
✅ Pro Plan - $5 USD/月
✅ 明確的功能描述
✅ 適當的使用限制
```

### 進階配置（企業級應用）

```
安全性考量:
✅ API 金鑰安全儲存
✅ Webhook 簽名驗證
✅ 定期輪換金鑰
✅ 監控和日誌記錄

業務流程:
✅ 完整的測試流程
✅ 錯誤處理機制  
✅ 客戶支援流程
✅ 數據備份計劃
```

### Production 環境部署

當準備上線時，需要完成以下步驟：

1. 在 Polar Production 環境重複上述步驟
2. 更新環境變數：
   ```env
   POLAR_ACCESS_TOKEN=polar_oat_xxxxxxxxxx
   NEXT_PUBLIC_POLAR_ENVIRONMENT=production
   ```
3. 更新 Webhook URL 為正式域名
4. 測試完整的付費流程

## 🧪 測試驗證

### 測試清單

#### 帳戶和組織測試
- [ ] 成功註冊 Polar 帳戶
- [ ] 建立組織並獲取 Organization ID
- [ ] 產品建立成功，獲取 Product ID
- [ ] API Token 正確生成和保存

#### API 連接測試
- [ ] API 測試呼叫成功回傳組織資訊
- [ ] 產品列表 API 正確回傳產品資料
- [ ] 環境變數正確載入和使用
- [ ] Sandbox 和 Production 環境區分正確

#### Webhook 整合測試
- [ ] Webhook URL 設定正確
- [ ] 測試事件能正確觸發和接收
- [ ] Webhook 簽名驗證正常運作
- [ ] 本地開發環境 ngrok 測試成功

#### 資料庫整合測試  
- [ ] Supabase 資料庫遷移成功執行
- [ ] Polar 相關欄位正確建立和索引
- [ ] 用戶資料和 Polar 客戶 ID 正確關聯
- [ ] 訂閱狀態更新機制正常運作

#### 安全性測試
- [ ] API 金鑰安全儲存，不暴露在前端
- [ ] Webhook Secret 正確配置和驗證
- [ ] 環境變數安全性檢查
- [ ] 生產環境配置與測試環境隔離

### 測試步驟

#### 1. 基本 API 連接測試
```bash
# 測試組織資訊
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/organizations/YOUR_ORG_ID

# 測試產品列表
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/products?organization_id=YOUR_ORG_ID
```

#### 2. 本地 Webhook 測試（使用 ngrok）
```bash
# 1. 確保開發伺服器正在運行
npm run dev

# 2. 在新的終端視窗啟動 ngrok
ngrok http 3000

# 3. 複製 ngrok 提供的 HTTPS URL
# 例如: https://abc123.ngrok.io

# 4. 到 Polar Dashboard 更新 Webhook URL
# 設定為: https://abc123.ngrok.io/api/webhooks/polar
```

**ngrok 使用說明**：
- ngrok 將本地 localhost:3000 映射到公開的 HTTPS URL
- 這樣 Polar 就可以向您的本地開發環境發送 Webhook 事件
- 適合開發階段測試 Webhook 功能

#### 3. 整合流程測試
- 在應用中建立測試用戶
- 模擬訂閱流程
- 檢查 Polar Dashboard 中的客戶和訂閱資料
- 驗證 Webhook 事件正確處理

**重要：訂閱狀態檢查**
如果訂閱成功但 Dashboard 畫面仍顯示免費版本，這通常表示：
- ✅ Polar 付費處理成功
- ❌ Webhook 事件未正確處理
- 🔧 需要檢查 Webhook 配置和處理邏輯

**排除問題步驟**：
1. 檢查 Polar Dashboard 中是否有訂閱記錄
2. 確認 Webhook URL 是否正確設定：必須包含 `/api/webhooks/polar` 路徑
3. 測試 Webhook URL 是否可訪問（使用 ngrok 時特別重要）
4. 查看應用日誌是否有 Webhook 事件接收記錄
5. 驗證 Webhook Secret 是否正確配置

#### 4. 信用卡付款測試
在 Sandbox 環境中，您可以使用測試信用卡進行付款測試：

**測試卡片資訊**（來源：[Stripe 測試卡片文檔](https://docs.stripe.com/testing)）：

| 卡片品牌 | 卡號 | CVC | 到期日 | 說明 |
|---------|------|-----|--------|------|
| **Visa** | `4242424242424242` | Any 3 digits | Any future date | 成功付款測試卡 |
| **Visa** | `4000000000000002` | Any 3 digits | Any future date | 拒絕付款測試卡 |

**使用範例**：
```
測試信用卡卡號：Visa    4242424242424242    Any 3 digits    Any future date
到期日: 12/34
CVC: 123
郵遞區號: 10001（或任何有效郵遞區號）
```

**注意事項**：
- 僅在 Sandbox 環境使用測試卡片
- 測試卡片不會產生實際費用
- 可以測試各種付款情境（成功、失敗、需要驗證等）

## 📚 相關資源

- [Polar 官方文檔](https://docs.polar.sh)
- [Polar API 參考](https://docs.polar.sh/api)  
- [Polar SDK 文檔](https://docs.polar.sh/sdk)
- [Polar Discord 社群](https://discord.gg/polar)

---

**文檔版本**: 2.0  
**最後更新**: 2025-07-23  
**維護者**: 開發團隊  
**更新內容**:
- 重新組織文檔結構，統一風格
- 添加完整的測試驗證章節  
- 優化步驟說明和格式
- 新增推薦配置指南
