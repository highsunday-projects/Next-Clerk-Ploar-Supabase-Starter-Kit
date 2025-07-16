import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { User, Mail, Calendar, Shield } from 'lucide-react';

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">個人資料</h1>
        <p className="text-gray-600">
          查看和管理您的帳戶資訊
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-2xl font-bold text-blue-600">
              {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.firstName} {user.lastName || ''}
            </h2>
            <p className="text-gray-600">{user.emailAddresses[0]?.emailAddress}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center p-4 border border-gray-200 rounded-lg">
              <User className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">姓名</p>
                <p className="text-sm text-gray-600">
                  {user.firstName} {user.lastName || '未設定'}
                </p>
              </div>
            </div>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">電子郵件</p>
                <p className="text-sm text-gray-600">{user.emailAddresses[0]?.emailAddress}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center p-4 border border-gray-200 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">註冊日期</p>
                <p className="text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                </p>
              </div>
            </div>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">帳戶狀態</p>
                <p className="text-sm text-green-600">已驗證</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">帳戶操作</h3>
          <div className="flex flex-wrap gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
              編輯個人資料
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              變更密碼
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              安全設定
            </button>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">偏好設定</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">電子郵件通知</p>
              <p className="text-sm text-gray-500">接收產品更新和重要通知</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">行銷郵件</p>
              <p className="text-sm text-gray-500">接收促銷活動和新功能介紹</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
