---
title: 簡化 Starter Kit，移除企業版，優化雙方案架構
author: 開發團隊
date: 2025-07-20
version: 1.0
uuid: af247b54d38245a8ba96771d31d57490
---

# SF08 - Starter Kit 簡化與雙方案架構優化 (簡化需求)

## 1. 功能概述 (Feature Overview)

本功能旨在簡化 Starter Kit，移除企業版方案，優化為雙方案架構（免費 + 專業版），並相應調整前端介面、後端整合和相關文件。專業版方案維持現有規格不變（10,000 次 API 呼叫/月，$5/月），重點在於移除企業版相關的所有功能和邏輯，使 Starter Kit 更適合快速啟動和原型開發。

**商業動機**：
- 降低產品複雜度，提升用戶決策效率
- 簡化開發和維護成本
- 更符合 MVP (最小可行產品) 的設計理念
- 提供更清晰的升級路徑

## 2. 需求描述 (Requirement/User Story)

- **As a** 使用 Starter Kit 的開發者
- **I want** 一個簡化的雙方案訂閱系統（免費 + 專業）
- **So that** 我可以快速建立 SaaS 應用原型，而不需要處理複雜的多方案邏輯

## 3. 功能要求 (Functional Requirements)

### 基本要求：

#### 3.1 訂閱方案調整
- **移除企業版方案**：從所有系統組件中移除企業版相關邏輯
- **保留雙方案架構**：
  - **免費方案**: 1,000 次 API 呼叫/月，免費
  - **專業方案**: 10,000 次 API 呼叫/月，$5/月（維持現狀）
- **保持專業方案規格不變**：維持現有的 10,000 次 API 呼叫/月，$5/月

#### 3.2 前端調整
- **價格頁面簡化**：移除企業版卡片，優化雙方案佈局
- **Dashboard 更新**：移除企業版相關的升級選項和狀態顯示
- **訂閱管理頁面**：簡化方案切換邏輯，只支援免費↔專業切換
- **導航和介面**：移除所有企業版相關的 UI 元素

#### 3.3 後端整合調整
- **Supabase 資料庫**：
  - 更新 `subscription_plan` 檢查約束，只允許 'free', 'pro'
  - 調整 `monthly_usage_limit` 預設值和邏輯
- **Polar 整合**：
  - 移除企業版產品 ID 配置
  - 簡化 Checkout API，只處理專業版升級
  - 更新 Webhook 處理邏輯
- **API 路由**：更新所有方案相關的 API 端點

#### 3.4 文件更新
- **專案架構文件**：更新方案說明和技術架構
- **Supabase 配置文件**：更新資料庫結構說明
- **Polar 整合文件**：簡化付費流程說明
- **README**：更新功能特色和方案介紹

### 例外處理：
- **現有企業版用戶**：如已有企業版訂閱資料，降級為專業版
- **環境變數**：移除企業版相關的環境變數，並提供遷移指南
- **錯誤處理**：確保移除企業版後不會產生未處理的錯誤

## 4. 驗收標準 (Acceptance Criteria)

- [ ] **訂閱方案**：系統只包含免費和專業兩種方案
- [ ] **前端介面**：所有頁面不再顯示企業版選項，雙方案佈局美觀
- [ ] **資料庫結構**：約束條件更新，只允許 'free' 和 'pro' 方案
- [ ] **付費流程**：Polar 整合只處理專業版升級，流程順暢
- [ ] **文件完整性**：所有文件反映新的雙方案架構
- [ ] **功能測試**：免費↔專業方案切換功能正常
- [ ] **向後相容**：現有免費和專業用戶不受影響
- [ ] **程式碼清理**：移除所有企業版相關的死程式碼

## 5. 實作註記 (Implementation Notes)

### 技術規格：
- **前端框架**：Next.js 15.4.1, React 19.1.0, TypeScript
- **樣式系統**：Tailwind CSS 4.x
- **認證系統**：Clerk
- **資料庫**：Supabase PostgreSQL
- **付費系統**：Polar

### 資料庫設計調整：
```sql
-- 更新訂閱方案檢查約束
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS valid_subscription_plan;

ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_plan
CHECK (subscription_plan IN ('free', 'pro'));

-- 更新現有企業版用戶為專業版
UPDATE user_profiles 
SET subscription_plan = 'pro', 
    monthly_usage_limit = 10000
WHERE subscription_plan = 'enterprise';
```

### API 介面調整：
- **移除端點**：無需移除，但簡化處理邏輯
- **更新回應**：所有方案相關 API 只回傳 'free' 或 'pro'
- **Polar Webhook**：簡化事件處理，只處理專業版相關事件

### 外部相依性：
- **Polar 產品配置**：移除企業版產品，只保留專業版
- **環境變數更新**：移除 `POLAR_ENTERPRISE_PRODUCT_ID`

## 6. 非功能性需求 (Non-Functional Requirements)

- **效能要求**：簡化邏輯後，頁面載入和 API 回應時間應維持或改善
- **安全性要求**：維持現有的安全性標準，確保資料遷移安全
- **可用性要求**：雙方案介面應更簡潔易懂，提升用戶體驗
- **維護性要求**：移除複雜度後，程式碼應更易維護和擴展

## 7. 詳細實作清單

### 7.1 前端調整項目
```typescript
// 需要調整的檔案清單
src/components/PricingSection.tsx      // 移除企業版卡片
src/app/dashboard/page.tsx             // 簡化方案顯示
src/app/dashboard/subscription/page.tsx // 移除企業版升級選項
src/lib/subscriptionUtils.ts           // 更新方案配置
```

### 7.2 後端調整項目
```typescript
// 需要調整的檔案清單
src/app/api/polar/create-checkout/route.ts // 簡化 Checkout 邏輯
src/app/api/webhooks/polar/route.ts        // 簡化 Webhook 處理
src/lib/userProfileService.ts              // 更新方案邏輯
src/types/supabase.ts                      // 更新型別定義
```

### 7.3 文件調整項目
```markdown
# 需要更新的文件清單
documents/當前專案架構.md               // 更新方案說明
documents/Supabase配置與使用說明.md      // 更新資料庫結構
documents/Polar金流整合說明.md          // 簡化付費流程
documents/SaaS訂閱方案(Demo用).md       // 移除企業版內容
README.md                              // 更新功能介紹
```

### 7.4 新的方案配置
```typescript
export const SUBSCRIPTION_PLANS = {
  free: {
    name: '免費方案',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '每月 1,000 次 API 呼叫',
      '基本功能存取',
      '社群支援'
    ],
    limits: {
      apiCalls: 1000,
      storage: '100MB',
      projects: 1
    }
  },
  pro: {
    name: '專業方案',
    price: 5,
    currency: 'USD', 
    interval: 'month',
    popular: true,
    features: [
      '每月 10,000 次 API 呼叫',
      '進階功能存取',
      '優先支援',
      '詳細分析報告'
    ],
    limits: {
      apiCalls: 10000,
      storage: '1GB',
      projects: 5
    }
  }
};
```

## 8. 補充說明 (Additional Notes)

### 遷移策略：
1. **資料庫遷移**：先更新現有企業版用戶為專業版
2. **環境變數清理**：移除企業版相關配置
3. **段階式部署**：先部署後端變更，再部署前端變更
4. **向後相容**：確保現有用戶不受影響

### 風險評估：
- **風險**：現有企業版用戶可能不滿意強制降級
- **緩解**：提供清楚的升級路徑說明和溝通
- **風險**：Polar 配置變更可能影響現有訂閱
- **緩解**：謹慎處理 Webhook 事件，確保資料同步正確

### 測試重點：
- 免費用戶升級專業版流程
- 專業版用戶管理和計費
- 資料庫約束條件驗證
- 前端介面響應式設計
- Polar Webhook 事件處理

---

## 開發提醒 (Development Notes)

此簡化需求適用於：
- 產品初期階段，需要聚焦核心功能
- Starter Kit 優化，降低複雜度
- MVP 開發，快速驗證市場需求
- 程式碼維護，移除不必要的複雜邏輯

**開發流程建議**：
1. 備份現有程式碼和資料庫
2. 先完成資料庫結構調整
3. 更新後端 API 和整合邏輯
4. 調整前端介面和用戶體驗
5. 更新所有相關文件
6. 進行完整的功能測試
7. 部署並監控系統狀態