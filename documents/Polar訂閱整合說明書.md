---
title: Polar 訂閱整合說明書
author: 開發團隊
date: '2025-07-18'
version: 1.0
uuid: f76f9cb9870c437d9cf9d84afdc1810a
---

# Polar 訂閱整合說明書

## 📋 文件概述

本文件詳細說明 Polar 付費系統的整合實作，包含技術架構、API 介面、資料流程和使用指南。

### 文件資訊
- **建立日期**: 2025-07-18
- **版本**: 1.0
- **對應功能**: SF05 - Polar 付費系統整合
- **維護者**: 開發團隊

## 🎯 整合概述

### 已完成功能

✅ **Polar SDK 整合**: 安裝並配置 @polar-sh/sdk 和 @polar-sh/nextjs  
✅ **客戶管理**: 自動建立和管理 Polar 客戶  
✅ **產品配置**: 支援多個訂閱方案的產品管理  
✅ **Checkout 流程**: 完整的付費流程整合  
✅ **Webhook 處理**: 自動同步訂閱狀態到 Supabase  
✅ **Customer Portal**: 客戶自助管理訂閱和發票  
✅ **資料庫整合**: 擴展 Supabase 支援 Polar 資料  
✅ **前端整合**: 更新 Dashboard 支援真實付費功能  

### 核心特色

- **無縫整合**: 與現有 Clerk + Supabase 架構完美整合
- **自動同步**: Webhook 自動同步訂閱狀態
- **安全可靠**: 完整的簽名驗證和錯誤處理
- **用戶友善**: 直觀的付費流程和管理介面
- **可擴展**: 模組化設計便於未來功能擴展

## 🏗️ 技術架構

### 系統架構圖

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │    │   (API Routes)  │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Dashboard     │◄──►│ • Checkout API  │◄──►│ • Polar API     │
│ • Subscription  │    │ • Portal API    │    │ • Supabase DB   │
│ • Checkout      │    │ • Webhook API   │    │ • Clerk Auth    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 資料流程

```
用戶點擊升級 → Checkout API → Polar Checkout → 付款完成 
     ↓                                              ↓
Dashboard 顯示  ← Supabase 更新 ← Webhook 處理 ← Polar 事件
```

## 📁 檔案結構

### 新增檔案

```
src/
├── lib/
│   ├── polar.ts                    # Polar 客戶端配置
│   └── polarService.ts             # Polar 服務層
├── app/api/
│   ├── checkout/[plan]/route.ts    # Checkout API 路由
│   ├── customer-portal/route.ts    # Customer Portal API
│   └── webhooks/polar/route.ts     # Polar Webhook 處理
├── app/dashboard/
│   └── checkout-success/page.tsx   # 付費成功頁面
└── types/supabase.ts               # 更新類型定義

documents/
├── database/
│   └── polar_migration.sql         # 資料庫遷移腳本
├── Polar配置與準備說明.md          # 配置指南
└── Polar訂閱整合說明書.md          # 本文件
```

### 更新檔案

```
src/
├── types/supabase.ts               # 添加 Polar 類型定義
├── lib/
│   ├── supabase.ts                 # 更新查詢欄位
│   └── userProfileService.ts       # 添加 Polar 支援
├── app/dashboard/subscription/page.tsx  # 整合真實付費功能
└── .env.local                      # 添加 Polar 環境變數
```

## 🔧 核心組件說明

### 1. Polar 客戶端配置 (`src/lib/polar.ts`)

提供 Polar API 客戶端和工具函數：

```typescript
// 主要功能
- polarApi: Polar API 客戶端實例
- POLAR_CONFIG: 配置常數
- verifyPolarWebhook(): Webhook 簽名驗證
- getPolarProductId(): 獲取產品 ID
- buildCheckoutUrl(): 建立 Checkout URL
```

### 2. Polar 服務層 (`src/lib/polarService.ts`)

封裝 Polar API 操作：

```typescript
// 主要方法
- getOrCreateCustomer(): 建立或獲取客戶
- createCheckoutSession(): 建立付費流程
- getCustomerSubscriptions(): 獲取客戶訂閱
- syncSubscriptionToSupabase(): 同步訂閱狀態
- handleSubscriptionDowngrade(): 處理降級
```

### 3. API 路由

#### Checkout API (`/api/checkout/[plan]`)
- **GET**: 重定向到 Polar Checkout
- **POST**: 返回 Checkout URL (AJAX)

#### Customer Portal API (`/api/customer-portal`)
- **GET**: 重定向到客戶門戶
- **POST**: 返回門戶 URL (AJAX)

#### Webhook API (`/api/webhooks/polar`)
- **POST**: 處理 Polar 事件並同步資料

## 📊 訂閱方案配置

### 方案對應表

| 方案 | Polar 產品 | 價格 | 月額度 | 功能 |
|------|------------|------|--------|------|
| Free | 無 | $0 | 1,000 | 基本功能 |
| Pro | `POLAR_PRO_PRODUCT_ID` | $29 | 10,000 | 進階功能 |
| Enterprise | `POLAR_ENTERPRISE_PRODUCT_ID` | $99 | 100,000 | 所有功能 |

### 狀態對應

| Polar 狀態 | Supabase 狀態 | 說明 |
|------------|---------------|------|
| `trialing` | `trial` | 試用中 |
| `active` | `active` | 訂閱中 |
| `canceled` | `cancelled` | 已取消 |
| `unpaid` | `cancelled` | 未付款 |
| `past_due` | `expired` | 逾期 |

## 🔄 資料同步流程

### 1. 用戶升級流程

```
1. 用戶點擊「立即升級」
2. 呼叫 /api/checkout/[plan]
3. 建立或獲取 Polar Customer
4. 建立 Checkout Session
5. 重定向到 Polar 付款頁面
6. 用戶完成付款
7. Polar 觸發 subscription.created 事件
8. Webhook 處理器同步資料到 Supabase
9. 用戶返回成功頁面
```

### 2. 訂閱管理流程

```
1. 用戶點擊「管理訂閱」
2. 呼叫 /api/customer-portal
3. 重定向到 Polar Customer Portal
4. 用戶管理訂閱（取消、更新付款方式等）
5. Polar 觸發相應事件
6. Webhook 處理器同步變更
```

### 3. Webhook 事件處理

支援的事件類型：
- `checkout.created`: Checkout 建立
- `checkout.updated`: 付款完成
- `subscription.created`: 訂閱建立
- `subscription.updated`: 訂閱更新
- `subscription.canceled`: 訂閱取消

## 🎨 前端整合

### 訂閱管理頁面更新

主要改進：
- ✅ 真實的付費按鈕（替換模擬 alert）
- ✅ Customer Portal 整合
- ✅ 載入狀態和錯誤處理
- ✅ 動態按鈕狀態管理

### 新增頁面

#### 付費成功頁面 (`/dashboard/checkout-success`)
- 顯示付費成功訊息
- 自動重新整理訂閱資料
- 提供導航選項

## 🔐 安全性實作

### 1. Webhook 安全

```typescript
// 簽名驗證
const signature = headers.get('polar-signature');
if (!verifyPolarWebhook(payload, signature)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

### 2. API 安全

```typescript
// 用戶身份驗證
const { userId } = await auth();
if (!userId) {
  return NextResponse.json({ error: '未授權' }, { status: 401 });
}
```

### 3. 環境變數保護

```typescript
// 敏感資訊檢查
if (!POLAR_ACCESS_TOKEN) {
  throw new Error('Missing POLAR_ACCESS_TOKEN');
}
```

## 🧪 測試指南

### 1. 本地測試

```bash
# 啟動開發伺服器
npm run dev

# 使用 ngrok 測試 Webhook
ngrok http 3000
```

### 2. 付費流程測試

1. 登入應用程式
2. 前往訂閱管理頁面
3. 點擊「立即升級」
4. 使用 Polar 測試卡號完成付款
5. 確認訂閱狀態更新

### 3. Webhook 測試

1. 在 Polar Dashboard 觸發測試事件
2. 檢查應用程式日誌
3. 確認 Supabase 資料更新

## 📈 監控與日誌

### 重要日誌點

```typescript
// Webhook 處理
console.log(`Processing Polar webhook event: ${event.type}`);

// 訂閱同步
console.log(`Successfully synced subscription ${subscription.id}`);

// 錯誤處理
console.error('Error processing Polar webhook:', error);
```

### 監控指標

- Webhook 處理成功率
- 付費轉換率
- 訂閱同步延遲
- API 錯誤率

## 🚀 部署注意事項

### 1. 環境變數

確保 Production 環境設定：
```env
POLAR_ACCESS_TOKEN=polar_pat_xxxxxxxxxx  # Production token
NEXT_PUBLIC_POLAR_ENVIRONMENT=production
```

### 2. Webhook URL

更新 Polar Webhook URL 為正式域名：
```
https://yourdomain.com/api/webhooks/polar
```

### 3. 資料庫遷移

在 Production Supabase 執行遷移腳本。

## 🔮 未來擴展

### 短期計劃
- 年付訂閱支援
- 優惠券系統
- 使用量計費

### 中期計劃
- 多貨幣支援
- 企業級功能
- 進階分析

### 長期計劃
- 白標解決方案
- API 市場整合
- 國際化支援

## 📚 開發者指南

### 新增訂閱方案

1. 在 Polar Dashboard 建立新產品
2. 更新 `POLAR_SUBSCRIPTION_PLANS` 配置
3. 添加對應的環境變數
4. 更新前端顯示邏輯

### 自訂 Webhook 處理

```typescript
// 添加新的事件處理
case 'custom.event':
  await handleCustomEvent(event);
  break;
```

### 錯誤處理最佳實踐

```typescript
try {
  // Polar API 呼叫
} catch (error) {
  handlePolarError(error);
}
```

## 🎉 總結

Polar 付費系統整合已成功完成，提供了：

1. **完整的付費流程**: 從升級到付款到確認
2. **自動化管理**: Webhook 自動同步訂閱狀態
3. **用戶友善**: 直觀的管理介面和流程
4. **安全可靠**: 完整的驗證和錯誤處理
5. **可擴展**: 模組化設計便於未來擴展

這個整合為 SaaS 應用程式提供了企業級的付費解決方案，讓您可以專注於產品開發而不需要擔心付費系統的複雜性。

---

**文檔版本**: 1.0  
**最後更新**: 2025-07-18  
**維護者**: 開發團隊  
**狀態**: ✅ 整合完成
