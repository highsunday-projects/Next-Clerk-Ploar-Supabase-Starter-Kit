---
title: Polar 配置與準備說明
author: 開發團隊
date: '2025-07-18'
version: 1.0
uuid: 3672b7fbe56f4a1880b5a0d27f7da0fe
---

# Polar 配置與準備說明

## 📋 文件概述

本文件詳細說明如何配置 Polar 付費平台，包含帳戶設定、產品建立、API 配置和環境準備等步驟。

### 文件資訊
- **建立日期**: 2025-07-18
- **版本**: 1.0
- **對應功能**: SF05 - Polar 付費系統整合
- **維護者**: 開發團隊

## 🎯 準備清單

在開始整合之前，請確保完成以下準備工作：

- [ ] 建立 Polar 帳戶
- [ ] 設定組織和產品
- [ ] 獲取 API 金鑰
- [ ] 配置 Webhook
- [ ] 更新環境變數
- [ ] 執行資料庫遷移

## 🚀 第一步：建立 Polar 帳戶

### 1.1 註冊 Polar 帳戶

1. 前往 [Polar.sh](https://polar.sh)
2. 點擊 "Sign Up" 註冊新帳戶
3. 使用 GitHub 或 Google 帳戶快速註冊
4. 完成電子郵件驗證

### 1.2 選擇環境

Polar 提供兩個環境：

- **Sandbox**: 測試環境，用於開發和測試
- **Production**: 正式環境，用於實際營運

**建議流程**：
1. 先在 Sandbox 環境完成整合和測試
2. 確認功能正常後再切換到 Production

## 🏢 第二步：設定組織

### 2.1 建立組織

1. 登入 Polar Dashboard
2. 點擊 "Create Organization"
3. 填寫組織資訊：
   - **組織名稱**: 您的公司或專案名稱
   - **組織 Slug**: URL 友善的識別符
   - **描述**: 簡短的組織描述

### 2.2 組織設定

完成組織建立後，記錄以下資訊：
- **Organization ID**: `org_xxxxxxxxxx`
- **Organization Slug**: 您設定的 slug

## 📦 第三步：建立產品和方案

### 3.1 建立產品

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

### 3.2 建立步驟

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

### 3.3 記錄產品 ID

建立完成後，記錄產品的 ID：
- **Pro Plan Product ID**: `prod_xxxxxxxxxx`

## 🔑 第四步：獲取 API 金鑰

### 4.1 建立 API Token

1. 前往 Polar Dashboard 的 "Settings" > "API"
2. 點擊 "Create API Token"
3. 設定權限：
   - **名稱**: "SaaS App Integration"
   - **權限**: 選擇所需的權限（建議選擇完整權限）
4. 複製並安全保存 API Token

### 4.2 API Token 格式

- **Sandbox**: `polar_pat_sandbox_xxxxxxxxxx`
- **Production**: `polar_pat_xxxxxxxxxx`

## 🔗 第五步：配置 Webhook

### 5.1 建立 Webhook

1. 在 Polar Dashboard 中前往 "Settings" > "Webhooks"
2. 點擊 "Create Webhook"
3. 設定 Webhook：
   - **URL**: `https://yourdomain.com/api/webhooks/polar`
   - **事件**: 選擇以下事件
     - `checkout.created`
     - `checkout.updated`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`

### 5.2 Webhook Secret

建立 Webhook 後，Polar 會提供一個 Secret：
- **格式**: `polar_wh_xxxxxxxxxx`
- **用途**: 驗證 Webhook 請求的真實性

## ⚙️ 第六步：環境變數配置

### 6.1 更新 .env.local

將以下環境變數添加到您的 `.env.local` 檔案：

```env
# Polar Configuration
POLAR_ACCESS_TOKEN=polar_pat_sandbox_xxxxxxxxxx
POLAR_WEBHOOK_SECRET=polar_wh_xxxxxxxxxx
POLAR_ORGANIZATION_ID=org_xxxxxxxxxx
NEXT_PUBLIC_POLAR_ENVIRONMENT=sandbox

# Polar Product IDs  
NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID=prod_xxxxxxxxxx
```

### 6.2 環境變數說明

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `POLAR_ACCESS_TOKEN` | Polar API 存取權杖 | `polar_pat_sandbox_xxx` |
| `POLAR_WEBHOOK_SECRET` | Webhook 簽名驗證密鑰 | `polar_wh_xxx` |
| `POLAR_ORGANIZATION_ID` | 組織 ID | `org_xxx` |
| `NEXT_PUBLIC_POLAR_ENVIRONMENT` | 環境設定 | `sandbox` 或 `production` |
| `NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID` | 專業方案產品 ID | `prod_xxx` |

## 🗄️ 第七步：資料庫遷移

### 7.1 執行 SQL 遷移

在 Supabase Dashboard 的 SQL Editor 中執行以下腳本：

```sql
-- 添加 Polar 相關欄位
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS polar_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS polar_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS polar_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_polar_customer_id 
ON user_profiles(polar_customer_id);
```

### 7.2 驗證遷移

執行以下查詢確認欄位已成功添加：

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name LIKE 'polar_%';
```

## 🧪 第八步：測試配置

### 8.1 測試 API 連接

```bash
# 測試 API 連接
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/organizations/YOUR_ORG_ID
```

### 8.2 測試產品獲取

```bash
# 測試產品列表
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/products?organization_id=YOUR_ORG_ID
```

### 8.3 測試 Webhook

使用 ngrok 或類似工具測試本地 Webhook：

```bash
# 安裝 ngrok
npm install -g ngrok

# 啟動隧道
ngrok http 3000

# 更新 Polar Webhook URL 為 ngrok 提供的 URL
# 例如: https://abc123.ngrok.io/api/webhooks/polar
```

## 🔒 安全性考量

### 9.1 API 金鑰安全

- ✅ 使用環境變數儲存敏感資訊
- ✅ 不要將 API 金鑰提交到版本控制
- ✅ 定期輪換 API 金鑰
- ✅ 使用最小權限原則

### 9.2 Webhook 安全

- ✅ 驗證 Webhook 簽名
- ✅ 使用 HTTPS 端點
- ✅ 實作重試機制
- ✅ 記錄所有 Webhook 事件

## 🚀 第九步：部署準備

### 9.1 Production 環境切換

當準備上線時，需要：

1. 在 Polar Production 環境重複上述步驟
2. 更新環境變數：
   ```env
   POLAR_ACCESS_TOKEN=polar_pat_xxxxxxxxxx  # 移除 sandbox
   NEXT_PUBLIC_POLAR_ENVIRONMENT=production
   ```
3. 更新 Webhook URL 為正式域名
4. 測試完整的付費流程

### 9.2 上線檢查清單

- [ ] Production API 金鑰已設定
- [ ] Webhook URL 指向正式環境
- [ ] 產品價格和描述正確
- [ ] 測試付費流程完整運作
- [ ] 客戶支援流程已準備

## 📞 支援與資源

### 官方資源

- **Polar 文檔**: https://docs.polar.sh
- **API 參考**: https://docs.polar.sh/api
- **SDK 文檔**: https://docs.polar.sh/sdk

### 社群支援

- **Discord**: Polar 官方 Discord 社群
- **GitHub**: Polar SDK 和範例專案

## 🎉 完成確認

完成所有配置後，您應該能夠：

- ✅ 在 Polar Dashboard 看到組織和產品
- ✅ API 測試呼叫成功
- ✅ Webhook 能正確接收事件
- ✅ 環境變數正確設定
- ✅ 資料庫結構已更新

---

**文檔版本**: 1.0  
**最後更新**: 2025-07-18  
**維護者**: 開發團隊  
**狀態**: ✅ 準備完成
