'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Crown,
  Loader2
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasProAccess, getUserConfig, getUserStatusDescription } from '@/types/supabase';
import { getSubscriptionStatusText, getSubscriptionStatusClass } from '@/lib/subscriptionUtils';
import { useLanguage } from '@/contexts/LanguageContext';
// SF09: Remove unused imports

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { profile, loading, error } = useUserProfile();
  const router = useRouter();
  const { t } = useLanguage();

  // Redirect unauthenticated users
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 text-red-400">⚠️</div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{t('dashboard.overview.errorLoading')}</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // SF09: Get current user configuration
  const currentConfig = profile ? getUserConfig(profile) : null;





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
                {t('dashboard.overview.title', { name: user.firstName || t('common.user') })}
              </h1>
              <p className="text-gray-600">
                {t('dashboard.overview.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              profile ? getSubscriptionStatusClass(profile.subscription_status) : 'bg-gray-100 text-gray-800'
            }`}>
              {profile ? (() => {
                switch (profile.subscription_status) {
                  case 'active_recurring':
                    return t('dashboard.subscription.status.activeRecurring', { fallback: 'Active (Auto-renew)' });
                  case 'active_ending':
                    return t('dashboard.subscription.status.activeEnding', { fallback: 'Active (Ending)' });
                  case 'inactive':
                    return t('dashboard.subscription.status.inactive', { fallback: 'Free Plan' });
                  default:
                    return t('dashboard.subscription.status.unknown', { fallback: 'Unknown' });
                }
              })() : t('common.loading')}
            </span>
            {profile && (
              <div className="text-xs text-gray-500">
                {(() => {
                  switch (profile.subscription_status) {
                    case 'active_recurring':
                      return t('dashboard.subscription.status.activeRecurring');
                    case 'active_ending':
                      return t('dashboard.subscription.status.activeEnding');
                    case 'inactive':
                      return t('dashboard.subscription.status.inactive');
                    default:
                      return t('dashboard.subscription.status.unknown');
                  }
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            {t('dashboard.overview.currentPlan')}
          </h2>
          <Link
            href="/dashboard/subscription"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {t('dashboard.overview.manageSubscription')} →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">
                {profile && hasProAccess(profile) ? t('pricing.plans.pro.name') : t('pricing.plans.free.name')}
              </span>
              <span className="ml-2 text-lg text-gray-600">
                {currentConfig?.price === 0 ? t('pricing.plans.free.price') : `$${currentConfig?.price || 0}${t('pricing.plans.pro.period')}`}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {profile?.trial_ends_at ?
                `${t('dashboard.overview.trialUntil')}: ${new Date(profile.trial_ends_at).toLocaleDateString()}` :
                profile && hasProAccess(profile) ? t('pricing.plans.pro.name') : t('pricing.plans.free.name')
              }
            </p>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">{t('dashboard.overview.features')}</h4>
              <ul className="space-y-1">
                {profile && hasProAccess(profile) ? [
                  t('pricing.plans.pro.features.0'),
                  t('pricing.plans.pro.features.1'),
                  t('pricing.plans.pro.features.2'),
                  t('pricing.plans.pro.features.3')
                ].map((feature: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    {feature}
                  </li>
                )) : [
                  t('pricing.plans.free.features.0'),
                  t('pricing.plans.free.features.1'),
                  t('pricing.plans.free.features.2')
                ].map((feature: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {t('dashboard.overview.monthlyUsage', { limit: currentConfig?.monthlyUsageLimit.toLocaleString() || '1,000' })}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 ${
                profile && hasProAccess(profile)
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                  : 'bg-gradient-to-br from-gray-400 to-gray-600'
              }`}>
                <Crown className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm text-gray-600">
                {profile && hasProAccess(profile)
                  ? t('dashboard.overview.proFeatures')
                  : t('dashboard.overview.basicFeatures')
                }
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            {t('dashboard.overview.quickActions')}
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/subscription"
              className="block w-full text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex flex-col items-center">
                <CreditCard className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">{t('dashboard.overview.actions.manageSubscription')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('dashboard.overview.actions.manageSubscriptionDesc')}</p>
              </div>
            </Link>
            <Link
              href="/dashboard/profile"
              className="block w-full text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex flex-col items-center">
                <Crown className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">{t('dashboard.overview.actions.profile')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('dashboard.overview.actions.profileDesc')}</p>
              </div>
            </Link>
            <button className="w-full text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex flex-col items-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">{t('dashboard.overview.actions.apiDocs')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('dashboard.overview.actions.apiDocsDesc')}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
