---
uuid: 5fa11f82518941aba9a76bca26380c82
---

# B02 - Polar 立即取消訂閱狀態錯誤修正

## 🔍 問題概述

**問題描述**: 當從 Polar 後台**立即取消**用戶訂閱時，webhook 處理邏輯出現錯誤，導致 Supabase 狀態被設置為 `active_ending`（訂閱中、會到期），但實際應該設為 `inactive`（免費版），因為訂閱已經立即終止。

**影響範圍**: 
- 立即取消的用戶狀態顯示錯誤
- 用戶仍然顯示為專業版用戶，但實際訂閱已終止
- 影響計費和權限控制的正確性

**嚴重程度**: 🔴 高 - 影響付費用戶的訂閱狀態和權限正確性

## 📋 關鍵數據分析

### 🔍 Webhook Payload 重要訊息：
```json
{
  "status": "canceled",                    // ❌ 已取消狀態
  "cancelAtPeriodEnd": false,             // ❌ 立即取消，非週期結束
  "canceledAt": "2025-07-21T07:06:46.449Z", // ❌ 取消時間
  "endsAt": "2025-07-21T07:06:46.000Z",     // ❌ 結束時間 = 取消時間
  "endedAt": "2025-07-21T07:06:46.000Z",    // ❌ 已結束時間 = 取消時間
  "currentPeriodEnd": "2025-08-21T07:06:04.000Z" // ❌ 原本的週期結束時間
}
```

**關鍵發現**：
- `cancelAtPeriodEnd: false` - 這是**立即取消**，非週期結束時取消
- `endsAt` 和 `endedAt` 都等於取消時間 - 表示訂閱已經**立即結束**
- `currentPeriodEnd` 仍然是未來時間，但實際上訂閱已經提前結束

## ❌ 發現的主要問題

### 1. **立即取消 vs 週期取消判斷錯誤**

**程式碼問題**：
```javascript
// ❌ 錯誤的判斷邏輯
const isExpiredCancellation = (subscription.status === 'canceled' || subscription.status === 'cancelled');

if (isExpiredCancellation) {
  // 降級為免費版
  updateData = { subscriptionStatus: 'inactive' };
} else if (hasCancelFlag && subscription.status === 'active') {
  // ❌ 這個條件永遠不會執行，因為 status 已經是 'canceled'
  updateData = { subscriptionStatus: 'active_ending' };
}
```

### 2. **事件處理順序衝突**

**時序分析**：
```
subscription.updated (status: canceled) 
→ 設置為 inactive ✅

subscription.canceled  
→ 設置為 active_ending ❌ (覆蓋了正確狀態)

subscription.updated (status: canceled)
→ 又設置為 inactive ✅ (但被覆蓋)
```

### 3. **立即取消判斷邏輯缺失**

目前的邏輯無法區分：
- **立即取消** (`endsAt` = 當前時間)
- **週期結束取消** (`endsAt` = `currentPeriodEnd`)

## 🔧 解決方案

### 1. **增加立即取消判斷邏輯** ✅
```javascript
// ✅ 新增立即取消檢查函數
function isImmediateCancellation(subscription: any): boolean {
  if (subscription.status !== 'canceled') return false;
  if (subscription.cancelAtPeriodEnd === true) return false;
  
  // 檢查是否有取消時間和結束時間
  if (!subscription.canceledAt || !subscription.endsAt) return false;
  
  // 檢查結束時間是否接近取消時間
  const endsAt = new Date(subscription.endsAt);
  const canceledAt = new Date(subscription.canceledAt);
  const timeDiff = Math.abs(endsAt.getTime() - canceledAt.getTime());
  
  return timeDiff < 60000; // 1分鐘內視為立即取消
}
```

### 2. **修正事件處理優先級** ✅
```javascript
// ✅ 在 handleSubscriptionUpdated 中優先檢查立即取消
if (isImmediateCancellation(subscription)) {
  console.log(`Immediate cancellation detected for user ${clerkUserId}`);
  
  // 立即取消：直接降級為免費版
  const updateData = {
    subscriptionPlan: null,
    subscriptionStatus: 'inactive' as SubscriptionStatus,
    monthlyUsageLimit: 1000,
    polarSubscriptionId: undefined,
    polarCustomerId: undefined,
    currentPeriodEnd: undefined
  };
  
  await userProfileService.updateUserProfile(clerkUserId, updateData);
  return; // 提前返回，避免後續邏輯覆蓋
}
```

### 3. **改進事件去重機制** ✅
```javascript
// ✅ 更智能的去重機制
const processedCancellations = new Map<string, string>();

// 記錄取消狀態，避免重複處理
const cancellationKey = `${subscription.id}-canceled`;
const currentState = JSON.stringify({
  status: subscription.status,
  canceledAt: subscription.canceledAt,
  endsAt: subscription.endsAt
});

if (processedCancellations.get(cancellationKey) === currentState) {
  console.log('Cancellation already processed, skipping');
  return;
}

processedCancellations.set(cancellationKey, currentState);
```

### 4. **統一取消處理邏輯** ✅
```javascript
// ✅ 在 handleSubscriptionCanceled 中同樣加入立即取消檢查
if (isImmediateCancellation(subscription)) {
  // 立即取消：直接降級為免費版
  await userProfileService.updateUserProfile(clerkUserId, {
    subscriptionPlan: null,
    subscriptionStatus: 'inactive',
    monthlyUsageLimit: 1000,
    polarSubscriptionId: undefined,
    polarCustomerId: undefined,
    currentPeriodEnd: undefined
  });
  return;
}

// 週期結束取消：設為 active_ending
await userProfileService.updateUserProfile(clerkUserId, {
  subscriptionPlan: 'pro',
  subscriptionStatus: 'active_ending',
  monthlyUsageLimit: 10000,
  currentPeriodEnd: subscription.currentPeriodEnd
});
```

## 🎯 已完成的修正

### 高優先級修正：
1. ✅ **新增立即取消判斷函數**: `isImmediateCancellation()`
2. ✅ **修正 handleSubscriptionUpdated**: 優先檢查立即取消
3. ✅ **修正 handleSubscriptionCanceled**: 統一取消處理邏輯
4. ✅ **改進事件去重機制**: 避免重複處理相同取消事件

### 詳細日誌記錄：
1. ✅ **立即取消檢查日誌**: 記錄判斷過程和關鍵數據
2. ✅ **處理結果日誌**: 明確記錄用戶狀態變更
3. ✅ **去重機制日誌**: 記錄事件過濾情況

## 🧪 測試建議

### 測試場景 1: 立即取消訂閱
1. 在 Polar 後台立即取消一個活躍訂閱
2. 觀察 webhook 日誌，應該看到：
   ```
   Immediate cancellation check: {
     status: "canceled",
     cancelAtPeriodEnd: false,
     canceledAt: "2025-07-21T07:06:46.449Z",
     endsAt: "2025-07-21T07:06:46.000Z",
     timeDiff: 449,
     isImmediate: true
   }
   Immediate cancellation detected for user xxx
   User xxx immediately downgraded to free plan
   ```
3. 檢查資料庫，用戶狀態應為 `inactive`，`subscription_plan` 為 `null`

### 測試場景 2: 週期結束取消
1. 在 Polar 後台設定週期結束時取消訂閱
2. 應該看到用戶狀態為 `active_ending`，保持專業版權限到期間結束

### 測試場景 3: 事件去重
1. 立即取消會觸發多個 webhook 事件
2. 應該只有第一個事件被處理，後續事件被過濾

### 驗證清單
- [ ] 立即取消後狀態正確顯示為 `inactive`
- [ ] 週期取消後狀態正確顯示為 `active_ending`
- [ ] 重複事件被正確過濾
- [ ] 日誌記錄完整且清晰
- [ ] 資料庫狀態與 Polar 後台一致
- [ ] `polar_subscription_id` 等欄位被正確清除
- [ ] 只有一個事件處理函數執行實際更新

## 🧪 驗證腳本

已建立 `B02-立即取消修正驗證腳本.js` 用於測試：
- 立即取消判斷邏輯
- 事件去重機制
- 處理順序模擬

### 預期日誌輸出
修正後應該看到：
```
[handleSubscriptionUpdated] Processing event for subscription 74feb1a3...
Immediate cancellation check: { isImmediate: true }
[handleSubscriptionUpdated] Immediate cancellation detected for user xxx
[handleSubscriptionUpdated] User xxx immediately downgraded to free plan

[handleSubscriptionCanceled] Processing event for subscription 74feb1a3...
[handleSubscriptionCanceled] Immediate cancellation already processed by updated event, skipping
```

## 📝 修正狀態

- [x] 新增立即取消判斷邏輯
- [x] 修正事件處理優先級
- [x] 實作智能事件去重機制
- [x] 加入詳細日誌記錄
- [x] 強化事件去重機制（第二次修正）
- [ ] 測試修正結果

## 🔧 第二次修正（2025-07-21）

### 問題分析
從實際日誌發現，雖然立即取消邏輯正確執行，但仍有第二個事件覆蓋了正確狀態：

```
第一次更新: inactive ✅ (正確)
第二次更新: active_ending ❌ (錯誤，覆蓋了正確狀態)
```

### 強化修正
1. **提前立即取消檢查**: 在函數開始就檢查立即取消，避免後續邏輯執行
2. **強化去重標記**: 使用 `immediate-cancel-${subscription.id}` 作為統一的去重 key
3. **雙重去重檢查**: 同時檢查 `processedEvents` 和 `processedCancellations`
4. **詳細事件日誌**: 加入 `[handleSubscriptionUpdated]` 和 `[handleSubscriptionCanceled]` 標記

### 修正後的邏輯流程
```
事件1: handleSubscriptionUpdated
├── 檢查立即取消 ✅
├── 設置去重標記: immediate-cancel-74feb1a3
├── 執行降級操作: inactive
└── 提前返回 ✅

事件2: handleSubscriptionCanceled
├── 檢查立即取消 ✅
├── 檢查去重標記: 已存在 ✅
└── 跳過處理 ✅
```

---

**建立日期**: 2025-07-21  
**負責人**: 開發團隊  
**預計完成**: 2025-07-21  
**優先級**: 高  
**相關**: B01-Polar-Webhook-欄位映射錯誤修正
