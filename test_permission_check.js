/**
 * 測試權限檢查函數的邏輯
 * 驗證三種訂閱狀態是否正確判斷
 */

// 模擬 hasProAccess 函數邏輯
function hasProAccess(user) {
  // 檢查基本條件：必須是專業版且狀態為 active
  if (user.subscription_plan !== 'pro' || user.subscription_status !== 'active') {
    return false;
  }

  // 檢查是否有 Polar 訂閱 ID
  if (!user.polar_subscription_id) {
    return false;
  }

  // 檢查訂閱是否還在有效期內
  if (user.current_period_end) {
    const currentTime = new Date();
    const periodEnd = new Date(user.current_period_end);
    
    // 如果已過期，則無權限
    if (periodEnd <= currentTime) {
      return false;
    }
  }

  return true;
}

function isAutoRenewing(user) {
  return hasProAccess(user) && !user.cancel_at_period_end;
}

function isWillExpire(user) {
  return hasProAccess(user) && !!user.cancel_at_period_end;
}

function isFreeUser(user) {
  return !hasProAccess(user);
}

// 測試案例
const testCases = [
  {
    name: "會續訂用戶",
    user: {
      subscription_plan: 'pro',
      subscription_status: 'active',
      polar_subscription_id: 'sub_123',
      current_period_end: '2025-08-20T10:30:00Z',
      cancel_at_period_end: false
    },
    expected: {
      hasProAccess: true,
      isAutoRenewing: true,
      isWillExpire: false,
      isFreeUser: false
    }
  },
  {
    name: "會到期用戶",
    user: {
      subscription_plan: 'pro',
      subscription_status: 'active',
      polar_subscription_id: 'sub_456',
      current_period_end: '2025-08-20T10:30:00Z',
      cancel_at_period_end: true
    },
    expected: {
      hasProAccess: true,
      isAutoRenewing: false,
      isWillExpire: true,
      isFreeUser: false
    }
  },
  {
    name: "免費版用戶",
    user: {
      subscription_plan: null,
      subscription_status: 'inactive',
      polar_subscription_id: null,
      current_period_end: null,
      cancel_at_period_end: false
    },
    expected: {
      hasProAccess: false,
      isAutoRenewing: false,
      isWillExpire: false,
      isFreeUser: true
    }
  },
  {
    name: "已過期用戶",
    user: {
      subscription_plan: 'pro',
      subscription_status: 'active',
      polar_subscription_id: 'sub_789',
      current_period_end: '2025-01-01T10:30:00Z', // 已過期
      cancel_at_period_end: false
    },
    expected: {
      hasProAccess: false,
      isAutoRenewing: false,
      isWillExpire: false,
      isFreeUser: true
    }
  }
];

// 執行測試
console.log('🧪 權限檢查函數測試開始\n');

testCases.forEach((testCase, index) => {
  console.log(`測試 ${index + 1}: ${testCase.name}`);
  
  const results = {
    hasProAccess: hasProAccess(testCase.user),
    isAutoRenewing: isAutoRenewing(testCase.user),
    isWillExpire: isWillExpire(testCase.user),
    isFreeUser: isFreeUser(testCase.user)
  };
  
  let allPassed = true;
  
  Object.keys(testCase.expected).forEach(key => {
    const expected = testCase.expected[key];
    const actual = results[key];
    const passed = expected === actual;
    
    if (!passed) allPassed = false;
    
    console.log(`  ${key}: ${actual} ${passed ? '✅' : '❌'} (期望: ${expected})`);
  });
  
  console.log(`  結果: ${allPassed ? '✅ 通過' : '❌ 失敗'}\n`);
});

console.log('🧪 測試完成');
