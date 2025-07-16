---
uuid: 9bec16718b8848d295633ecd0e52a112
---
# Next-Clerk-Polar-Supabase Starter Kit

> 🚀 一個現代化的 SaaS 網站模板，整合了 Next.js、Clerk、Polar 和 Supabase，讓您快速建立具備完整功能的 SaaS 應用程式。

## ✨ 特色功能

- 🔐 **完整認證系統** - 使用 Clerk 提供用戶註冊、登入、社交登入、多因素認證
- 💳 **付費訂閱功能** - 整合 Polar 處理訂閱管理、計費、發票生成
- 🗄️ **強大資料庫** - 使用 Supabase 提供 PostgreSQL、即時同步、檔案儲存
- 📊 **管理後台** - 用戶管理、財務報告、訂閱分析
- 🎨 **現代化 UI** - 使用 Tailwind CSS 和 Shadcn/ui 組件
- 🚀 **快速部署** - 支援 Vercel 一鍵部署

## 🛠️ 技術棧

### 前端框架
- **Next.js 14+** (App Router) - React 18+, TypeScript, Server Components
- **Tailwind CSS** - 現代化 CSS 框架
- **Shadcn/ui** - 美觀的 UI 組件庫

### 認證系統
- **Clerk** - 用戶管理、社交登入、組織管理、多因素認證

### 付費系統
- **Polar** - 訂閱管理、付費處理、發票生成、退款處理

### 資料庫
- **Supabase** - PostgreSQL、即時資料同步、Row Level Security、檔案儲存

### 開發工具
- **Prisma** - 類型安全的 ORM
- **Zod** - 資料驗證
- **React Hook Form** - 表單處理
- **TypeScript** - 類型安全

## 🎯 核心功能

### 用戶認證
- ✅ 電子郵件註冊/登入
- ✅ 社交登入 (Google, GitHub, Discord 等)
- ✅ 多因素認證 (MFA)
- ✅ 密碼重置
- ✅ 用戶個人資料管理
- ✅ 組織管理和邀請系統

### 付費功能
- ✅ 多種訂閱方案
- ✅ 方案升級/降級
- ✅ 試用期管理
- ✅ 自動續費
- ✅ 發票生成
- ✅ 付款歷史
- ✅ 退款處理

### 資料庫功能
- ✅ 用戶資料管理
- ✅ 組織資料
- ✅ 權限管理
- ✅ 即時資料同步
- ✅ 檔案上傳和儲存

### 管理後台
- ✅ 用戶管理介面
- ✅ 訂閱分析
- ✅ 收入報告
- ✅ 活動日誌
- ✅ 系統設定

### 前端頁面
- ✅ 響應式首頁
- ✅ 功能介紹頁面
- ✅ 價格方案頁面
- ✅ 用戶儀表板
- ✅ 帳戶設定頁面
- ✅ 訂閱管理頁面

## 🏗️ 專案結構

```
next-clerk-polar-supabase-starter/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # 認證相關頁面
│   │   ├── (dashboard)/    # 儀表板頁面
│   │   ├── api/            # API 路由
│   │   └── globals.css     # 全域樣式
│   ├── components/         # React 組件
│   │   ├── ui/            # UI 組件
│   │   ├── auth/          # 認證組件
│   │   └── dashboard/     # 儀表板組件
│   ├── lib/               # 工具函數
│   ├── hooks/             # 自定義 Hooks
│   └── types/             # TypeScript 型別定義
├── supabase/              # Supabase 設定
│   ├── migrations/        # 資料庫遷移
│   └── functions/         # Edge Functions
├── docs/                  # 文檔
└── examples/              # 範例代碼
```

## 🚀 快速開始

### 1. 克隆專案
```bash
git clone https://github.com/yourusername/next-clerk-polar-supabase-starter.git
cd next-clerk-polar-supabase-starter
```

### 2. 安裝依賴
```bash
npm install
# 或
yarn install
```

### 3. 環境變數設定
```bash
cp .env.example .env.local
```

編輯 `.env.local` 並填入您的 API 金鑰：
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Polar
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
```

### 4. 資料庫設定
```bash
# 執行資料庫遷移
npm run db:migrate

# 生成 Prisma 客戶端
npm run db:generate
```

### 5. 啟動開發伺服器
```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

## 📖 文檔

- [快速開始指南](./docs/getting-started.md)
- [部署指南](./docs/deployment.md)
- [自定義指南](./docs/customization.md)
- [API 文檔](./docs/api.md)

## 🤝 貢獻

歡迎貢獻！請先閱讀我們的 [貢獻指南](CONTRIBUTING.md)。

1. Fork 這個專案
2. 創建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟一個 Pull Request

## 📄 授權

這個專案使用 MIT 授權 - 查看 [LICENSE](LICENSE) 檔案了解詳情。

## 🌟 支援

如果這個專案對您有幫助，請給我們一個 ⭐️！

### 社群支援
- [GitHub Discussions](https://github.com/yourusername/next-clerk-polar-supabase-starter/discussions)
- [Discord 社群](https://discord.gg/your-discord)

### 問題回報
如果您發現任何問題，請在 [GitHub Issues](https://github.com/yourusername/next-clerk-polar-supabase-starter/issues) 中回報。

---

由 ❤️ 製作，使用 Next.js + Clerk + Polar + Supabase