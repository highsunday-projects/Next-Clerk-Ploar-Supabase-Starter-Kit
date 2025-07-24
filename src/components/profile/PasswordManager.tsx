'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
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

  // Analyze user status
  const hasPassword = user?.passwordEnabled || false;
  const hasGoogleAccount = user?.externalAccounts?.some(
    account => account.provider === 'google'
  ) || false;

  // Password validation logic
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

  // Form handling
  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear message when user starts typing
    if (message.type) {
      setMessage({ type: null, text: '' });
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Submit handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!passwordValidation.isValid) {
      setMessage({
        type: 'error',
        text: t('dashboard.profile.password.validation.notSecure')
      });
      return;
    }

    if (!passwordsMatch) {
      setMessage({
        type: 'error',
        text: t('dashboard.profile.password.validation.mismatch')
      });
      return;
    }

    if (hasPassword && !formData.currentPassword) {
      setMessage({
        type: 'error',
        text: t('dashboard.profile.password.validation.currentRequired')
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: null, text: '' });

    try {
      // Call different APIs based on user status
      if (hasPassword) {
        // Users with password: need to provide current password
        await user?.updatePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
      } else {
        // Users without password: directly set new password
        await user?.updatePassword({
          newPassword: formData.newPassword
        });
      }

      setMessage({
        type: 'success',
        text: hasPassword ? t('dashboard.profile.password.success.updated') : t('dashboard.profile.password.success.created')
      });

      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error: unknown) {
      console.error('Password update error:', error);

      // Handle different types of errors
      let errorMessage = t('dashboard.profile.password.error.updateFailed');

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
          <h3 className="text-lg font-medium text-gray-900">{t('dashboard.profile.password.title')}</h3>
          <p className="text-sm text-gray-600">
            {hasPassword ? t('dashboard.profile.password.subtitleUpdate') : t('dashboard.profile.password.subtitleSetup')}
          </p>
        </div>
      </div>

      {/* Login method status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">{t('dashboard.profile.password.currentMethods')}</h4>
        <div className="flex flex-wrap gap-2">
          {hasGoogleAccount && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <Shield className="w-3 h-3 mr-1" />
              {t('dashboard.profile.password.googleAccount')}
            </span>
          )}
          {hasPassword && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Lock className="w-3 h-3 mr-1" />
              {t('dashboard.profile.password.passwordLogin')}
            </span>
          )}
          {!hasPassword && !hasGoogleAccount && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {t('dashboard.profile.password.noLoginMethod')}
            </span>
          )}
        </div>
      </div>

      {/* Password form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current password (only shown for users with password) */}
        {hasPassword && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard.profile.password.currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder={t('dashboard.profile.password.enterCurrentPassword')}
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

        {/* New password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {hasPassword ? t('dashboard.profile.password.newPassword') : t('dashboard.profile.password.setupPassword')}
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder={hasPassword ? t('dashboard.profile.password.enterNewPassword') : t('dashboard.profile.password.enterPassword')}
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
          
          {/* Password strength indicator */}
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
                {t('dashboard.profile.password.minLength')}
              </div>
              <div className={`text-xs flex items-center ${
                passwordValidation.hasLetter ? 'text-green-600' : 'text-red-600'
              }`}>
                {passwordValidation.hasLetter ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {t('dashboard.profile.password.hasLetter')}
              </div>
              <div className={`text-xs flex items-center ${
                passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'
              }`}>
                {passwordValidation.hasNumber ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {t('dashboard.profile.password.hasNumber')}
              </div>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dashboard.profile.password.confirmPassword')}
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder={t('dashboard.profile.password.enterPasswordAgain')}
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
          
          {/* Password match indicator */}
          {formData.confirmPassword && (
            <div className={`mt-1 text-xs flex items-center ${
              passwordsMatch ? 'text-green-600' : 'text-red-600'
            }`}>
              {passwordsMatch ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              {passwordsMatch ? t('dashboard.profile.password.passwordMatch') : t('dashboard.profile.password.passwordMismatch')}
            </div>
          )}
        </div>

        {/* Message display */}
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

        {/* Submit button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {hasPassword ? t('dashboard.profile.password.updating') : t('dashboard.profile.password.setting')}
              </>
            ) : (
              hasPassword ? t('dashboard.profile.password.updatePassword') : t('dashboard.profile.password.setPassword')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
