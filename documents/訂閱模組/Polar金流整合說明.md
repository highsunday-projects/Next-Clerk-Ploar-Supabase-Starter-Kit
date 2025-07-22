---
uuid: 9d0e684bc89b45e8a014bafdd260738f
---
# Polar 金流整合說明

## 📋 文件概述

本文件詳細說明 Next-Clerk-Polar-Supabase Starter Kit 中 Polar 付費系統的整合實作，包含金流處理流程、用戶訂閱觸發機制和技術實作細節。

### 文件資訊
- **建立日期**: 2025-07-19
- **版本**: 1.0
- **對應需求**: SF05 - Polar 付費系統整合
- **維護者**: 開發團隊

## 🎯 整合概述

### 已完成功能

✅ **Polar SDK 整合**: 成功整合 @polar-sh/sdk 套件  
✅ **Checkout 流程**: 實作完整的訂閱升級付費流程  
✅ **Webhook 處理**: 自動同步訂閱狀態到 Supabase 資料庫  
✅ **前端整合**: 訂閱管理頁面支援真實的升級操作  
✅ **安全驗證**: Webhook 簽名驗證確保資料安全  
✅ **錯誤處理**: 完善的錯誤處理和用戶回饋機制  

### 核心特色

- **無縫整合**: 與現有 Clerk 認證和 Supabase 資料庫完美整合
- **即時同步**: Webhook 事件即時更新用戶訂閱狀態
- **安全可靠**: 完整的簽名驗證和錯誤處理機制
- **用戶友善**: 直觀的升級流程和清晰的狀態回饋
- **可擴展性**: 模組化設計便於新增更多付費方案

## 🏗️ 技術架構

### 系統組件

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Next.js) │    │   後端 API      │    │   Polar 服務    │
│                 │    │                 │    │                 │
│ • 訂閱管理頁面   │◄──►│ • Checkout API  │◄──►│ • 付費處理      │
│ • 升級按鈕      │    │ • Webhook 處理  │    │ • 訂閱管理      │
│ • 狀態顯示      │    │ • 狀態同步      │    │ • 發票生成      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Clerk 認證    │    │  Supabase 資料庫 │    │   用戶通知      │
│                 │    │                 │    │                 │
│ • 用戶身份驗證   │    │ • 訂閱資料儲存   │    │ • 付款確認      │
│ • 權限控制      │    │ • 狀態追蹤      │    │ • 錯誤提醒      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 資料流程

#### 1. 用戶升級流程
```
用戶點擊升級 → 前端驗證 → 呼叫 Checkout API → 建立 Polar Session → 重定向到付費頁面
```

#### 2. 付款處理流程
```
用戶完成付款 → Polar 處理付款 → 觸發 Webhook 事件 → 更新 Supabase 資料 → 用戶收到確認
```

#### 3. 狀態同步流程
```
Webhook 事件 → 簽名驗證 → 解析事件資料 → 更新用戶資料 → 記錄操作日誌
```

## 🔄 用戶訂閱觸發流程

### 完整的用戶體驗流程

#### 階段 1: 升級決策
1. **用戶瀏覽訂閱頁面**
   - 查看當前方案狀態
   - 比較不同方案功能
   - 選擇目標升級方案

2. **方案比較與選擇**
   - 免費方案: 1,000 次 API 呼叫/月
   - 專業方案: 10,000 次 API 呼叫/月 ($5/月)
   - 企業方案: 100,000 次 API 呼叫/月 ($10/月)

#### 階段 2: 付費流程
1. **點擊升級按鈕**
   ```typescript
   // 前端觸發升級
   const handlePlanUpgrade = async (planId: string) => {
     const response = await fetch('/api/polar/create-checkout', {
       method: 'POST',
       body: JSON.stringify({ plan: planId, userId: user.id })
     });
     const { checkoutUrl } = await response.json();
     window.location.href = checkoutUrl;
   };
   ```

2. **建立 Checkout Session**
   ```typescript
   // 後端 API 處理
   const checkoutResponse = await polarApi.checkouts.create({
     checkoutCreate: {
       product_id: productId,
       success_url: `${APP_URL}/dashboard/subscription?success=true`,
       cancel_url: `${APP_URL}/dashboard/subscription?canceled=true`,
       metadata: { clerk_user_id: userId }
     }
   });
   ```

3. **重定向到 Polar 付費頁面**
   - 用戶在 Polar 安全環境中完成付款
   - 支援信用卡、銀行轉帳等多種付款方式
   - 自動生成發票和收據

#### 階段 3: 付款處理
1. **Polar 處理付款**
   - 驗證付款資訊
   - 處理交易
   - 建立訂閱記錄

2. **觸發 Webhook 事件**
   ```typescript
   // Webhook 事件類型
   - subscription.created: 訂閱建立成功
   - payment.succeeded: 付款處理成功
   - checkout.completed: Checkout 流程完成
   ```

#### 階段 4: 狀態同步
1. **接收 Webhook 事件**
   ```typescript
   // Webhook 處理邏輯
   switch (event.type) {
     case 'subscription.created':
       await updateUserSubscription(clerkUserId, {
         subscriptionPlan: 'pro',
         subscriptionStatus: 'active',
         polarSubscriptionId: subscription.id
       });
       break;
   }
   ```

2. **更新資料庫記錄**
   - 更新用戶訂閱方案
   - 設定新的使用額度
   - 記錄 Polar 訂閱 ID
   - 更新計費週期資訊

#### 階段 5: 用戶確認
1. **重定向回應用程式**
   - 付款成功: `/dashboard/subscription?success=true`
   - 付款取消: `/dashboard/subscription?canceled=true`

2. **顯示狀態更新**
   - 即時顯示新的訂閱狀態
   - 更新可用功能和額度
   - 提供付款確認資訊

## 🔐 安全機制

### Webhook 安全驗證
```typescript
// HMAC-SHA256 簽名驗證
export function verifyPolarWebhook(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature.replace(/^sha256=/, ''), 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

### 用戶權限控制
- Clerk 身份驗證確保只有登入用戶可以升級
- API 端點驗證用戶只能為自己建立訂閱
- Supabase RLS 確保資料存取安全

### 錯誤處理機制
- 完整的 try-catch 錯誤捕獲
- 友善的用戶錯誤訊息
- 詳細的伺服器端錯誤日誌
- 自動重試和降級處理

## 📊 支援的訂閱方案

### 免費方案 (Free)
- **價格**: 免費
- **API 額度**: 1,000 次/月
- **功能**: 基本功能、社群支援
- **Polar 產品**: 無需 Polar 處理

### 專業方案 (Pro)
- **價格**: $5/月
- **API 額度**: 10,000 次/月
- **功能**: 進階功能、優先支援、詳細分析
- **Polar 產品**: `POLAR_PRO_PRODUCT_ID`

### 企業方案 (Enterprise)
- **價格**: $10/月
- **API 額度**: 100,000 次/月
- **功能**: 所有功能、24/7 支援、自訂整合
- **Polar 產品**: `POLAR_ENTERPRISE_PRODUCT_ID`

## 🎨 前端整合細節

### 訂閱管理頁面更新
- 新增升級按鈕和載入狀態
- 整合真實的 Polar Checkout 流程
- 處理付款成功/取消回調
- 顯示即時的訂閱狀態

### 用戶體驗優化
- 清晰的方案比較介面
- 直觀的升級流程指引
- 即時的狀態回饋
- 友善的錯誤處理

## 🔮 未來擴展

### 短期計劃
- 支援訂閱降級功能
- 新增付款歷史查看
- 實作發票下載功能

### 中期計劃
- 支援年付優惠方案
- 新增使用統計圖表
- 實作自動續費管理

### 長期計劃
- 支援企業級功能
- 新增優惠券系統
- 實作多幣別支援

## 📝 開發者注意事項

### 環境設定
確保以下環境變數正確設定：
```env
POLAR_ACCESS_TOKEN=polar_at_xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=org_xxx
POLAR_PRO_PRODUCT_ID=prod_xxx
POLAR_ENTERPRISE_PRODUCT_ID=prod_xxx
```

### 測試建議
1. 使用 Polar 沙盒環境進行開發測試
2. 測試完整的付費流程
3. 驗證 Webhook 事件處理
4. 確認資料庫狀態同步

### 監控要點
- Webhook 事件處理成功率
- 付款成功/失敗比例
- 用戶升級轉換率
- API 錯誤率和回應時間

## 🎉 總結

Polar 金流整合已成功實作，提供了完整的 SaaS 付費解決方案。主要成就包括：

1. **完整的付費流程**: 從升級決策到付款確認的端到端體驗
2. **安全可靠**: 完整的簽名驗證和錯誤處理機制
3. **即時同步**: Webhook 事件確保資料一致性
4. **用戶友善**: 直觀的介面和清晰的狀態回饋
5. **可擴展性**: 模組化設計便於未來功能擴展

這個整合為 SaaS 應用程式提供了穩定的營收基礎，並為用戶提供了流暢的付費體驗。

---

**文檔版本**: 1.0  
**最後更新**: 2025-07-19  
**維護者**: 開發團隊  
**狀態**: ✅ 已完成
