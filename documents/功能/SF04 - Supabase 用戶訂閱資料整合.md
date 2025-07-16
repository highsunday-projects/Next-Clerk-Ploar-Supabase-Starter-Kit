---
title: Supabase 用戶訂閱資料整合 - 僅訂閱功能
author: 開發團隊
date: 2025-07-17
version: 1.1
uuid: 93450ca6afdc445db021df46a5bd7391
---

# SF04 - Supabase 用戶訂閱資料整合 (簡化需求)

## 1. 功能概述 (Feature Overview)

本功能旨在整合 Supabase 資料庫來儲存和管理用戶的訂閱相關資料。專注於建立 `user_profiles` 資料表來儲存訂閱狀態、方案類型和配額資訊，並與現有 Clerk 認證系統整合。

**背景動機**：
- 目前 Dashboard 使用模擬的訂閱資料，需要真實的資料來源
- 為後續 Polar 付費系統整合準備基礎資料結構
- 實現用戶訂閱狀態的持久化儲存和管理

**重要決策**：基於效能考量，API 使用統計將於未來單獨實作，本階段僅專注於訂閱核心功能。

## 2. 需求描述 (Requirement/User Story)

- **As a** SaaS 應用開發者
- **I want** 整合 Supabase 資料庫來儲存用戶的訂閱資料
- **So that** 可以在 Dashboard 中顯示真實的訂閱狀態和方案資訊

## 3. 功能要求 (Functional Requirements)

### 基本要求：

- **資料庫連線**：
  - 建立 Supabase 專案並配置連線
  - 設定環境變數和安全認證

- **user_profiles 資料表**：
  - 建立用戶訂閱資料主表
  - 包含訂閱方案、狀態、配額等欄位
  - 與 Clerk 用戶 ID 關聯

- **Clerk 整合**：
  - 用戶註冊時自動建立預設的訂閱記錄（免費方案）
  - 用戶登入時更新最後活躍時間

- **Dashboard 整合**：
  - 替換目前模擬的訂閱資料
  - 顯示真實的訂閱狀態和方案資訊

### 例外處理：

- **連線失敗**：顯示友善的錯誤訊息，使用預設值
- **資料同步錯誤**：記錄錯誤並建立預設訂閱記錄

## 4. 驗收標準 (Acceptance Criteria)

- [ ] **資料庫連線**：成功建立 Supabase 連線
- [ ] **user_profiles 資料表**：建立並包含訂閱相關欄位
- [ ] **用戶同步**：新用戶註冊時自動建立免費方案記錄
- [ ] **Dashboard 顯示**：儀表板顯示來自 Supabase 的訂閱資料
- [ ] **訂閱資料讀取**：可以成功讀取和顯示用戶訂閱狀態

## 5. 實作註記 (Implementation Notes)

### 技術規格：
- **@supabase/supabase-js** - Supabase JavaScript 客戶端
- **TypeScript** - 類型安全的開發

### 資料庫設計：

```sql
-- 用戶訂閱資料表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  subscription_plan VARCHAR(20) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',
  monthly_usage_limit INTEGER DEFAULT 1000,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立訂閱方案檢查約束
ALTER TABLE user_profiles 
ADD CONSTRAINT valid_subscription_plan 
CHECK (subscription_plan IN ('free', 'pro', 'enterprise'));

ALTER TABLE user_profiles 
ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('active', 'trial', 'cancelled', 'expired'));

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 僅允許用戶存取自己的資料（需配合 Clerk JWT）
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (true); -- 暫時允許所有讀取，後續配合 Clerk Auth

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (true); -- 暫時允許所有更新，後續配合 Clerk Auth
```

### API 介面：

- **獲取用戶訂閱資料**：
  - 端點：`GET /api/user/subscription`
  - 回應：`{ profile: UserProfile }`

- **建立新用戶訂閱**：
  - 端點：`POST /api/user/subscription`
  - 參數：`{ clerkUserId: string }`
  - 回應：`{ success: boolean, profile: UserProfile }`

### 環境變數：
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 6. 非功能性需求 (Non-Functional Requirements)

- **效能要求**：訂閱資料查詢回應時間 < 300ms
- **安全性要求**：使用 Row Level Security (RLS) 保護用戶資料
- **可用性要求**：資料庫操作失敗時提供友善錯誤訊息
- **維護性要求**：使用 TypeScript 確保類型安全

## 7. 補充說明 (Additional Notes)

### 開發重點：
1. **專注訂閱功能**：僅實作 user_profiles 表格和基本訂閱管理
2. **移除使用統計**：API 使用次數統計將在後續功能中單獨實作
3. **簡化整合**：與現有 Dashboard 頁面整合，替換模擬的訂閱資料
4. **預留擴展**：資料結構設計考慮未來 Polar 付費系統整合

### 資料流程：
1. 用戶註冊 → Clerk 認證 → 自動建立免費方案 user_profiles 記錄
2. 用戶登入 → 讀取 Supabase 訂閱資料 → Dashboard 顯示訂閱狀態
3. 未來升級 → 透過 Polar 更新訂閱方案 → 同步到 user_profiles

### TypeScript 類型定義：
```typescript
interface UserProfile {
  id: string;
  clerk_user_id: string;
  subscription_plan: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'trial' | 'cancelled' | 'expired';
  monthly_usage_limit: number;
  trial_ends_at?: string;
  last_active_date: string;
  created_at: string;
  updated_at: string;
}
```

---

## 開發提醒 (Development Notes)

此為訂閱功能專屬版本，專注於：
- 訂閱狀態和方案的基本 CRUD 操作
- 與 Clerk 的基本整合
- Dashboard 的訂閱資料顯示

**開發流程建議**：
1. 建立 Supabase 專案和 user_profiles 表格
2. 安裝並配置 Supabase 客戶端
3. 實現用戶註冊時的訂閱記錄建立
4. 更新 Dashboard 以讀取真實訂閱資料
5. 測試基本訂閱功能運作

**未來擴展準備**：
- API 使用統計功能（獨立的 SF04 需求）
- Polar 付費系統整合（SF05 需求）
- 進階訂閱管理功能