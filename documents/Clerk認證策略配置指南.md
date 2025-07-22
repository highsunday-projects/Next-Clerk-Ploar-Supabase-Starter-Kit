---
uuid: 7934755f4e714ce2ab6addece8b7072e
---
# Clerk 認證系統配置指南

## 📋 問題描述

您可能遇到以下困惑的情況：
- 註冊時系統要求設置密碼
- 登入時卻沒有密碼輸入欄位
- 只能看到 Google 登入按鈕

這是因為 Clerk 的認證策略配置不一致導致的。

## 🔍 問題原因

Clerk 允許為 **註冊** 和 **登入** 分別配置不同的認證方式。如果配置不當，會出現：

### 錯誤配置示例
```
註冊 (Sign-up):
✅ Email + Password
✅ Google

登入 (Sign-in):
❌ Email + Password (未啟用)
✅ Google (僅啟用)
```

這會導致用戶註冊時設置了密碼，但登入時找不到密碼欄位。

## 🛠️ 解決步驟

### 步驟 1: 進入 Clerk Dashboard

1. 前往 [Clerk Dashboard](https://clerk.com)
2. 選擇您的專案
3. 點擊左側選單的 **User & Authentication**

### 步驟 2: 配置 Email, Phone, Username

1. 點擊 **Email, Phone, Username**
2. 確保以下設定：

#### Email Address 設定
- **Required for sign-up**: ✅ 啟用
- **Used for sign-in**: ✅ 啟用

#### Password 設定
- **Required for sign-up**: ✅ 啟用
- **Used for sign-in**: ✅ 啟用

### 步驟 3: 配置 Social Connections

1. 點擊 **Social Connections**
2. 根據需求啟用社交登入選項：

#### Google 設定（推薦）
- **Enable for sign-up**: ✅ 啟用
- **Enable for sign-in**: ✅ 啟用

#### GitHub 設定（可選）
- **Enable for sign-up**: 可選
- **Enable for sign-in**: 可選

### 步驟 4: 驗證設定

完成設定後，您的認證策略應該如下：

```
註冊 (Sign-up):
✅ Email + Password
✅ Google
✅ GitHub (可選)

登入 (Sign-in):
✅ Email + Password
✅ Google
✅ GitHub (可選)
```

## 🎯 推薦配置

### 基本配置（適合大多數應用）
```
認證方式:
✅ Email + Password (主要方式)
✅ Google (便利選項)

要求設定:
- Email: 必需
- Password: 必需
- Email 驗證: 啟用
```

### 進階配置（企業級應用）
```
認證方式:
✅ Email + Password
✅ Google
✅ GitHub
✅ Microsoft (企業用戶)

安全設定:
✅ Multi-factor Authentication
✅ Password complexity requirements
✅ Session management
```

## 🧪 測試驗證

### 測試清單

#### 註冊流程測試
- [ ] 可以使用 Email + Password 註冊
- [ ] 可以使用 Google 帳戶註冊
- [ ] 註冊後收到驗證郵件
- [ ] 驗證後可以正常登入

#### 登入流程測試
- [ ] 可以使用 Email + Password 登入
- [ ] 可以使用 Google 帳戶登入
- [ ] 錯誤密碼時顯示適當錯誤訊息
- [ ] 登入成功後正確重定向

#### 密碼管理測試
- [ ] 可以在個人資料頁面變更密碼
- [ ] Google 用戶可以設置密碼作為備用登入
- [ ] 密碼強度驗證正常運作

## 🔧 常見問題解決

### Q1: 設定後仍然看不到密碼欄位
**解決方案**：
1. 清除瀏覽器快取
2. 重啟開發伺服器
3. 檢查是否在正確的環境（Development/Production）
4. 確認 API 金鑰是否正確

### Q2: Google 登入後無法設置密碼
**解決方案**：
1. 確保 Password 在 Sign-up 和 Sign-in 都已啟用
2. 檢查個人資料頁面的密碼管理組件
3. 確認用戶的 `passwordEnabled` 狀態

### Q3: 用戶抱怨登入方式不一致
**解決方案**：
1. 統一註冊和登入的認證策略
2. 在 UI 中清楚說明可用的登入方式
3. 提供密碼重置功能

## 📱 用戶體驗建議

### 登入頁面優化
```typescript
// 在登入頁面顯示可用的登入方式
<div className="text-center text-sm text-gray-600 mb-4">
  您可以使用以下方式登入：
  <div className="flex justify-center space-x-4 mt-2">
    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
      電子郵件 + 密碼
    </span>
    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
      Google 帳戶
    </span>
  </div>
</div>
```

### 註冊頁面說明
```typescript
// 在註冊頁面說明密碼用途
<p className="text-xs text-gray-500 mt-2">
  設置密碼後，您可以使用電子郵件和密碼登入，
  也可以繼續使用 Google 帳戶登入。
</p>
```

## 🔐 安全性考量

### 密碼策略
- **最小長度**: 8 個字元
- **複雜度**: 包含字母和數字
- **歷史**: 避免重複使用最近的密碼

### 會話管理
- **自動登出**: 設定適當的會話過期時間
- **多裝置**: 允許多裝置同時登入
- **安全登出**: 確保所有會話正確終止

### 監控和日誌
- **登入嘗試**: 監控失敗的登入嘗試
- **異常活動**: 檢測可疑的帳戶活動
- **審計日誌**: 記錄重要的安全事件

## 📚 相關資源

- [Clerk Authentication Strategies](https://clerk.com/docs/authentication/configuration/sign-up-sign-in-options)
- [Clerk Social Connections](https://clerk.com/docs/authentication/social-connections/overview)
- [Clerk Password Management](https://clerk.com/docs/authentication/configuration/password-settings)
- [Clerk Security Best Practices](https://clerk.com/docs/security/overview)

---

**文檔版本**: 1.0  
**最後更新**: 2025-07-16  
**維護者**: 開發團隊
