---
uuid: 86693f9b721f45a5901240929ad6567a
---
# Supabase 配置與使用說明

## 📋 什麼是 Supabase？

Supabase 是一個開源的 Firebase 替代方案，為開發者提供完整的後端即服務 (Backend-as-a-Service) 解決方案。它基於 PostgreSQL 資料庫，並提供即時訂閱、身份驗證、即時 API、檔案儲存等功能。

### 🎯 主要優勢

- **🗄️ 強大的資料庫**：基於 PostgreSQL，功能完整且穩定
- **🔐 內建安全機制**：Row Level Security (RLS) 提供精細的權限控制
- **⚡ 即時功能**：WebSocket 即時資料同步和低延遲更新
- **🚀 開發體驗**：自動生成 RESTful API、型別安全的 TypeScript 支援
- **💰 成本效益**：慷慨的免費額度、透明計價模式
- **🔧 開發者友善**：豐富的客戶端 SDK 和詳細文檔

### 🏗️ 適用場景

- **SaaS 應用程式**：提供完整的用戶資料管理和訂閱功能
- **即時應用**：聊天室、協作工具、即時儀表板
- **電商平台**：商品管理、訂單處理、用戶資料
- **內容管理系統**：文章、媒體檔案的儲存和管理

## 🚀 快速開始

### 步驟 1: 建立 Supabase 專案

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 點擊 **"New Project"** 建立新專案
3. 填寫專案資訊：
   - **Organization**: 選擇或建立組織
   - **Name**: 輸入專案名稱
   - **Database Password**: 設定資料庫密碼（請妥善保存）
   - **Region**: 選擇離用戶最近的區域（建議選擇亞太地區）
4. 點擊 **"Create new project"** 完成建立
5. 等待專案初始化完成（約 2-3 分鐘）

### 步驟 2: 獲取 API 金鑰和 Project URL

#### 2.1 獲取 Project URL
1. 在專案 Dashboard 中，前往 **Settings** → **Data API**
2. 在 **Project URL** 區域，複製完整的 URL：
   - 格式：`https://your-project-id.supabase.co`

#### 2.2 獲取 API Keys
1. 在專案 Dashboard 中，前往 **Settings** → **API Keys**
2. 複製以下兩個金鑰：
   - **anon public**: 匿名公開金鑰（前端使用）
   - **service_role**: 服務角色金鑰（後端使用，具有完整權限）

**重要安全提醒**：
- `anon public` 金鑰可以在前端使用，受 RLS 權限控制
- `service_role` 金鑰具有完整資料庫權限，**絕對不可暴露在前端代碼中**

### 步驟 3: 環境變數設定

在您的 `.env.local` 檔案中添加：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key_here
```

### 步驟 4: 建立資料庫表格

1. 在 Supabase Dashboard 中，前往 **SQL Editor**
2. 點擊 **"New Query"**
3. 複製並執行以下完整的 SQL 腳本：

```sql
-- =====================================================
-- Next-Clerk-Polar-Supabase Non-Destructive Database Setup Script
-- =====================================================
-- Created: 2025-07-21
-- Version: 5.1 (Non-destructive version)

-- =====================================================
-- 1. Safety Check & Notice
-- =====================================================

-- This script is designed to be non-destructive and will not delete existing data
-- If you need to completely rebuild, please manually execute DROP TABLE commands

-- =====================================================
-- 2. Create Main Table (If Not Exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  -- Basic identification fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Simplified subscription status fields
  subscription_status VARCHAR(20) DEFAULT 'inactive' NOT NULL,
  subscription_plan VARCHAR(20) DEFAULT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Other business fields
  monthly_usage_limit INTEGER DEFAULT 1000,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Polar payment system integration fields
  polar_customer_id VARCHAR(255),
  polar_subscription_id VARCHAR(255),
  
  -- System tracking fields
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. Safely Add Constraints (If Not Exists)
-- =====================================================

-- Check and add subscription status constraint
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_subscription_status' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT valid_subscription_status 
        CHECK (subscription_status IN ('active_recurring', 'active_ending', 'inactive'));
    END IF;
END $;

-- Check and add subscription plan constraint
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_subscription_plan' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT valid_subscription_plan 
        CHECK (subscription_plan IS NULL OR subscription_plan = 'pro');
    END IF;
END $;

-- Check and add monthly usage limit constraint
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'positive_monthly_usage_limit' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT positive_monthly_usage_limit 
        CHECK (monthly_usage_limit > 0);
    END IF;
END $;

-- Check and add business logic constraint
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'active_status_requires_plan' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT active_status_requires_plan 
        CHECK (
          (subscription_status = 'inactive' AND subscription_plan IS NULL) OR
          (subscription_status IN ('active_recurring', 'active_ending') AND subscription_plan IS NOT NULL)
        );
    END IF;
END $;

-- =====================================================
-- 4. Safely Create Indexes (If Not Exists)
-- =====================================================

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_user_id ON user_profiles (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles (subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_plan ON user_profiles (subscription_plan);
CREATE INDEX IF NOT EXISTS idx_subscription_status_plan ON user_profiles (subscription_status, subscription_plan);

-- Unique indexes (need special handling)
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_polar_customer_id'
    ) THEN
        CREATE UNIQUE INDEX idx_polar_customer_id 
        ON user_profiles (polar_customer_id) 
        WHERE polar_customer_id IS NOT NULL;
    END IF;
END $;

DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_polar_subscription_id'
    ) THEN
        CREATE UNIQUE INDEX idx_polar_subscription_id 
        ON user_profiles (polar_subscription_id) 
        WHERE polar_subscription_id IS NOT NULL;
    END IF;
END $;

-- =====================================================
-- 5. Safely Enable Row Level Security
-- =====================================================

-- Enable RLS (if not already enabled)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. Safely Create or Replace Policies
-- =====================================================

-- Drop existing policies and recreate them (ensure latest version)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT 
  USING (auth.uid()::text = clerk_user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE 
  USING (auth.uid()::text = clerk_user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid()::text = clerk_user_id);

DROP POLICY IF EXISTS "Service role can insert profile" ON user_profiles;
CREATE POLICY "Service role can insert profile" ON user_profiles
  FOR INSERT
  TO public
  WITH CHECK (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
CREATE POLICY "Service role full access" ON user_profiles
  FOR ALL 
  USING (current_setting('role') = 'service_role');

-- =====================================================
-- 7. Safely Create Trigger Function and Triggers
-- =====================================================

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Safely create trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. Set Permissions
-- =====================================================

-- Grant permissions (will not override existing permissions)
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- =====================================================
-- 9. Completion Notice
-- =====================================================

DO $
BEGIN
    RAISE NOTICE 'Non-destructive database script completed successfully!';
    RAISE NOTICE '- Table created or confirmed to exist';
    RAISE NOTICE '- Constraints safely added';
    RAISE NOTICE '- Indexes created';
    RAISE NOTICE '- RLS policies updated';
    RAISE NOTICE '- Triggers configured';
    RAISE NOTICE '- Permissions granted';
END $;
```

4. 點擊 **"Run"** 執行 SQL
5. 執行成功後，前往 **Table Editor** 查看建立的資料表

**執行驗證**：
- SQL 執行完成後，會在下方看到執行結果和成功訊息
- 前往左側選單的 **Table Editor**，應該會看到新建立的 `user_profiles` 資料表
- 點擊資料表名稱可以查看表格結構、欄位定義和約束條件
- 在 **Policies** 標籤中可以確認 Row Level Security 政策已正確建立

**重要說明**：
- 包含完整的約束條件、索引和安全設定
- 使用簡化的訂閱邏輯：`inactive`, `active_recurring`, `active_ending`
- 執行前請確保已備份重要資料
- 如有疑問請先在測試環境中執行

### 步驟 5: 安裝依賴套件

```bash
npm install @supabase/supabase-js
```

### 步驟 6: 配置客戶端

**專案已預先配置好 Supabase 客戶端**，位於 `src/lib/supabase.ts`，包含：

- **前端客戶端**：使用 anon key，受 RLS 權限控制
- **後端管理員客戶端**：使用 service role key，具完整資料庫權限


## 🧪 測試驗證

### 測試清單

#### 資料庫連接測試
- [ ] 成功連接到 Supabase 專案
- [ ] 前端客戶端正常運作
- [ ] 後端管理員客戶端正常運作
- [ ] 環境變數正確載入

#### 資料表操作測試
- [ ] 可以成功建立用戶資料
- [ ] 可以讀取用戶訂閱資料
- [ ] 可以更新訂閱方案和狀態
- [ ] 約束條件正確運作

#### 整合測試
- [ ] 新用戶註冊時自動建立訂閱記錄
- [ ] Dashboard 正確顯示用戶資料
- [ ] Polar 付費系統欄位正確更新
- [ ] 錯誤處理適當運作

#### 安全性測試
- [ ] RLS 政策正確限制資料存取
- [ ] 無法直接存取其他用戶資料
- [ ] API 金鑰安全性確認
- [ ] 前端不暴露敏感資訊

### 測試步驟

#### 1. 基本連接測試
```bash
# 在瀏覽器控制台執行
fetch('/api/user/subscription')
  .then(res => res.json())
  .then(console.log);
```

#### 2. 用戶註冊流程測試
- 註冊新用戶帳戶
- 檢查 Supabase 中是否自動建立 `user_profiles` 記錄
- 確認預設值（免費方案、active 狀態）正確

#### 3. Dashboard 資料顯示測試
- 登入並訪問用戶儀表板
- 確認顯示真實的訂閱資料
- 測試資料更新功能


## 📚 相關資源

- [Supabase 官方文檔](https://supabase.com/docs)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript 客戶端](https://supabase.com/docs/reference/javascript)
