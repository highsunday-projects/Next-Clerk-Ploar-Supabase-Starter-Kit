'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordValidation {
  minLength: boolean;
  hasNumber: boolean;
  hasLetter: boolean;
  isValid: boolean;
}

export default function PasswordManager() {
  const { user } = useUser();
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string;
  }>({ type: null, text: '' });

  // 分析用戶狀態
  const hasPassword = user?.passwordEnabled || false;
  const hasGoogleAccount = user?.externalAccounts?.some(
    account => account.provider === 'google'
  ) || false;

  // 密碼驗證邏輯
  const validatePassword = (password: string): PasswordValidation => {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    
    return {
      minLength,
      hasNumber,
      hasLetter,
      isValid: minLength && hasNumber && hasLetter
    };
  };

  const passwordValidation = validatePassword(formData.newPassword);
  const passwordsMatch = formData.newPassword === formData.confirmPassword;

  // 表單處理
  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除訊息當用戶開始輸入
    if (message.type) {
      setMessage({ type: null, text: '' });
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // 提交處理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基本驗證
    if (!passwordValidation.isValid) {
      setMessage({
        type: 'error',
        text: '新密碼不符合安全要求'
      });
      return;
    }

    if (!passwordsMatch) {
      setMessage({
        type: 'error',
        text: '新密碼與確認密碼不一致'
      });
      return;
    }

    if (hasPassword && !formData.currentPassword) {
      setMessage({
        type: 'error',
        text: '請輸入目前密碼'
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: null, text: '' });

    try {
      // 根據用戶狀態調用不同的 API
      if (hasPassword) {
        // 有密碼用戶：需要提供目前密碼
        await user?.updatePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
      } else {
        // 無密碼用戶：直接設置新密碼
        await user?.updatePassword({
          newPassword: formData.newPassword
        });
      }

      setMessage({
        type: 'success',
        text: hasPassword ? '密碼變更成功！' : '密碼設置成功！現在您可以使用電子郵件和密碼登入。'
      });

      // 清空表單
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error: unknown) {
      console.error('Password update error:', error);

      // 處理不同類型的錯誤
      let errorMessage = '密碼更新失敗，請稍後再試';

      if (error && typeof error === 'object' && 'errors' in error) {
        const errorObj = error as { errors?: Array<{ message?: string }> };
        if (errorObj.errors?.[0]?.message) {
          errorMessage = errorObj.errors[0].message;
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        const errorObj = error as { message?: string };
        if (errorObj.message) {
          errorMessage = errorObj.message;
        }
      }

      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <Lock className="w-5 h-5 text-blue-600 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">密碼管理</h3>
          <p className="text-sm text-gray-600">
            {hasPassword ? '變更您的登入密碼' : '設置密碼作為備用登入方式'}
          </p>
        </div>
      </div>

      {/* 登入方式狀態 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">目前登入方式</h4>
        <div className="flex flex-wrap gap-2">
          {hasGoogleAccount && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <Shield className="w-3 h-3 mr-1" />
              Google 帳戶
            </span>
          )}
          {hasPassword && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Lock className="w-3 h-3 mr-1" />
              密碼登入
            </span>
          )}
          {!hasPassword && !hasGoogleAccount && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              無登入方式
            </span>
          )}
        </div>
      </div>

      {/* 密碼表單 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 目前密碼（僅有密碼用戶顯示） */}
        {hasPassword && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目前密碼
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="輸入目前密碼"
                required={hasPassword}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.current ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* 新密碼 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {hasPassword ? '新密碼' : '設置密碼'}
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder={hasPassword ? '輸入新密碼' : '輸入密碼'}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPasswords.new ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* 密碼強度指示 */}
          {formData.newPassword && (
            <div className="mt-2 space-y-1">
              <div className={`text-xs flex items-center ${
                passwordValidation.minLength ? 'text-green-600' : 'text-red-600'
              }`}>
                {passwordValidation.minLength ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                至少 8 個字元
              </div>
              <div className={`text-xs flex items-center ${
                passwordValidation.hasLetter ? 'text-green-600' : 'text-red-600'
              }`}>
                {passwordValidation.hasLetter ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                包含英文字母
              </div>
              <div className={`text-xs flex items-center ${
                passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'
              }`}>
                {passwordValidation.hasNumber ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                包含數字
              </div>
            </div>
          )}
        </div>

        {/* 確認密碼 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            確認密碼
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder="再次輸入密碼"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPasswords.confirm ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* 密碼匹配指示 */}
          {formData.confirmPassword && (
            <div className={`mt-1 text-xs flex items-center ${
              passwordsMatch ? 'text-green-600' : 'text-red-600'
            }`}>
              {passwordsMatch ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              {passwordsMatch ? '密碼一致' : '密碼不一致'}
            </div>
          )}
        </div>

        {/* 訊息顯示 */}
        {message.type && (
          <div className={`p-3 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* 提交按鈕 */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {hasPassword ? '更新中...' : '設置中...'}
              </>
            ) : (
              hasPassword ? '更新密碼' : '設置密碼'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
