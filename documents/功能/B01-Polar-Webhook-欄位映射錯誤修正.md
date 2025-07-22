---
uuid: b01-polar-webhook-field-mapping-fix
---

# B01 - Polar Webhook 欄位映射錯誤修正

## 🔍 問題概述

**問題描述**: 當用戶取消 Polar 訂閱時，webhook 觸發了多個事件，但 Supabase 狀態更新出現錯誤，最終狀態與預期不符。

**影響範圍**: 
- 用戶取消訂閱後狀態顯示錯誤
- 訂閱狀態在多個 webhook 事件間不一致
- 關鍵資料（cancelAtPeriodEnd）遺失導致邏輯判斷失效

**嚴重程度**: 🔴 高 - 影響付費用戶的訂閱狀態正確性

## 📋 事件時序分析

### 觸發的 Webhook 事件順序：
1. **subscription.updated** - 設定取消標誌
2. **subscription.canceled** - 訂閱取消事件  
3. **subscription.updated** - 再次更新（重複事件）

## ❌ 發現的主要問題

### 1. **缺失數據問題**
```javascript
Processing subscription update: {
  subscriptionId: '1b7d5ed3-41eb-47d7-9184-ceae11a5fee5',
  userId: 'user_3086xRRBAJLroUYxctPm1iG7kPC',
  status: 'active',
  cancelAtPeriodEnd: undefined,  // ❌ 關鍵資料遺失
  currentPeriodStart: undefined, // ❌ 關鍵資料遺失
  currentPeriodEnd: undefined    // ❌ 關鍵資料遺失
}
```

**原因**: 程式碼從 webhook payload 提取資料時，欄位名稱不匹配

### 2. **資料提取邏輯錯誤**
在 `route.ts` 中的資料提取：
```javascript
// ❌ 錯誤的提取方式
cancelAtPeriodEnd: subscription.cancel_at_period_end,
currentPeriodStart: subscription.current_period_start,
currentPeriodEnd: subscription.current_period_end
```

**實際 Payload 結構**:
```javascript
// ✅ 正確的欄位名稱 (camelCase)
{
  "cancelAtPeriodEnd": true,
  "currentPeriodStart": "2025-07-21T06:47:25.000Z",
  "currentPeriodEnd": "2025-08-21T06:47:25.000Z"
}
```

### 3. **狀態判斷邏輯失效**
因為 `cancelAtPeriodEnd` 為 `undefined`，`mapPolarStatusToLocal` 函數無法正確判斷：

```javascript
// ❌ 因為 cancelAtPeriodEnd = undefined，總是走 else 分支
function mapPolarStatusToLocal(polarStatus: string, cancelAtPeriodEnd: boolean = false) {
  switch (polarStatus) {
    case 'active':
      return cancelAtPeriodEnd ? 'active_ending' : 'active_recurring'; 
      // 結果總是 'active_recurring'，應該要是 'active_ending'
  }
}
```

### 4. **事件處理順序問題**
- **subscription.updated** → 狀態變為 `active_recurring` ❌
- **subscription.canceled** → 狀態變為 `active_ending` ✅  
- **subscription.updated** → 又變回 `active_recurring` ❌

最終結果錯誤！

## 🔧 解決方案

### 1. **修正資料提取邏輯**
```javascript
// ✅ 修正後的程式碼
console.log('Processing subscription update:', {
  subscriptionId: subscription.id,
  userId: clerkUserId,
  status: subscription.status,
  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd, // 修正欄位名稱
  currentPeriodStart: subscription.currentPeriodStart, // 修正欄位名稱
  currentPeriodEnd: subscription.currentPeriodEnd // 修正欄位名稱
});
```

### 2. **改進狀態判斷邏輯**
```javascript
// ✅ 更安全的判斷方式
function mapPolarStatusToLocal(subscription: any): SubscriptionStatus {
  // 直接從完整的 subscription 物件判斷
  const { status, cancelAtPeriodEnd, canceledAt } = subscription;
  
  if (status === 'active') {
    // 檢查是否有取消標誌或取消時間
    return (cancelAtPeriodEnd === true || canceledAt) ? 'active_ending' : 'active_recurring';
  }
  
  return 'inactive';
}
```

### 3. **事件去重機制**
```javascript
// ✅ 避免重複處理相同事件
const processedEvents = new Set();

async function handleSubscriptionUpdated(event: any): Promise<void> {
  const eventKey = `${event.data.id}-${event.data.modified_at}`;
  
  if (processedEvents.has(eventKey)) {
    console.log('Event already processed, skipping:', eventKey);
    return;
  }
  
  processedEvents.add(eventKey);
  // ... 處理邏輯
}
```

### 4. **優先處理取消事件**
```javascript
// ✅ 根據事件類型決定處理優先級
async function handleSubscriptionEvent(event: any): Promise<void> {
  const subscription = event.data;
  const clerkUserId = subscription.metadata?.clerk_user_id;
  
  // 如果有取消標誌，直接設定為 active_ending
  if (subscription.cancelAtPeriodEnd === true || subscription.canceledAt) {
    await updateSubscriptionStatus(clerkUserId, 'active_ending');
    return;
  }
  
  // 否則按一般邏輯處理
  const status = mapPolarStatusToLocal(subscription);
  await updateSubscriptionStatus(clerkUserId, status);
}
```

## 🎯 立即修正建議

### 高優先級修正：
1. ✅ **修正欄位名稱**: `cancel_at_period_end` → `cancelAtPeriodEnd`
2. ✅ **修正函數調用**: 傳入完整 subscription 物件而非個別參數
3. ✅ **加入事件去重**: 防止重複處理

### 中優先級改進：
1. 🔄 **加入詳細 logging**: 記錄每步驟的資料狀態
2. 🔄 **錯誤恢復機制**: 當資料不一致時的修復邏輯
3. 🔄 **監控告警**: 當狀態異常時發送通知

## 💡 預防措施

1. **型別檢查**: 使用 TypeScript 介面定義 webhook payload
2. **單元測試**: 針對不同 webhook 事件組合進行測試  
3. **整合測試**: 模擬完整的訂閱生命週期
4. **監控儀表板**: 即時監控訂閱狀態變化

## 🚨 緊急修正步驟

如果現在有用戶資料不正確：

```sql
-- 檢查問題用戶
SELECT clerk_user_id, subscription_status, subscription_plan, current_period_end, polar_subscription_id
FROM users 
WHERE polar_subscription_id = '1b7d5ed3-41eb-47d7-9184-ceae11a5fee5';

-- 手動修正（確認 Polar 後台狀態後執行）
UPDATE users 
SET subscription_status = 'active_ending'
WHERE polar_subscription_id = '1b7d5ed3-41eb-47d7-9184-ceae11a5fee5'
AND subscription_status = 'active_recurring';
```

## 📝 修正狀態

- [x] 修正欄位名稱映射
- [x] 更新狀態判斷邏輯
- [x] 實作事件去重機制
- [x] 加入詳細日誌記錄
- [ ] 測試修正結果

## 🔧 已完成的修正

### 1. **欄位名稱映射修正** ✅
- 修正 `subscription.cancel_at_period_end` → `subscription.cancelAtPeriodEnd`
- 修正 `subscription.current_period_start` → `subscription.currentPeriodStart`
- 修正 `subscription.current_period_end` → `subscription.currentPeriodEnd`

### 2. **狀態判斷邏輯改進** ✅
- 在 `mapPolarStatusToLocal` 函數中加入詳細日誌記錄
- 在 `handleSubscriptionUpdated` 中加入智能狀態判斷：
  - 優先檢查取消標誌 (`cancelAtPeriodEnd` 或 `canceledAt`)
  - 有取消標誌的活躍訂閱直接設為 `active_ending`
  - 避免狀態在多個事件間來回切換

### 3. **事件去重機制** ✅
- 實作 `processedEvents` Set 來追蹤已處理的事件
- 使用 `eventKey` 格式：`{eventType}-{subscriptionId}-{modifiedAt}`
- 在 `handleSubscriptionUpdated` 和 `handleSubscriptionCanceled` 中都加入去重檢查
- 每小時自動清理過期的事件記錄

### 4. **詳細日誌記錄** ✅
- 在狀態映射函數中加入詳細的 console.log
- 在事件處理函數中記錄處理邏輯的決策過程
- 記錄事件去重的情況

## 🧪 測試建議

### 測試場景 1: 用戶取消訂閱
1. 在 Polar 後台取消一個活躍訂閱
2. 觀察 webhook 日誌，應該看到：
   ```
   Processing subscription update: {
     subscriptionId: "xxx",
     cancelAtPeriodEnd: true,  // ✅ 不再是 undefined
     currentPeriodEnd: "2025-08-21T06:47:25.000Z"  // ✅ 不再是 undefined
   }
   Subscription marked for cancellation for user xxx - set to active_ending
   ```
3. 檢查資料庫，用戶狀態應為 `active_ending`

### 測試場景 2: 重複事件處理
1. 手動觸發相同的 webhook 事件
2. 第二次應該看到：
   ```
   Event already processed, skipping: updated-xxx-timestamp
   ```

### 測試場景 3: 狀態映射
1. 測試不同的 Polar 狀態值
2. 檢查 `mapPolarStatusToLocal` 的日誌輸出：
   ```
   Mapping Polar status: { polarStatus: "active", cancelAtPeriodEnd: true }
   Active status mapped to: active_ending
   ```

### 驗證清單
- [ ] 取消訂閱後狀態正確顯示為 `active_ending`
- [ ] 重複事件被正確過濾
- [ ] 日誌記錄完整且清晰
- [ ] 資料庫狀態與 Polar 後台一致

---

**建立日期**: 2025-07-21  
**負責人**: 開發團隊  
**預計完成**: 2025-07-21  
**優先級**: 高
