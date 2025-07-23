---
uuid: 86693f9b721f45a5901240929ad6567a
---
# Supabase 配置與使用說明

## 📋 文件概述

本文件詳細說明如何在 Next-Clerk-Polar-Supabase Starter Kit 中配置和使用 Supabase 資料庫，包含完整的設定步驟、資料庫結構設計和最佳實踐。

### 文件資訊
- **建立日期**: 2025-07-17
- **版本**: 1.0
- **適用範圍**: Next.js 15.4.1 + Supabase
- **維護者**: 開發團隊

## 🎯 整合目標

- ✅ 建立 Supabase 專案和資料庫連接
- ✅ 設計用戶訂閱資料表結構
- ✅ 實現用戶訂閱資料的 CRUD 操作
- ✅ 整合 Clerk 認證系統與 Supabase
- ✅ 提供安全的資料存取控制

## 🛠️ 技術架構

### 核心組件
- **@supabase/supabase-js**: Supabase 的 JavaScript 客戶端 SDK
- **PostgreSQL**: 強大的關聯式資料庫
- **Row Level Security (RLS)**: 資料安全控制
- **Real-time**: 即時資料同步功能

### 檔案結構
```
src/
├── lib/
│   ├── supabase.ts                    # Supabase 客戶端配置
│   └── userProfileService.ts          # 用戶訂閱資料服務
├── types/
│   └── supabase.ts                    # TypeScript 類型定義
├── hooks/
│   └── useUserProfile.ts              # 用戶訂閱資料 Hook
├── app/api/
│   ├── user/subscription/route.ts     # 訂閱資料 API 路由
│   └── webhooks/clerk/route.ts        # Clerk Webhook 處理
└── .env.local                         # 環境變數配置
```

## 🚀 快速開始

### 1. 建立 Supabase 專案

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 點擊 "New Project" 建立新專案
3. 選擇組織和設定專案名稱
4. 選擇資料庫區域（建議選擇離用戶最近的區域）
5. 設定資料庫密碼（請妥善保存）
6. 等待專案建立完成

### 2. 獲取 API 金鑰

在專案 Dashboard 中：
1. 前往 **Settings** → **API**
2. 複製以下金鑰：
   - **Project URL**: 專案的 API 端點
   - **anon public**: 匿名公開金鑰（前端使用）
   - **service_role**: 服務角色金鑰（後端使用，具有完整權限）

### 3. 環境變數設定

在 `.env.local` 檔案中設定：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key_here
```

### 4. 建立資料庫表格

在 Supabase SQL Editor 中執行以下 SQL：

```sql
-- 建立用戶訂閱資料表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  subscription_plan VARCHAR(20) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',

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

-- 建立訂閱方案檢查約束
ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_plan
CHECK (subscription_plan IN ('free', 'pro', 'enterprise'));

ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_status
CHECK (subscription_status IN ('active', 'trial', 'cancelled', 'expired'));

-- 檢查約束條件
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass;

-- 檢查索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles';

-- 啟用 Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 建立安全政策（暫時允許所有操作，後續可配合 Clerk Auth 細化）
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (true);
```

### 5. 安裝依賴

```bash
npm install @supabase/supabase-js svix
```

## 📖 詳細配置指南

### Supabase 客戶端配置

`src/lib/supabase.ts` 提供了兩種客戶端實例：

```typescript
// 客戶端實例（前端使用）
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 管理員實例（後端使用）
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
```

### 用戶訂閱資料服務

`src/lib/userProfileService.ts` 提供完整的 CRUD 操作：

- `getUserProfile(clerkUserId)`: 獲取用戶訂閱資料
- `createUserProfile(data)`: 建立新的訂閱記錄
- `updateUserProfile(clerkUserId, data)`: 更新訂閱資料
- `updateLastActiveDate(clerkUserId)`: 更新最後活躍時間
- `getOrCreateUserProfile(clerkUserId)`: 獲取或建立訂閱記錄

### API 路由

`src/app/api/user/subscription/route.ts` 提供 RESTful API：

- `GET /api/user/subscription`: 獲取當前用戶訂閱資料
- `POST /api/user/subscription`: 建立新的訂閱記錄
- `PATCH /api/user/subscription`: 更新訂閱資料

### Clerk Webhook 整合

`src/app/api/webhooks/clerk/route.ts` 處理用戶事件：

- `user.created`: 自動建立免費方案訂閱記錄
- `user.updated`: 更新最後活躍時間
- `user.deleted`: 記錄用戶刪除事件

## 🔐 安全性配置

### Row Level Security (RLS)

目前使用基本的 RLS 政策，允許所有操作。未來可以配合 Clerk JWT 實現更細緻的權限控制：

```sql
-- 進階安全政策範例（未來實作）
CREATE POLICY "Users can only access own data" ON user_profiles
  FOR ALL USING (auth.jwt() ->> 'sub' = clerk_user_id);
```

### 環境變數安全

- ✅ 使用 `.env.local` 存放敏感資訊
- ✅ 不要將 `.env.local` 提交到版本控制
- ✅ 生產環境使用不同的金鑰
- ✅ 定期輪換 API 金鑰

## 🧪 測試指南

### 功能測試清單

- [ ] **資料庫連接**: 成功連接到 Supabase
- [ ] **用戶註冊**: 新用戶註冊時自動建立訂閱記錄
- [ ] **資料讀取**: 可以正確讀取用戶訂閱資料
- [ ] **資料更新**: 可以更新訂閱方案和狀態
- [ ] **Webhook 處理**: Clerk 事件正確觸發資料庫操作
- [ ] **錯誤處理**: 適當處理資料庫錯誤和連接問題

### 測試步驟

1. **連接測試**
   ```bash
   # 在瀏覽器控制台測試
   fetch('/api/user/subscription')
     .then(res => res.json())
     .then(console.log);
   ```

2. **註冊流程測試**
   - 註冊新用戶
   - 檢查 Supabase 中是否自動建立訂閱記錄
   - 確認預設為免費方案

3. **Dashboard 顯示測試**
   - 登入用戶
   - 檢查 Dashboard 是否顯示真實訂閱資料
   - 確認資料格式正確

## 🔧 故障排除

### 常見問題

**Q: 無法連接到 Supabase**
A: 檢查以下項目：
- 環境變數是否正確設定
- Supabase 專案是否正常運行
- 網路連接是否正常
- API 金鑰是否有效

**Q: 資料庫操作失敗**
A: 檢查：
- SQL 表格是否正確建立
- RLS 政策是否正確設定
- 資料格式是否符合約束條件

**Q: Webhook 不觸發**
A: 確認：
- Clerk Webhook 設定是否正確
- Webhook URL 是否可訪問
- Webhook 密鑰是否正確

**Q: 權限錯誤**
A: 檢查：
- 是否使用正確的客戶端實例
- RLS 政策是否允許操作
- 用戶身份驗證是否正確

## 📈 效能優化

### 查詢優化
- 使用適當的索引
- 限制查詢結果數量
- 使用 select 指定需要的欄位

### 連接管理
- 重用客戶端實例
- 適當處理連接錯誤
- 使用連接池（生產環境）

### 快取策略
- 實現適當的資料快取
- 使用 React Query 或 SWR
- 避免不必要的重複查詢

## 🔮 未來擴展

### 進階功能
- 實時資料同步
- 進階權限控制
- 資料分析和報告
- 自動備份和恢復

### 整合準備
- **Polar**: ✅ 付費訂閱狀態同步（已整合）
- **分析**: 使用統計追蹤
- **通知**: 訂閱狀態變更通知

### Polar 付費系統整合
- **polar_customer_id**: 儲存 Polar 客戶識別碼
- **polar_subscription_id**: 儲存 Polar 訂閱識別碼
- **current_period_end**: 追蹤計費週期結束時間
- **cancel_at_period_end**: 管理訂閱取消狀態

## 📚 參考資源

- [Supabase 官方文檔](https://supabase.com/docs)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript 客戶端](https://supabase.com/docs/reference/javascript)

---

**文檔版本**: 1.1
**最後更新**: 2025-07-19
**維護者**: 開發團隊
**更新內容**: 整合 Polar 付費系統欄位
