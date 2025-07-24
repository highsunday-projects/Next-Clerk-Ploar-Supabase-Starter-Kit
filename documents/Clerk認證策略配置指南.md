---
uuid: 775ca7334b98405b8738ed530689f6dc
---
# Clerk 認證系統配置指南

## 📋 什麼是 Clerk？

Clerk 是一個現代化的用戶認證和身份管理平台，專為開發者設計，提供完整的認證解決方案。

### 🎯 主要優勢

- **🚀 快速整合**：幾分鐘內即可完成認證系統設置
- **🛡️ 企業級安全**：內建多因素認證、會話管理和安全監控
- **🎨 美觀介面**：提供現代化、可自訂的認證 UI 組件
- **🔗 社交登入**：支援 Google、GitHub、Microsoft 等多種第三方登入
- **📱 多平台支援**：Web、移動應用和後端 API 全方位支援
- **⚡ 高效能**：全球 CDN 和快速響應時間
- **🔧 開發者友善**：豐富的 SDK、詳細文檔和活躍社群

### 🏗️ 適用場景

- **SaaS 應用程式**：提供完整的用戶管理和訂閱功能
- **企業應用**：支援組織管理、角色權限和 SSO 整合
- **個人專案**：快速實現用戶註冊、登入和個人資料管理
- **電商平台**：安全的用戶認證和購物車會話管理

## 🚀 快速開始

### 步驟 1: 建立 Clerk 帳戶和應用

1. 前往 [Clerk Dashboard](https://clerk.com)
2. 註冊新帳戶或使用現有帳戶登入
3. 點擊 **"Create application"** 建立新應用
4. 填寫應用資訊：
   - **Application name**: 您的應用名稱
   - **Choose your preferred sign-in method**: 選擇認證方式
5. 點擊 **"Create application"** 完成建立

**注意**：框架選擇頁面可以忽略，因為我們的專案已經預先配置好所需的 Clerk 整合。

### 步驟 2: 配置認證策略

#### 2.1 基本認證設定

1. 在 Clerk Dashboard 中，點擊左側選單的 **"User & Authentication"**
2. 在認證方式選擇中，根據需求勾選以下選項：

#### 推薦設定（直接勾選即可）：
- ✅ **Email** - 基本電子郵件認證
- ✅ **Google** - Google 社交登入
- ✅ **GitHub** - GitHub 社交登入
- ✅ **Username** - 用戶名選項

**注意**：只需要勾選您想要啟用的認證方式即可，系統會自動同時啟用註冊和登入功能。

### 步驟 3: 獲取 API 金鑰

1. 在 Clerk Dashboard 中，先點擊 **"Configure"** 標籤頁
2. 然後前往 **"Developers"** → **"API Keys"**
3. 複製以下金鑰：
   - **Publishable key**: 前端使用的公開金鑰
   - **Secret key**: 後端使用的私密金鑰

### 步驟 4: 環境變數設定

在您的 `.env.local` 檔案中添加：

```env
# Clerk 認證系統
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxx
```

### 步驟 5: 配置 Webhook（可選，推薦）

**說明**：Webhook 不是必需的，系統會在用戶首次訪問儀表板時自動建立 Supabase 用戶資料。但配置 Webhook 可以提供更好的用戶體驗和資料完整性。

#### 🎯 兩種用戶資料建立機制

| 機制 | 觸發時機 | 優點 | 缺點 |
|------|----------|------|------|
| **延遲建立**（預設） | 首次訪問儀表板時 | 無需配置、簡單可靠 | 首次載入稍慢 |
| **Webhook 即時建立** | 用戶註冊時 | 即時建立、更好體驗 | 需要額外配置 |

#### 🚀 如果選擇配置 Webhook（推薦）

1. 在 Clerk Dashboard 的 **"Configure"** 標籤頁中，前往 **"Webhooks"**
2. 點擊 **"Add Endpoint"**
3. 設定 Webhook：
   - **Endpoint URL**: `https://yourdomain.com/api/webhooks/clerk`
   - **Events**: 勾選以下事件
     - ✅ `user.created` - 用戶註冊時自動建立訂閱資料
     - ✅ `user.updated` - 更新用戶活躍時間
     - ✅ `user.deleted` - 記錄用戶刪除事件
4. 複製 **Signing Secret** 並添加到環境變數

### 步驟 6: 更新環境變數

#### 基本配置（必要）
```env
# Clerk 認證系統
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxx
```

#### 如果配置了 Webhook（可選）
```env
# Clerk 認證系統
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxx
```

## 🎯 推薦配置

### 基本配置（適合大多數應用）

```
認證方式:
✅ Email (主要方式)
✅ Google (Gmail) (便利選項)
✅ GitHub (便利選項)

要求設定:
- Email: 必需
- Google: 推薦啟用
- GitHub: 推薦啟用
- Username: 可選
```

### 進階配置（企業級應用）

```
認證方式:
✅ Email
✅ Google (Gmail)
✅ GitHub  
✅ Username
✅ 其他社交登入選項

安全設定:
✅ Multi-factor Authentication
✅ Password complexity requirements
✅ Session management
```

## 🧪 測試驗證

### 測試清單

#### 註冊流程測試
- [ ] 可以使用 Email 註冊
- [ ] 可以使用 Google 帳戶註冊
- [ ] 可以使用 GitHub 帳戶註冊
- [ ] 註冊後收到驗證郵件
- [ ] 驗證後可以正常登入

#### 登入流程測試
- [ ] 可以使用 Email 登入
- [ ] 可以使用 Google 帳戶登入
- [ ] 可以使用 GitHub 帳戶登入
- [ ] 錯誤資訊時顯示適當錯誤訊息
- [ ] 登入成功後正確重定向

#### 用戶資料建立測試
- [ ] 註冊後首次訪問儀表板能正常載入
- [ ] 用戶資料在 Supabase 中正確建立
- [ ] 如果配置了 Webhook：註冊時立即建立用戶資料
- [ ] 如果未配置 Webhook：首次訪問時自動建立用戶資料

#### 密碼管理測試
- [ ] 可以在個人資料頁面變更密碼
- [ ] Google 用戶可以設置密碼作為備用登入
- [ ] 密碼強度驗證正常運作


## 📚 相關資源

- [Clerk Authentication Strategies](https://clerk.com/docs/authentication/configuration/sign-up-sign-in-options)
- [Clerk Social Connections](https://clerk.com/docs/authentication/social-connections/overview)
- [Clerk Password Management](https://clerk.com/docs/authentication/configuration/password-settings)
- [Clerk Security Best Practices](https://clerk.com/docs/security/overview)

---

**文檔版本**: 2.1
**最後更新**: 2025-07-23
**維護者**: 開發團隊
**更新內容**:
- 修正 Webhook 配置說明：從「必要」改為「可選」
- 新增兩種用戶資料建立機制的比較說明
- 更新測試驗證清單，包含用戶資料建立測試
- 澄清系統實際使用延遲建立機制，Webhook 為額外保障