---
uuid: db7b97954960412fab7bd53b1c12f86c
---
# 訂閱邏輯簡化功能需求書

## 📋 專案概述

**專案名稱**: Next-Clerk-Polar-Supabase 訂閱邏輯簡化  
**版本**: 4.0  
**建立日期**: 2025-07-20  
**需求類型**: 架構重構與邏輯簡化  

## 🎯 核心目標

將目前的雙方案架構（免費版 + 專業版）簡化為單一產品邏輯，僅通過**訂閱狀態**來區分用戶權限，而非透過產品類型。

## 📊 現況分析

### 目前架構問題
- **複雜度過高**: 需要管理兩種不同的產品類型
- **Polar 整合複雜**: 免費版也被當作 Polar 產品處理
- **邏輯冗餘**: 免費用戶不需要 Polar 產品概念
- **維護困難**: 雙重邏輯增加程式複雜度

### 期望改善
- **邏輯統一**: 僅根據是否有有效訂閱來判斷權限
- **Polar 專用**: 只有付費用戶才與 Polar 系統整合
- **程式簡化**: 減少條件判斷和分支邏輯

## 🏗️ 新架構設計

### 用戶分類邏輯

```
用戶狀態 = {
  未訂閱用戶: {
    subscription_plan: null,
    subscription_status: 'inactive',
    polar_subscription_id: null,
    權限: 基礎功能
  },
  
  付費訂閱用戶: {
    subscription_plan: 'pro',
    subscription_status: 'active' | 'trial' | 'past_due',
    polar_subscription_id: 存在,
    權限: 完整功能
  }
}
```

### 權限判斷邏輯

```javascript
// 簡化前（複雜）
if (user.subscription_plan === 'free') {
  // 免費用戶邏輯
} else if (user.subscription_plan === 'pro') {
  // 付費用戶邏輯
}

// 簡化後（簡潔）
if (user.polar_subscription_id && user.subscription_status === 'active') {
  // 付費用戶邏輯
} else {
  // 未訂閱用戶邏輯
}
```

## 📋 功能需求

### 1. 資料庫架構調整

#### 1.1 欄位重新定義
- **移除**: `subscription_plan` 的 'free' 選項
- **調整**: `subscription_plan` 僅允許 'pro' 或 `null`
- **新增**: `is_subscribed` 計算欄位（基於 polar_subscription_id 存在性）

#### 1.2 約束條件更新
```sql
-- 舊約束
CHECK (subscription_plan IN ('free', 'pro'))

-- 新約束  
CHECK (subscription_plan IS NULL OR subscription_plan = 'pro')
```

#### 1.3 預設值調整
```sql
-- 新用戶預設值
subscription_plan: null
subscription_status: 'inactive'
polar_subscription_id: null
```

### 2. API 邏輯調整

#### 2.1 用戶註冊流程
```typescript
// 新用戶建立邏輯
const createUser = async (clerkUserId: string) => {
  return await supabase
    .from('user_profiles')
    .insert({
      clerk_user_id: clerkUserId,
      subscription_plan: null,        // 不再預設為 'free'
      subscription_status: 'inactive', // 明確標示未訂閱
      monthly_usage_limit: 1000,      // 基礎額度
    });
};
```

#### 2.2 訂閱狀態檢查
```typescript
// 簡化的權限檢查
const hasProAccess = (user: UserProfile): boolean => {
  return !!(
    user.polar_subscription_id && 
    user.subscription_status === 'active'
  );
};

// 替代複雜的方案檢查
const getUserPermissions = (user: UserProfile) => {
  return hasProAccess(user) 
    ? PERMISSIONS.PRO 
    : PERMISSIONS.FREE;
};
```

### 3. Polar Webhook 整合調整

#### 3.1 訂閱建立
```typescript
// 訂閱成功時
const handleSubscriptionCreated = async (polarData) => {
  await supabase
    .from('user_profiles')
    .update({
      subscription_plan: 'pro',
      subscription_status: 'active',
      polar_subscription_id: polarData.id,
      polar_customer_id: polarData.customer_id,
      current_period_end: polarData.current_period_end,
    })
    .eq('clerk_user_id', userId);
};
```

#### 3.2 訂閱取消
```typescript
// 訂閱取消時
const handleSubscriptionCancelled = async (polarData) => {
  await supabase
    .from('user_profiles')
    .update({
      subscription_plan: null,        // 回到未訂閱狀態
      subscription_status: 'inactive',
      polar_subscription_id: null,
      polar_customer_id: null,
      current_period_end: null,
    })
    .eq('polar_subscription_id', polarData.id);
};
```

### 4. 前端元件調整

#### 4.1 訂閱狀態顯示
```tsx
// 簡化的狀態顯示元件
const SubscriptionStatus = ({ user }: { user: UserProfile }) => {
  const isSubscribed = hasProAccess(user);
  
  return (
    <div>
      <Badge variant={isSubscribed ? "success" : "default"}>
        {isSubscribed ? "專業版用戶" : "基礎用戶"}
      </Badge>
    </div>
  );
};
```

#### 4.2 功能權限控制
```tsx
// 統一的功能權限包裝元件
const ProFeature = ({ user, children }: ProFeatureProps) => {
  if (!hasProAccess(user)) {
    return <UpgradePrompt />;
  }
  
  return <>{children}</>;
};
```

## 🗃️ 資料遷移計畫

### 階段一：資料庫結構更新
1. **備份現有資料**
2. **建立遷移腳本**
3. **更新現有 'free' 用戶**:
   ```sql
   UPDATE user_profiles 
   SET 
     subscription_plan = null,
     subscription_status = 'inactive'
   WHERE subscription_plan = 'free';
   ```

### 階段二：API 邏輯更新
1. **更新所有權限檢查邏輯**
2. **修改 Polar webhook 處理**
3. **調整用戶建立流程**

### 階段三：前端元件重構
1. **更新訂閱狀態顯示**
2. **簡化權限控制邏輯**
3. **統一用戶體驗流程**

## 📊 影響評估

### 正面影響
- **程式碼簡化**: 減少 30% 的條件判斷邏輯
- **維護容易**: 單一訂閱邏輯更容易理解和維護
- **Polar 整合清晰**: 只有付費用戶才需要處理 Polar 邏輯
- **擴展性更好**: 未來新增功能更容易實現

### 潛在風險
- **資料遷移風險**: 需要小心處理現有用戶資料
- **API 相容性**: 可能影響現有 API 呼叫
- **前端顯示**: 需要更新所有相關 UI 元件

### 風險緩解策略
- **漸進式部署**: 分階段進行更新
- **完整測試**: 覆蓋所有訂閱狀態情境
- **回滾計畫**: 準備資料庫回滾腳本

## ✅ 驗收標準

### 功能性測試
- [ ] 新用戶註冊後預設為未訂閱狀態
- [ ] Polar 訂閱成功後正確更新為專業版
- [ ] 取消訂閱後正確回到未訂閱狀態
- [ ] 所有權限檢查邏輯正確運作

### 相容性測試
- [ ] 現有付費用戶權限不受影響
- [ ] 現有免費用戶平滑轉換為未訂閱狀態
- [ ] API 回應格式保持一致

### 效能測試
- [ ] 權限檢查查詢效能提升
- [ ] 資料庫查詢複雜度降低

## 📅 實施時程

| 階段 | 工作項目 | 預估時間 | 負責人 |
|------|----------|----------|--------|
| 準備 | 需求確認、設計確定 | 1 天 | 開發團隊 |
| 開發 | 資料庫遷移腳本 | 1 天 | 後端開發 |
| 開發 | API 邏輯調整 | 2 天 | 後端開發 |
| 開發 | 前端元件更新 | 2 天 | 前端開發 |
| 測試 | 功能測試與整合測試 | 2 天 | 全團隊 |
| 部署 | 生產環境部署 | 1 天 | DevOps |

**總計**: 9 個工作天

## 🔧 技術實施細節

### 資料庫視圖更新
```sql
-- 新的活躍付費用戶視圖
CREATE OR REPLACE VIEW active_subscribers AS
SELECT *
FROM user_profiles
WHERE polar_subscription_id IS NOT NULL
  AND subscription_status = 'active';

-- 簡化的用戶統計
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
    total_users BIGINT,
    subscribed_users BIGINT,
    subscription_rate NUMERIC
);
```

### TypeScript 類型定義
```typescript
// 簡化的用戶類型
interface UserProfile {
  id: string;
  clerk_user_id: string;
  subscription_plan: 'pro' | null;
  subscription_status: 'active' | 'trial' | 'past_due' | 'inactive';
  polar_subscription_id: string | null;
  monthly_usage_limit: number;
  // ... 其他欄位
}

// 權限檢查輔助類型
type SubscriptionStatus = 'subscribed' | 'unsubscribed';
```

## 📞 聯絡資訊

**需求制定**: 產品團隊  
**技術實施**: 開發團隊  
**測試驗證**: QA 團隊  
**上線時程**: DevOps 團隊  

---

**文件版本**: 4.0  
**最後更新**: 2025-07-20  
**下次檢視**: 實施完成後