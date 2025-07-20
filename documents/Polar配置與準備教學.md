---
uuid: 9a5185ee493f434d8996f4f4512343e3
---
# Polar 配置與準備教學

## 📋 教學概述

本教學將指導開發者如何從零開始設定 Polar 付費系統，包含帳號註冊、產品建立、API 配置和 Webhook 設定，讓您能夠快速整合 Polar 到 Next-Clerk-Polar-Supabase Starter Kit 中。

### 教學資訊
- **建立日期**: 2025-07-19
- **版本**: 1.0
- **適用對象**: 開發者、技術團隊
- **預估時間**: 30-45 分鐘

## 🎯 準備工作

### 前置需求

在開始 Polar 配置之前，請確保您已經：

✅ **完成基礎設定**
- 已設定 Clerk 認證系統
- 已配置 Supabase 資料庫
- 已部署 Next.js 應用程式（或有可存取的開發環境）

✅ **準備必要資訊**
- 企業/個人電子郵件地址
- 銀行帳戶資訊（用於收款）
- 稅務資訊（依據所在地區）
- 應用程式的公開 URL（用於 Webhook）

## 🚀 步驟 1: 註冊 Polar 帳號

### 1.1 建立 Polar 帳號

1. **前往 Polar 官網**
   - 訪問 [https://polar.sh](https://polar.sh)
   - 點擊 "Get Started" 或 "Sign Up"

2. **註冊帳號**
   ```
   • 使用企業或個人電子郵件註冊
   • 設定強密碼
   • 驗證電子郵件地址
   ```

3. **完成帳號設定**
   - 填寫基本資料
   - 選擇帳號類型（個人/企業）
   - 同意服務條款

### 1.2 建立組織 (Organization)

1. **建立新組織**
   ```
   • 組織名稱: 您的公司或專案名稱
   • 組織類型: 選擇適合的類型
   • 地區設定: 選擇您的營運地區
   ```

2. **記錄組織 ID**
   - 在組織設定頁面找到 Organization ID
   - 這將用於環境變數 `NEXT_PUBLIC_POLAR_ORGANIZATION_ID`

## 🛠️ 步驟 2: 設定付款和稅務資訊

### 2.1 銀行帳戶設定

1. **前往 Finance 設定**
   - 在 Polar Dashboard 中找到 "Finance" 或 "Payouts"
   - 點擊 "Add Bank Account"

2. **填寫銀行資訊**
   ```
   • 銀行名稱
   • 帳戶號碼
   • 路由號碼 (如適用)
   • 帳戶持有人姓名
   ```

### 2.2 稅務資訊設定

1. **稅務身份驗證**
   - 提供稅務 ID 或統一編號
   - 上傳必要的稅務文件
   - 設定稅率（如適用）

2. **地區合規設定**
   - 根據您的營運地區設定合規要求
   - 確認支援的付款方式

## 📦 步驟 3: 建立產品 (Products)

### 3.1 建立專業方案產品

1. **前往 Products 頁面**
   - 在 Polar Dashboard 中點擊 "Products"
   - 點擊 "Create Product"

2. **設定專業方案**
   ```yaml
   產品名稱: "Pro Plan"
   描述: "專業方案 - 適合成長中的團隊"
   價格: $5.00
   計費週期: Monthly (每月)
   貨幣: USD
   ```

3. **記錄產品 ID**
   - 建立完成後，複製 Product ID
   - 這將用於環境變數 `POLAR_PRO_PRODUCT_ID`

### 3.2 建立企業方案產品

1. **建立第二個產品**
   ```yaml
   產品名稱: "Enterprise Plan"
   描述: "企業方案 - 適合大型企業"
   價格: $10.00
   計費週期: Monthly (每月)
   貨幣: USD
   ```

2. **記錄產品 ID**
   - 複製 Enterprise Product ID
   - 這將用於環境變數 `POLAR_ENTERPRISE_PRODUCT_ID`

### 3.3 產品設定最佳實踐

```yaml
建議設定:
  • 啟用自動續費
  • 設定試用期 (可選)
  • 配置取消政策
  • 新增產品描述和功能列表
```

## 🔑 步驟 4: 獲取 API 憑證

### 4.1 建立 Organization Access Token

1. **前往 API 設定**
   - 在組織設定中找到 "API" 或 "Access Tokens"
   - 點擊 "Create Token"

2. **設定 Token 權限**
   ```
   Token 名稱: "Next.js App Token"
   權限範圍:
   • products:read
   • checkouts:write
   • subscriptions:read
   • subscriptions:write
   • customers:read
   • customers:write
   ```

3. **記錄 Access Token**
   - 複製生成的 Token（只會顯示一次）
   - 這將用於環境變數 `POLAR_ACCESS_TOKEN`

### 4.2 安全性注意事項

⚠️ **重要提醒**
- Access Token 具有敏感權限，請妥善保管
- 不要將 Token 提交到版本控制系統
- 定期輪換 Token 以提高安全性
- 使用環境變數儲存 Token

## 🔗 步驟 5: 設定 Webhook

### 5.1 建立 Webhook 端點

1. **前往 Webhooks 設定**
   - 在 Polar Dashboard 中找到 "Webhooks"
   - 點擊 "Add Webhook"

2. **設定 Webhook URL**
   ```
   URL: https://your-domain.com/api/webhooks/polar
   
   開發環境可使用 ngrok:
   URL: https://abc123.ngrok.io/api/webhooks/polar
   ```

### 5.2 選擇 Webhook 事件

選擇以下事件類型：
```yaml
必要事件:
  - ✅ subscription.created - 新訂閱建立（已實作）
  - ✅ subscription.updated - 訂閱更新（已實作）
  - ✅ subscription.canceled - 訂閱取消（已實作）
  - ✅ checkout.created - 結帳建立（已實作）
  - ✅ order.created - 訂單建立（已實作）
  - ✅ order.paid - 訂單付款完成（已實作）

可選事件:
  • customer.created
  • customer.updated
  • invoice.created
```

### 5.3 記錄 Webhook Secret

1. **獲取 Webhook Secret**
   - 建立 Webhook 後，複製 Webhook Secret
   - 這將用於環境變數 `POLAR_WEBHOOK_SECRET`

2. **測試 Webhook**
   - 使用 Polar 提供的測試功能
   - 確認您的端點能正確接收事件

## ⚙️ 步驟 6: 配置環境變數

### 6.1 更新 .env.local 檔案

在您的 Next.js 專案中建立或更新 `.env.local` 檔案：

```env
# Polar 付費系統配置
POLAR_ACCESS_TOKEN=polar_at_your_actual_token_here
POLAR_WEBHOOK_SECRET=whsec_your_actual_secret_here
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=your_org_id_here
NEXT_PUBLIC_POLAR_ENVIRONMENT=sandbox

# Polar 產品 ID
POLAR_PRO_PRODUCT_ID=prod_your_pro_product_id
POLAR_ENTERPRISE_PRODUCT_ID=prod_your_enterprise_product_id

# 應用程式 URL (用於 Webhook 和回調)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 6.2 環境變數說明

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `POLAR_ACCESS_TOKEN` | Polar API 存取權杖 | `polar_at_abc123...` |
| `POLAR_WEBHOOK_SECRET` | Webhook 簽名驗證密鑰 | `whsec_def456...` |
| `NEXT_PUBLIC_POLAR_ORGANIZATION_ID` | 組織 ID (前端可見) | `org_xyz789...` |
| `NEXT_PUBLIC_POLAR_ENVIRONMENT` | 環境設定 | `sandbox` 或 `production` |
| `POLAR_PRO_PRODUCT_ID` | 專業方案產品 ID | `prod_pro123...` |
| `POLAR_ENTERPRISE_PRODUCT_ID` | 企業方案產品 ID | `prod_ent456...` |

## 🧪 步驟 7: 測試整合

### 7.1 開發環境測試

1. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

2. **測試 API 端點**
   ```bash
   # 測試 Checkout API
   curl -X POST http://localhost:3000/api/polar/create-checkout \
     -H "Content-Type: application/json" \
     -d '{"plan": "pro", "userId": "test_user_id"}'
   ```

3. **測試前端流程**
   - 登入應用程式
   - 前往訂閱管理頁面
   - 嘗試升級到付費方案

### 7.2 Webhook 測試

1. **使用 ngrok 暴露本地端點**
   ```bash
   ngrok http 3000
   ```

2. **更新 Polar Webhook URL**
   - 將 Webhook URL 更新為 ngrok 提供的 URL
   - 例如: `https://abc123.ngrok.io/api/webhooks/polar`

3. **觸發測試事件**
   - 在 Polar Dashboard 中發送測試 Webhook
   - 檢查本地伺服器日誌確認接收

## 🚀 步驟 8: 生產環境部署

### 8.1 生產環境設定

1. **更新環境變數**
   ```env
   NEXT_PUBLIC_POLAR_ENVIRONMENT=production
   NEXT_PUBLIC_APP_URL=https://your-production-domain.com
   ```

2. **更新 Webhook URL**
   - 將 Polar Webhook URL 更新為生產環境 URL
   - 例如: `https://your-domain.com/api/webhooks/polar`

### 8.2 安全檢查清單

✅ **部署前檢查**
- [ ] 所有環境變數已正確設定
- [ ] Webhook URL 指向正確的生產環境
- [ ] API Token 權限設定適當
- [ ] 銀行帳戶和稅務資訊已驗證
- [ ] 產品價格和描述正確
- [ ] 測試付費流程運作正常

## 🔧 故障排除

### 常見問題

**Q: Webhook 事件沒有被接收**
```
A: 檢查以下項目:
• Webhook URL 是否正確且可存取
• 防火牆是否阻擋了請求
• 應用程式是否正在運行
• 日誌中是否有錯誤訊息
```

**Q: API 請求返回 401 錯誤**
```
A: 檢查 Access Token:
• Token 是否正確設定在環境變數中
• Token 是否已過期或被撤銷
• Token 權限是否足夠
```

**Q: 付費流程無法完成**
```
A: 檢查產品設定:
• 產品 ID 是否正確
• 產品是否已啟用
• 價格設定是否正確
• 組織是否已完成驗證
```

## 📚 參考資源

### 官方文檔
- [Polar 官方文檔](https://docs.polar.sh/)
- [Polar API 參考](https://docs.polar.sh/api-reference)
- [Polar Webhook 指南](https://docs.polar.sh/webhooks)

### 社群資源
- [Polar Discord 社群](https://discord.gg/polar)
- [Polar GitHub](https://github.com/polarsource/polar)

## 🎉 完成確認

完成所有步驟後，您應該能夠：

✅ **基本功能**
- [ ] 用戶可以查看訂閱方案
- [ ] 用戶可以點擊升級按鈕
- [ ] 系統能正確重定向到 Polar 付費頁面
- [ ] 付款完成後能正確回到應用程式

✅ **進階功能**
- [ ] Webhook 事件能正確處理
- [ ] 訂閱狀態能即時同步
- [ ] 錯誤情況有適當的處理
- [ ] 用戶能看到正確的訂閱狀態

恭喜！您已成功完成 Polar 付費系統的配置和整合。

---

**文檔版本**: 1.0  
**最後更新**: 2025-07-19  
**維護者**: 開發團隊  
**狀態**: ✅ 已完成
