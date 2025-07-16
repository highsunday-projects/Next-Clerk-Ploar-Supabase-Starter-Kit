import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import PasswordManager from '@/components/profile/PasswordManager';

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
      </div>

      {/* Password Management */}
      <PasswordManager />
    </div>
  );
}
