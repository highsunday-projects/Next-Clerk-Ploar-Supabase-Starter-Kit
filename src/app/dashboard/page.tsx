import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  Activity,
  TrendingUp,
  Calendar,
  Crown,
  BarChart3
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // 模擬訂閱和使用數據
  const currentPlan = {
    name: '專業版',
    price: '$29',
    period: '/月',
    status: 'active',
    nextBilling: '2025-08-16',
    features: ['無限專案', '進階分析', '優先支援']
  };

  const usageStats = [
    {
      name: 'API 呼叫',
      value: '8,432',
      limit: '10,000',
      percentage: 84,
      icon: Activity,
    },
    {
      name: '儲存空間',
      value: '2.3 GB',
      limit: '5 GB',
      percentage: 46,
      icon: BarChart3,
    },
    {
      name: '團隊成員',
      value: '3',
      limit: '5',
      percentage: 60,
      icon: Crown,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'API 呼叫',
      description: '成功處理 127 個請求',
      time: '5 分鐘前',
      type: 'success'
    },
    {
      id: 2,
      action: '檔案上傳',
      description: '上傳 3 個檔案 (2.1 MB)',
      time: '1 小時前',
      type: 'info'
    },
    {
      id: 3,
      action: '訂閱續費',
      description: '專業版方案自動續費成功',
      time: '2 天前',
      type: 'success'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-semibold text-blue-600">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                歡迎回來，{user.firstName || '用戶'}！
              </h1>
              <p className="text-gray-600">
                管理您的訂閱和查看使用統計
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentPlan.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {currentPlan.status === 'active' ? '訂閱中' : '未訂閱'}
            </span>
          </div>
        </div>
      </div>

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            目前訂閱方案
          </h2>
          <Link
            href="/dashboard/subscription"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            管理訂閱 →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">{currentPlan.name}</span>
              <span className="ml-2 text-lg text-gray-600">{currentPlan.price}{currentPlan.period}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">下次計費：{currentPlan.nextBilling}</p>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">包含功能：</h4>
              <ul className="space-y-1">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm text-gray-600">享受專業版的所有功能</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          使用統計
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {usageStats.map((stat) => (
            <div key={stat.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <stat.icon className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">{stat.name}</span>
                </div>
                <span className="text-sm text-gray-500">{stat.value} / {stat.limit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    stat.percentage > 80 ? 'bg-red-500' :
                    stat.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${stat.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{stat.percentage}% 已使用</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              最近活動
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              快速操作
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <Link
                href="/dashboard/subscription"
                className="block w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">管理訂閱</p>
                    <p className="text-sm text-gray-500">升級、降級或取消訂閱</p>
                  </div>
                </div>
              </Link>
              <Link
                href="/dashboard/profile"
                className="block w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <Crown className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">個人資料</p>
                    <p className="text-sm text-gray-500">管理帳戶設定和偏好</p>
                  </div>
                </div>
              </Link>
              <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">使用報告</p>
                    <p className="text-sm text-gray-500">查看詳細的使用統計</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
