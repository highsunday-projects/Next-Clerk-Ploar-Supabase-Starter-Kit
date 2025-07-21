/**
 * 用戶訂閱資料 Hook
 * 
 * 提供用戶訂閱資料的獲取、更新和狀態管理功能
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import type { UserProfile, UserProfileResponse } from '@/types/supabase';

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

/**
 * 用戶訂閱資料 Hook
 */
export function useUserProfile(): UseUserProfileReturn {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 獲取用戶訂閱資料
   */
  const fetchProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/subscription', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UserProfileResponse = await response.json();

      if (data.success && data.data) {
        setProfile(data.data);
      } else {
        throw new Error(data.error || '獲取訂閱資料失敗');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : '獲取訂閱資料失敗');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新用戶訂閱資料
   */
  const updateProfile = async (updateData: Partial<UserProfile>) => {
    if (!user?.id) {
      throw new Error('用戶未登入');
    }

    try {
      setError(null);

      const response = await fetch('/api/user/subscription', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UserProfileResponse = await response.json();

      if (data.success && data.data) {
        setProfile(data.data);
      } else {
        throw new Error(data.error || '更新訂閱資料失敗');
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
      const errorMessage = err instanceof Error ? err.message : '更新訂閱資料失敗';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * 重新獲取資料
   */
  const refetch = async () => {
    await fetchProfile();
  };

  // 當用戶資料載入完成後，自動獲取訂閱資料
  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchProfile();
    } else if (isLoaded && !user) {
      setLoading(false);
      setProfile(null);
    }
  }, [isLoaded, user?.id]);

  return {
    profile,
    loading,
    error,
    refetch,
    updateProfile,
  };
}

/**
 * 用戶訂閱狀態 Hook - SF10 簡化版
 * 提供基於新 3 欄位結構的訂閱狀態檢查方法
 */
export function useSubscriptionStatus() {
  const { profile, loading, error } = useUserProfile();

  // SF10: 使用新的簡化狀態枚舉
  const isActiveRecurring = profile?.subscription_status === 'active_recurring';
  const isActiveEnding = profile?.subscription_status === 'active_ending';
  const isInactive = profile?.subscription_status === 'inactive';

  const isPro = profile?.subscription_plan === 'pro';
  const isFree = profile?.subscription_plan === null;

  // 簡化的權限檢查
  const hasActiveSubscription = isActiveRecurring || isActiveEnding;

  return {
    profile,
    loading,
    error,
    status: {
      isActiveRecurring,
      isActiveEnding,
      isInactive,
      isPro,
      isFree,
      hasActiveSubscription,
    },
  };
}
