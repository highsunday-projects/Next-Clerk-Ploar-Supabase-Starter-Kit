'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

interface DebugData {
  timestamp: string;
  userId: string;
  envConfig: Record<string, string>;
  productMapping: Record<string, string | null>;
  userProfile: any;
  polarSubscription: any;
}

export default function SubscriptionDebugPage() {
  const { user, isLoaded } = useUser();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/subscription');
      const data = await response.json();
      
      if (response.ok) {
        setDebugData(data.debug);
      } else {
        console.error('Debug API error:', data.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSubscriptionUpdate = async (targetPlan: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_update',
          targetPlan
        }),
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : '測試失敗' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchDebugData();
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return <div className="p-8">載入中...</div>;
  }

  if (!user) {
    return <div className="p-8">請先登入</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">訂閱方案切換調試工具</h1>
      
      <div className="space-y-8">
        {/* 重新載入按鈕 */}
        <div>
          <button
            onClick={fetchDebugData}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '載入中...' : '重新載入調試資料'}
          </button>
        </div>

        {/* 環境配置 */}
        {debugData && (
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">環境配置</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(debugData.envConfig).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span className={value === '未設定' ? 'text-red-500' : 'text-green-500'}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 產品映射 */}
        {debugData && (
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">產品 ID 映射</h2>
            <div className="space-y-2">
              {Object.entries(debugData.productMapping).map(([plan, productId]) => (
                <div key={plan} className="flex justify-between">
                  <span className="font-medium">{plan}:</span>
                  <span className={!productId ? 'text-red-500' : 'text-green-500'}>
                    {productId || '未設定'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 用戶資料 */}
        {debugData && (
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">用戶訂閱資料</h2>
            <pre className="bg-white p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugData.userProfile, null, 2)}
            </pre>
          </div>
        )}

        {/* Polar 訂閱資料 */}
        {debugData && debugData.polarSubscription && (
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Polar 訂閱資料</h2>
            <pre className="bg-white p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugData.polarSubscription, null, 2)}
            </pre>
          </div>
        )}

        {/* 測試按鈕 */}
        {debugData && debugData.userProfile?.polar_subscription_id && (
          <div className="bg-yellow-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">測試訂閱更新</h2>
            <div className="space-x-4">
              <button
                onClick={() => testSubscriptionUpdate('pro')}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                測試切換到 Pro
              </button>
            </div>
          </div>
        )}

        {/* 測試結果 */}
        {testResult && (
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">測試結果</h2>
            <pre className="bg-white p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
