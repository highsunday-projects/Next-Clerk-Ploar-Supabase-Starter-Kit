/**
 * 測試 webhook 端點的腳本
 * 模擬 Polar webhook 請求來測試日誌功能
 */

const http = require('http');

// 模擬的 Polar webhook payload
const mockPayload = {
  type: 'subscription.created',
  data: {
    id: 'sub_test_123456',
    status: 'active',
    customer_id: 'cus_test_123456',
    current_period_end: '2025-08-21T06:38:51.945Z',
    cancel_at_period_end: false,
    metadata: {
      clerk_user_id: 'user_test_123456'
    }
  },
  created_at: new Date().toISOString()
};

// 測試函數
function testWebhookEndpoint() {
  console.log('🧪 Testing webhook endpoint...\n');

  const postData = JSON.stringify(mockPayload);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhooks/polar',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-polar-signature': 'test_signature_12345',
      'x-polar-event': 'subscription.created',
      'x-polar-delivery': 'test_delivery_id_12345',
      'User-Agent': 'Polar-Webhooks/1.0'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📡 Response status: ${res.statusCode}`);
    console.log(`📋 Response headers:`, res.headers);

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      console.log('📄 Response body:', body);
      console.log('\n✅ Test completed!');
      console.log('📍 Check logs at: logs/webhooks/webhook-2025-07-21.log');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error making request:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure your Next.js server is running with: npm run dev');
    }
  });

  req.write(postData);
  req.end();
}

// 執行測試
console.log('📦 Mock payload:');
console.log(JSON.stringify(mockPayload, null, 2));
console.log('\n');

testWebhookEndpoint();