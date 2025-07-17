'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function CheckoutSuccessPage() {
  const { user, isLoaded } = useUser();
  const { refetch } = useUserProfile();
  const router = useRouter();
  // 未來可能需要用於處理查詢參數
  // const searchParams = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    if (isLoaded && user) {
      // 延遲一下再重新獲取資料，讓 Webhook 有時間處理
      const timer = setTimeout(async () => {
        try {
          await refetch();
          setIsRefreshing(false);
        } catch (error) {
          console.error('Error refreshing user profile:', error);
          setError('無法更新訂閱狀態，請重新整理頁面');
          setIsRefreshing(false);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, user, router, refetch]);

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-800 mb-2">發生錯誤</h1>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              重新整理頁面
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors"
            >
              返回儀表板
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isRefreshing) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-blue-800 mb-2">處理付款中</h1>
          <p className="text-blue-700 mb-4">
            我們正在處理您的付款並更新您的訂閱狀態，請稍候...
          </p>
          <div className="text-sm text-blue-600">
            這通常需要幾秒鐘的時間
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-green-800 mb-2">付款成功！</h1>
        <p className="text-green-700 mb-6">
          感謝您的訂閱！您的帳戶已成功升級，現在可以享受新方案的所有功能。
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            前往儀表板
          </button>
          <button
            onClick={() => router.push('/dashboard/subscription')}
            className="w-full border border-green-300 text-green-700 py-2 px-4 rounded-lg hover:bg-green-50 transition-colors"
          >
            查看訂閱詳情
          </button>
        </div>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>
          如果您有任何問題，請
          <a href="mailto:support@example.com" className="text-blue-600 hover:underline ml-1">
            聯繫客服支援
          </a>
        </p>
      </div>
    </div>
  );
}
