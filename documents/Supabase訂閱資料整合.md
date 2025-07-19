# Supabase 訂閱資料整合說明

## 📋 文件概述

本文件詳細說明 SF04 功能的實作結果，包含 Supabase 用戶訂閱資料整合的完整功能、技術實作細節和使用指南。

### 文件資訊
- **建立日期**: 2025-07-17
- **版本**: 1.1
- **對應需求**: SF04 - Supabase 用戶訂閱資料整合
- **維護者**: 開發團隊
- **最新更新**: 2025-07-19 - 整合 Polar 付費系統

## 🎯 功能概述

### 已完成功能

✅ **資料庫連線**: 成功建立 Supabase 專案連接
✅ **user_profiles 資料表**: 建立完整的用戶訂閱資料結構
✅ **Clerk 整合**: 用戶註冊時自動建立免費方案記錄
✅ **Dashboard 整合**: 替換模擬資料，顯示真實訂閱狀態
✅ **API 介面**: 提供完整的訂閱資料 CRUD 操作
✅ **TypeScript 支援**: 完整的類型定義和類型安全
✅ **錯誤處理**: 友善的錯誤訊息和異常處理
✅ **Polar 整合**: 新增 Polar 付費系統相關欄位

### 核心特色

- **自動化用戶管理**: 新用戶註冊時自動建立預設訂閱記錄
- **即時資料同步**: Dashboard 顯示來自 Supabase 的真實資料
- **類型安全**: 完整的 TypeScript 類型定義
- **安全性**: Row Level Security 和適當的權限控制
- **可擴展性**: 為未來 Polar 付費系統整合做好準備

## 🏗️ 技術架構

### 資料庫設計

#### user_profiles 表格結構
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  subscription_plan VARCHAR(20) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'cancelled',

  -- Polar 付費系統整合欄位
  polar_customer_id VARCHAR(255),           -- Polar 客戶 ID
  polar_subscription_id VARCHAR(255),       -- Polar 訂閱 ID
  current_period_end TIMESTAMP WITH TIME ZONE, -- 當前計費週期結束時間
  cancel_at_period_end BOOLEAN DEFAULT FALSE,   -- 是否在週期結束時取消訂閱

  monthly_usage_limit INTEGER DEFAULT 1000,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 資料約束
- **subscription_plan**: 'free', 'pro', 'enterprise'
- **subscription_status**: 'active', 'trial', 'cancelled', 'expired'
- **monthly_usage_limit**: 整數，預設 1000
- **Row Level Security**: 啟用資料安全控制

#### Polar 整合欄位說明
- **polar_customer_id**: 儲存 Polar 系統中的客戶唯一識別碼
- **polar_subscription_id**: 儲存 Polar 系統中的訂閱唯一識別碼
- **current_period_end**: 記錄當前計費週期的結束時間
- **cancel_at_period_end**: 標記是否在當前週期結束時取消訂閱

### 程式碼架構

#### 1. 類型定義 (`src/types/supabase.ts`)
```typescript
export interface UserProfile {
  id: string;
  clerk_user_id: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;

  // Polar 付費系統整合欄位
  polar_customer_id?: string;
  polar_subscription_id?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;

  monthly_usage_limit: number;
  trial_ends_at?: string;
  last_active_date: string;
  created_at: string;
  updated_at: string;
}
```

#### 2. 資料庫服務 (`src/lib/userProfileService.ts`)
- `getUserProfile()`: 獲取用戶訂閱資料
- `createUserProfile()`: 建立新訂閱記錄
- `updateUserProfile()`: 更新訂閱資料
- `getOrCreateUserProfile()`: 獲取或建立記錄

#### 3. API 路由 (`src/app/api/user/subscription/route.ts`)
- `GET`: 獲取當前用戶訂閱資料
- `POST`: 建立新訂閱記錄
- `PATCH`: 更新訂閱資料

#### 4. React Hook (`src/hooks/useUserProfile.ts`)
- 前端資料狀態管理
- 自動錯誤處理
- 載入狀態管理

#### 5. Webhook 處理 (`src/app/api/webhooks/clerk/route.ts`)
- 處理 Clerk 用戶事件
- 自動建立訂閱記錄
- 簽名驗證和安全性

## 🔄 資料流程

### 1. 用戶註冊流程
```
用戶註冊 → Clerk 認證 → Webhook 觸發 → 建立 user_profiles 記錄 → 預設免費方案
```

### 2. 用戶登入流程
```
用戶登入 → Dashboard 載入 → API 請求 → Supabase 查詢 → 顯示訂閱資料
```

### 3. 資料更新流程
```
前端請求 → API 驗證 → Supabase 更新 → 回傳新資料 → 前端狀態更新
```

## 📊 訂閱方案配置

### 免費方案 (Free)
- **月使用額度**: 1,000 次 API 呼叫
- **價格**: 免費
- **功能**: 基本功能存取、社群支援

### 專業方案 (Pro)
- **月使用額度**: 10,000 次 API 呼叫
- **價格**: $5/月
- **功能**: 進階功能、優先支援、詳細分析

### 企業方案 (Enterprise)
- **月使用額度**: 100,000 次 API 呼叫
- **價格**: $10/月
- **功能**: 所有功能、24/7 支援、自訂整合

## 🎨 前端整合

### Dashboard 更新

原本的模擬資料已被替換為真實的 Supabase 資料：

#### 訂閱狀態顯示
```typescript
// 動態顯示訂閱狀態
const statusBadge = profile?.subscription_status === 'active' ? '訂閱中' :
                   profile?.subscription_status === 'trial' ? '試用中' :
                   profile?.subscription_status === 'cancelled' ? '已取消' : '已過期';
```

#### 方案資訊顯示
```typescript
// 顯示真實的方案資訊
const currentPlan = SUBSCRIPTION_PLANS[profile.subscription_plan];
const displayPrice = currentPlan.price === 0 ? '免費' : `$${currentPlan.price}/月`;
```

#### 使用統計
```typescript
// 顯示月使用額度
const monthlyLimit = profile?.monthly_usage_limit?.toLocaleString() || '1,000';
```

### 錯誤處理

完整的錯誤處理機制：
- 載入狀態顯示
- 友善的錯誤訊息
- 自動重試機制
- 降級處理（使用預設值）

## 🔐 安全性實作

### 身份驗證
- 使用 Clerk 進行用戶身份驗證
- API 路由自動驗證用戶身份
- 防止未授權存取

### 資料安全
- Row Level Security (RLS) 啟用
- 用戶只能存取自己的資料
- 服務端驗證所有操作

### Webhook 安全
- Svix 簽名驗證
- 防止偽造請求
- 錯誤日誌記錄

## 🧪 測試與驗證

### 功能測試

#### 1. 用戶註冊測試
```bash
# 測試步驟
1. 註冊新用戶
2. 檢查 Supabase user_profiles 表格
3. 確認自動建立免費方案記錄
4. 驗證預設值正確
```

#### 2. Dashboard 顯示測試
```bash
# 測試步驟
1. 登入現有用戶
2. 檢查 Dashboard 顯示真實資料
3. 確認訂閱狀態正確
4. 驗證方案資訊準確
```

#### 3. API 測試
```bash
# GET 測試
curl -X GET http://localhost:3000/api/user/subscription \
  -H "Authorization: Bearer <clerk_token>"

# PATCH 測試
curl -X PATCH http://localhost:3000/api/user/subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk_token>" \
  -d '{"subscription_plan": "pro"}'
```

### 驗收標準檢查

- [x] **資料庫連線**: ✅ 成功建立 Supabase 連線
- [x] **user_profiles 資料表**: ✅ 建立並包含訂閱相關欄位
- [x] **用戶同步**: ✅ 新用戶註冊時自動建立免費方案記錄
- [x] **Dashboard 顯示**: ✅ 儀表板顯示來自 Supabase 的訂閱資料
- [x] **訂閱資料讀取**: ✅ 可以成功讀取和顯示用戶訂閱狀態

## 🔮 未來擴展

### 短期計劃
- API 使用統計功能
- 進階權限控制
- 實時資料同步

### 中期計劃
- ✅ Polar 付費系統整合（資料庫欄位已完成）
- 訂閱升級/降級流程
- 發票和計費管理
- Polar Webhook 事件處理

### 長期計劃
- 多租戶支援
- 進階分析報告
- 自動化營運工具

## 📚 開發者指南

### 新增訂閱方案

1. 更新 `SUBSCRIPTION_PLANS` 配置
2. 修改資料庫約束條件
3. 更新前端顯示邏輯
4. 測試新方案功能

### 自訂欄位

1. 修改資料庫表格結構
2. 更新 TypeScript 類型定義
3. 修改服務層邏輯
4. 更新 API 介面

### 整合其他服務

1. 建立新的服務層
2. 實作資料同步邏輯
3. 處理錯誤和異常
4. 更新前端介面

## 🎉 總結

SF04 功能已成功實作，提供了完整的 Supabase 用戶訂閱資料整合功能。主要成就包括：

1. **完整的資料庫設計**: 建立了可擴展的用戶訂閱資料結構
2. **自動化流程**: 實現了用戶註冊時的自動訂閱記錄建立
3. **真實資料顯示**: Dashboard 現在顯示來自 Supabase 的真實資料
4. **類型安全**: 完整的 TypeScript 支援確保開發品質
5. **安全性**: 實作了適當的權限控制和資料保護
6. **可維護性**: 清晰的程式碼結構便於未來擴展
7. **Polar 整合準備**: 新增了 Polar 付費系統所需的資料庫欄位

這個基礎為後續的 Polar 付費系統整合和進階功能開發奠定了堅實的基礎。資料庫結構已經準備好支援完整的付費訂閱流程。

---

**文檔版本**: 1.1
**最後更新**: 2025-07-19
**維護者**: 開發團隊
**狀態**: ✅ 已完成（含 Polar 整合準備）
**更新內容**: 新增 Polar 付費系統整合欄位
