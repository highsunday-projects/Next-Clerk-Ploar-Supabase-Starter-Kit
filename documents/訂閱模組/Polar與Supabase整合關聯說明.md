---
uuid: a8f9e2d1c3b4567890abcdef12345678
---
# Polar 與 Supabase 整合關聯說明

## 📋 文件概述

本文件詳細說明 Next-Clerk-Polar-Supabase Starter Kit 中 Polar 付費系統與 Supabase 資料庫之間的整合關聯，包含用戶訂閱、取消訂閱等操作的完整流程，以及各組件之間的關係與邏輯。

### 文件資訊
- **建立日期**: 2025-07-20
- **版本**: 1.0
- **目標讀者**: 新進工程師、系統維護人員
- **維護者**: 開發團隊

## 🎯 整合概述

### 核心架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Next.js) │    │   Polar 付費     │    │  Supabase 資料庫 │
│                 │    │                 │    │                 │
│ • 訂閱管理頁面   │◄──►│ • Checkout API  │◄──►│ • user_profiles │
│ • 升級/取消按鈕  │    │ • 訂閱管理      │    │ • 訂閱狀態      │
│ • 狀態顯示      │    │ • Webhook 事件  │    │ • 使用額度      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Clerk 認證    │    │  API 路由層     │    │   Webhook 處理   │
│                 │    │                 │    │                 │
│ • 用戶身份驗證   │    │ • 權限檢查      │    │ • 事件接收      │
│ • 用戶 ID 提供  │    │ • 資料驗證      │    │ • 狀態同步      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 簡化的訂閱邏輯 (SF09)
- **訂閱方案**: 僅有「專業版」($5/月) 一種付費方案
- **用戶狀態**: 
  - 未訂閱: `subscription_plan = null`, `subscription_status = 'inactive'`
  - 已訂閱: `subscription_plan = 'pro'`, `subscription_status = 'active'`
- **權限控制**: 通過 `hasProAccess()` 函數統一檢查

## 🗄️ 資料庫結構

### user_profiles 表格
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- 訂閱核心欄位
  subscription_plan VARCHAR(20),                    -- 'pro' 或 null
  subscription_status VARCHAR(20) DEFAULT 'inactive', -- 'active', 'inactive', 'past_due', 'cancelled'
  monthly_usage_limit INTEGER DEFAULT 1000,
  
  -- Polar 整合欄位
  polar_customer_id VARCHAR(255),                   -- Polar 客戶 ID
  polar_subscription_id VARCHAR(255),               -- Polar 訂閱 ID
  current_period_end TIMESTAMP WITH TIME ZONE,      -- 計費週期結束時間
  cancel_at_period_end BOOLEAN DEFAULT FALSE,       -- 是否在週期結束時取消
  
  -- 時間戳記
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 關鍵欄位說明
- **subscription_plan**: 'pro' 表示專業版，null 表示未訂閱
- **subscription_status**: 訂閱狀態，控制實際權限
- **polar_customer_id**: 連結 Polar 系統的客戶識別碼
- **polar_subscription_id**: 連結 Polar 系統的訂閱識別碼
- **current_period_end**: 用於計算訂閱到期時間
- **cancel_at_period_end**: 標記是否安排取消訂閱

## 🔄 用戶訂閱流程

### 1. 用戶升級流程

#### 步驟 1: 前端觸發升級
```typescript
// src/app/dashboard/subscription/page.tsx
const handlePlanUpgrade = async () => {
  const response = await fetch('/api/polar/create-checkout', {
    method: 'POST',
    body: JSON.stringify({
      plan: 'pro',
      userId: user?.id,
      successUrl: `${window.location.origin}/dashboard/subscription?success=true`
    })
  });
  
  const { checkoutUrl } = await response.json();
  window.location.href = checkoutUrl; // 跳轉到 Polar 付費頁面
};
```

#### 步驟 2: 後端建立 Checkout Session
```typescript
// src/app/api/polar/create-checkout/route.ts
export async function POST(request: Request) {
  // 1. 驗證用戶身份 (Clerk)
  const { userId } = await auth();
  
  // 2. 獲取用戶當前訂閱狀態 (Supabase)
  const userProfile = await userProfileService.getOrCreateUserProfile(userId);
  
  // 3. 建立 Polar Checkout Session
  const checkout = await polarApi.checkouts.create({
    products: [productId],
    successUrl: successUrl,
    customerEmail: userEmail,
    externalCustomerId: userId,
    metadata: {
      clerk_user_id: userId,
      subscription_plan: 'pro'
    }
  });
  
  return Response.json({ checkoutUrl: checkout.url });
}
```

#### 步驟 3: 用戶完成付款
- 用戶在 Polar 安全環境中完成付款
- Polar 處理信用卡交易
- 建立訂閱記錄

#### 步驟 4: Webhook 事件處理
```typescript
// src/app/api/webhooks/polar/route.ts
const webhookHandler = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onSubscriptionCreated: async (payload) => {
    const subscription = payload.data;
    const clerkUserId = subscription.metadata?.clerk_user_id;
    
    // 更新 Supabase 資料庫
    await userProfileService.updateUserProfile(clerkUserId, {
      subscriptionPlan: 'pro',
      subscriptionStatus: 'active',
      monthlyUsageLimit: 10000,
      polarCustomerId: subscription.customer_id,
      polarSubscriptionId: subscription.id,
      currentPeriodEnd: subscription.current_period_end
    });
  }
});
```

#### 步驟 5: 前端狀態更新
- 用戶被重定向回應用程式
- 前端重新載入訂閱資料
- 顯示新的專業版狀態

### 2. 用戶取消訂閱流程

#### 步驟 1: 前端觸發取消
```typescript
// 安排在週期結束時取消訂閱
const handleCancelSubscription = async () => {
  const response = await fetch('/api/polar/schedule-downgrade', {
    method: 'POST',
    body: JSON.stringify({
      targetPlan: 'free',
      userId: user?.id
    })
  });
};
```

#### 步驟 2: 後端處理取消請求
```typescript
// src/app/api/polar/schedule-downgrade/route.ts
export async function POST(request: Request) {
  // 1. 驗證用戶身份和訂閱狀態
  const userProfile = await userProfileService.getOrCreateUserProfile(userId);
  
  // 2. 使用 Polar API 設定在週期結束時取消
  const updatedSubscription = await polarApi.subscriptions.update({
    id: userProfile.polar_subscription_id,
    subscriptionUpdate: {
      cancelAtPeriodEnd: true
    }
  });
  
  // 3. 更新資料庫標記
  await userProfileService.updateUserProfile(userId, {
    cancelAtPeriodEnd: true
  });
}
```

#### 步驟 3: 週期結束時的自動處理
- Polar 在計費週期結束時觸發 `subscription.canceled` 事件
- Webhook 處理器自動將用戶降級為未訂閱狀態

```typescript
// Webhook 處理取消事件
onSubscriptionCanceled: async (payload) => {
  const subscription = payload.data;
  const clerkUserId = subscription.metadata?.clerk_user_id;
  
  // 將用戶降級為未訂閱狀態
  await userProfileService.updateUserProfile(clerkUserId, {
    subscriptionPlan: null,
    subscriptionStatus: 'inactive',
    monthlyUsageLimit: 1000,
    polarSubscriptionId: undefined,
    polarCustomerId: undefined,
    currentPeriodEnd: undefined,
    cancelAtPeriodEnd: false
  });
}
```

## 🔧 核心組件關聯

### 1. 前端組件

#### 訂閱管理頁面 (`src/app/dashboard/subscription/page.tsx`)
- **功能**: 顯示當前訂閱狀態，提供升級/取消按鈕
- **資料來源**: 通過 `useUserProfile` Hook 從 Supabase 獲取
- **操作**: 呼叫 Polar API 進行訂閱變更

#### 用戶資料 Hook (`src/hooks/useUserProfile.ts`)
- **功能**: 管理用戶訂閱資料的前端狀態
- **API 呼叫**: `/api/user/subscription` 端點
- **自動更新**: 監聽資料變化，自動重新載入

### 2. 後端 API 層

#### 用戶訂閱 API (`src/app/api/user/subscription/route.ts`)
- **GET**: 獲取當前用戶的訂閱資料
- **PATCH**: 更新用戶訂閱資料
- **權限控制**: 使用 Clerk 驗證用戶身份

#### Polar Checkout API (`src/app/api/polar/create-checkout/route.ts`)
- **功能**: 建立 Polar 付費 Session
- **智能檢測**: 區分新用戶和現有訂閱用戶
- **安全性**: 確保用戶只能為自己建立訂閱

#### Polar Webhook (`src/app/api/webhooks/polar/route.ts`)
- **功能**: 接收 Polar 事件，同步訂閱狀態
- **事件類型**: 
  - `subscription.created`: 訂閱建立
  - `subscription.updated`: 訂閱更新
  - `subscription.canceled`: 訂閱取消
  - `order.paid`: 付款成功

### 3. 資料服務層

#### 用戶資料服務 (`src/lib/userProfileService.ts`)
- **getUserProfile()**: 根據 Clerk ID 獲取用戶資料
- **updateUserProfile()**: 更新用戶訂閱資料
- **getOrCreateUserProfile()**: 獲取或建立用戶記錄
- **資料庫操作**: 使用 Supabase Admin 客戶端

#### Polar 客戶端 (`src/lib/polar.ts`)
- **polarApi**: Polar SDK 客戶端實例
- **配置管理**: 產品 ID、環境設定
- **工具函數**: 產品映射、URL 建構

## 🔐 安全機制

### 1. 身份驗證流程
```
用戶請求 → Clerk 驗證 → 獲取 userId → 資料庫查詢 → 權限檢查
```

### 2. Webhook 安全驗證
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

### 3. 資料存取控制
- **Row Level Security**: Supabase 啟用 RLS 確保用戶只能存取自己的資料
- **API 權限**: 所有 API 端點都需要 Clerk 認證
- **Webhook 驗證**: 使用 HMAC 簽名確保事件來源可信

## 🎯 權限控制邏輯

### 統一權限檢查函數
```typescript
// src/lib/subscriptionUtils.ts
export function hasProAccess(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  return profile.subscription_plan === 'pro' && 
         profile.subscription_status === 'active';
}
```

### 前端權限應用
```typescript
// 在組件中使用
const { profile } = useUserProfile();
const canAccessProFeatures = hasProAccess(profile);

if (canAccessProFeatures) {
  // 顯示專業版功能
} else {
  // 顯示升級提示
}
```

## 📊 資料流向圖

```
用戶操作 → 前端組件 → API 路由 → 服務層 → Supabase
    ↓
Polar API ← Webhook ← Polar 系統 ← 付款處理
    ↓
資料庫更新 → 前端狀態更新 → UI 重新渲染
```

## 🔍 故障排除

### 常見問題
1. **訂閱狀態不同步**: 檢查 Webhook 事件是否正確處理
2. **付款成功但狀態未更新**: 確認 `clerk_user_id` 在 metadata 中正確傳遞
3. **權限檢查失敗**: 驗證 `hasProAccess()` 函數邏輯
4. **Webhook 驗證失敗**: 檢查 `POLAR_WEBHOOK_SECRET` 環境變數

### 調試工具
- Webhook 事件日誌記錄
- 資料庫狀態查詢
- Polar Dashboard 訂閱狀態檢查
- 前端開發者工具網路請求監控

## 💡 實作細節與最佳實踐

### 1. 錯誤處理策略

#### API 層錯誤處理
```typescript
// 統一的錯誤回應格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 錯誤處理範例
try {
  const result = await userProfileService.updateUserProfile(userId, updateData);
  return Response.json({ success: true, data: result });
} catch (error) {
  console.error('API Error:', error);
  return Response.json({
    success: false,
    error: error.message || '系統錯誤，請稍後再試'
  }, { status: 500 });
}
```

#### Webhook 錯誤處理
```typescript
// Webhook 事件處理失敗時的重試機制
async function handleSubscriptionCreated(event: any): Promise<void> {
  try {
    await userProfileService.updateUserProfile(clerkUserId, updateData);
    console.log(`✅ Subscription created successfully for user ${clerkUserId}`);
  } catch (error) {
    console.error(`❌ Failed to process subscription.created for user ${clerkUserId}:`, error);
    // Polar 會自動重試失敗的 Webhook
    throw error;
  }
}
```

### 2. 資料一致性保證

#### 冪等性處理
```typescript
// 確保重複的 Webhook 事件不會造成資料不一致
async function handleSubscriptionCreated(event: any): Promise<void> {
  const subscription = event.data;
  const clerkUserId = subscription.metadata?.clerk_user_id;

  // 檢查是否已經處理過此訂閱
  const existingProfile = await userProfileService.getUserProfile(clerkUserId);
  if (existingProfile?.polar_subscription_id === subscription.id) {
    console.log(`Subscription ${subscription.id} already processed, skipping`);
    return;
  }

  // 繼續處理...
}
```

#### 交易性更新
```typescript
// 使用 Supabase 交易確保資料一致性
async function updateUserSubscription(userId: string, subscriptionData: any) {
  const supabase = getSupabaseClient(true);

  const { data, error } = await supabase.rpc('update_user_subscription', {
    p_clerk_user_id: userId,
    p_subscription_plan: subscriptionData.subscriptionPlan,
    p_subscription_status: subscriptionData.subscriptionStatus,
    p_polar_subscription_id: subscriptionData.polarSubscriptionId
  });

  if (error) throw error;
  return data;
}
```

### 3. 效能優化

#### 快取策略
```typescript
// 使用 React Query 快取用戶訂閱資料
export function useUserProfile() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000, // 5 分鐘
    cacheTime: 10 * 60 * 1000, // 10 分鐘
    enabled: !!user?.id
  });
}
```

#### 資料庫索引優化
```sql
-- 為常用查詢建立索引
CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
CREATE INDEX idx_user_profiles_polar_subscription_id ON user_profiles(polar_subscription_id);
CREATE INDEX idx_user_profiles_subscription_status ON user_profiles(subscription_status);
```

### 4. 監控與日誌

#### 結構化日誌
```typescript
// 統一的日誌格式
interface LogEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  userId?: string;
  subscriptionId?: string;
  metadata?: Record<string, any>;
}

function logSubscriptionEvent(event: string, data: any) {
  const logEntry: LogEvent = {
    timestamp: new Date().toISOString(),
    level: 'info',
    event,
    userId: data.clerkUserId,
    subscriptionId: data.polarSubscriptionId,
    metadata: data
  };

  console.log(JSON.stringify(logEntry));
}
```

#### 關鍵指標監控
- Webhook 事件處理成功率
- 訂閱轉換率 (免費 → 專業版)
- 付款成功率
- API 回應時間
- 資料庫查詢效能

### 5. 測試策略

#### 單元測試範例
```typescript
// 測試用戶訂閱服務
describe('UserProfileService', () => {
  it('should create user profile with default values', async () => {
    const mockUserId = 'user_123';
    const profile = await userProfileService.getOrCreateUserProfile(mockUserId);

    expect(profile.subscription_plan).toBeNull();
    expect(profile.subscription_status).toBe('inactive');
    expect(profile.monthly_usage_limit).toBe(1000);
  });

  it('should update subscription to pro plan', async () => {
    const mockUserId = 'user_123';
    const updateData = {
      subscriptionPlan: 'pro',
      subscriptionStatus: 'active',
      monthlyUsageLimit: 10000
    };

    const updatedProfile = await userProfileService.updateUserProfile(mockUserId, updateData);
    expect(updatedProfile.subscription_plan).toBe('pro');
  });
});
```

#### 整合測試
```typescript
// 測試完整的訂閱流程
describe('Subscription Flow Integration', () => {
  it('should handle complete subscription creation flow', async () => {
    // 1. 模擬用戶建立 Checkout
    const checkoutResponse = await request(app)
      .post('/api/polar/create-checkout')
      .send({ plan: 'pro', userId: 'user_123' });

    // 2. 模擬 Polar Webhook 事件
    const webhookPayload = {
      type: 'subscription.created',
      data: {
        id: 'sub_123',
        customer_id: 'cus_123',
        metadata: { clerk_user_id: 'user_123' }
      }
    };

    await request(app)
      .post('/api/webhooks/polar')
      .send(webhookPayload);

    // 3. 驗證資料庫狀態
    const profile = await userProfileService.getUserProfile('user_123');
    expect(profile.subscription_plan).toBe('pro');
  });
});
```

## 🚀 部署與維護

### 環境變數檢查清單
```bash
# Clerk 認證
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Supabase 資料庫
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Polar 付費
POLAR_ACCESS_TOKEN=polar_at_xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=org_xxx
POLAR_PRO_PRODUCT_ID=prod_xxx
NEXT_PUBLIC_POLAR_ENVIRONMENT=sandbox # 或 production

# 應用程式
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### 健康檢查端點
```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkSupabaseConnection(),
    polar: await checkPolarConnection(),
    timestamp: new Date().toISOString()
  };

  const isHealthy = Object.values(checks).every(check =>
    typeof check === 'boolean' ? check : true
  );

  return Response.json(checks, {
    status: isHealthy ? 200 : 503
  });
}
```

### 資料備份策略
- 定期備份 Supabase 資料庫
- 監控 Polar 訂閱狀態同步
- 保留 Webhook 事件日誌
- 定期驗證資料一致性

## 📚 開發者指南

### 新增功能時的注意事項
1. **保持資料一致性**: 任何訂閱相關變更都要同時更新 Polar 和 Supabase
2. **權限檢查**: 使用 `hasProAccess()` 統一檢查用戶權限
3. **錯誤處理**: 提供友善的用戶錯誤訊息
4. **日誌記錄**: 記錄關鍵操作便於除錯
5. **測試覆蓋**: 為新功能編寫適當的測試

### 常用開發命令
```bash
# 啟動開發環境
npm run dev

# 檢查程式碼品質
npm run lint

# 執行測試
npm test

# 建置生產版本
npm run build
```

---

**文檔版本**: 1.0
**最後更新**: 2025-07-20
**維護者**: 開發團隊
**狀態**: ✅ 已完成
