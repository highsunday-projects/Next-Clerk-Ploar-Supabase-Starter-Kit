/**
 * 測試權限檢查函數的邏輯
 * 驗證三種訂閱狀態是否正確判斷
 */

// 模擬 hasProAccess 函數邏輯

// 新版權限檢查邏輯（SF10）
function hasProAccess(user) {
  // 必須是專業版且狀態為 active_recurring 或 active_ending
  if (user.subscription_plan !== 'pro') return false;
  if (!['active_recurring', 'active_ending'].includes(user.subscription_status)) return false;
  if (!user.polar_subscription_id) return false;
  if (user.current_period_end) {
    const currentTime = new Date();
    const periodEnd = new Date(user.current_period_end);
    if (periodEnd <= currentTime) return false;
  }
  return true;
}

function isAutoRenewing(user) {
  // 只有 active_recurring 狀態才代表會自動續訂
  return hasProAccess(user) && user.subscription_status === 'active_recurring';
}

function isWillExpire(user) {
  // active_ending 狀態代表本期結束後不再續訂
  return hasProAccess(user) && user.subscription_status === 'active_ending';
}

function isFreeUser(user) {
  return !hasProAccess(user);
}

// 測試案例

const testCases = [
  {
    name: "會自動續訂用戶",
    user: {
      subscription_plan: 'pro',
      subscription_status: 'active_recurring',
      polar_subscription_id: 'sub_123',
      current_period_end: '2025-08-20T10:30:00Z',
    },
    expected: {
      hasProAccess: true,
      isAutoRenewing: true,
      isWillExpire: false,
      isFreeUser: false
    }
  },
  {
    name: "本期結束後到期用戶",
    user: {
      subscription_plan: 'pro',
      subscription_status: 'active_ending',
      polar_subscription_id: 'sub_456',
      current_period_end: '2025-08-20T10:30:00Z',
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
      subscription_status: 'active_recurring',
      polar_subscription_id: 'sub_789',
      current_period_end: '2025-01-01T10:30:00Z', // 已過期
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
