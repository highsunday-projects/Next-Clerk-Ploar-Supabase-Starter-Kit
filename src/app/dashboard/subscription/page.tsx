'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Crown,
  Check,
  CreditCard,
  Calendar,
  AlertCircle,
  Star,
  Loader2
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  hasProAccess,
  getUserConfig,
  isAutoRenewing,
  isWillExpire
} from '@/types/supabase';
import {
  getSubscriptionStatusClass,
  canManagePayment,
  canCancelSubscription
} from '@/lib/subscriptionUtils';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SubscriptionPage() {
  const { user, isLoaded } = useUser();
  const { profile, loading, error } = useUserProfile();
  const { t } = useLanguage();
  const router = useRouter();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false); // Track plan upgrade status
  const [isProcessing, setIsProcessing] = useState(false); // Track processing state
  // Redirect unauthenticated users
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // Handle Polar Checkout callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success === 'true') {
      // Payment success, show success message and clean URL
      alert(t('dashboard.subscription.alerts.paymentSuccess'));
      window.history.replaceState({}, '', '/dashboard/subscription');
    } else if (canceled === 'true') {
      // Payment canceled, show cancel message and clean URL
      alert(t('dashboard.subscription.alerts.paymentCanceled'));
      window.history.replaceState({}, '', '/dashboard/subscription');
    }

    // Reset upgrade state
    setUpgrading(null);
  }, [t]);

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('dashboard.subscription.loadingData')}</p>
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
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{t('dashboard.subscription.errorLoading')}</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // If no subscription data, show default free plan
  if (!profile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-400 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">{t('dashboard.subscription.notFound')}</h3>
            <p className="text-sm text-yellow-700 mt-1">{t('dashboard.subscription.notFoundDesc')}</p>
          </div>
        </div>
      </div>
    );
  }

  // SF09: Get current user configuration
  const currentConfig = getUserConfig(profile);
  const isProUser = hasProAccess(profile);

  // Current subscription data
  const currentSubscription = {
    plan: isProUser ? t('pricing.plans.pro.name') : t('pricing.plans.free.name'),
    price: currentConfig.price,
    period: 'month',
    status: profile.subscription_status,
    nextBilling: profile.trial_ends_at ?
      new Date(profile.trial_ends_at).toLocaleDateString() :
      isProUser ? (() => {
        switch (profile.subscription_status) {
          case 'active_recurring':
            return profile.current_period_end 
              ? t('dashboard.subscription.nextBilling', { date: new Date(profile.current_period_end).toLocaleDateString() })
              : t('dashboard.subscription.autoRenew');
          case 'active_ending':
            return profile.current_period_end 
              ? t('dashboard.subscription.willExpire', { date: new Date(profile.current_period_end).toLocaleDateString() })
              : t('dashboard.subscription.willCancel');
          default:
            return t('dashboard.subscription.unlimited');
        }
      })() : t('dashboard.subscription.unlimited'),
    paymentMethod: isProUser ? '**** **** **** 4242' : t('dashboard.subscription.noPaymentRequired'),
    features: isProUser ? [
      t('pricing.plans.pro.features.0'),
      t('pricing.plans.pro.features.1'),
      t('pricing.plans.pro.features.2'),
      t('pricing.plans.pro.features.3')
    ] : [
      t('pricing.plans.free.features.0'),
      t('pricing.plans.free.features.1'),
      t('pricing.plans.free.features.2')
    ],
    monthlyLimit: currentConfig.monthlyUsageLimit
  };

  // SF09: Simplified plan logic - only show upgrade options
  // const plans = isProUser ? [] : [{
  //   id: 'pro',
  //   name: SUBSCRIPTION_CONFIG.pro.displayName,
  //   price: SUBSCRIPTION_CONFIG.pro.price,
  //   period: 'month',
  //   description: t('pricing.plans.pro.description'),
  //   features: SUBSCRIPTION_CONFIG.pro.features,
  //   current: false,
  //   popular: true,
  //   monthlyLimit: SUBSCRIPTION_CONFIG.pro.monthlyUsageLimit
  // }];

  // SF09: Handle professional upgrade
  const handlePlanUpgrade = async (planId: string) => {
    if (planId !== 'pro' || isProUser) {
      return; // Don't handle free plan or same plan
    }

    // Confirm upgrade
    const confirmed = confirm(t('dashboard.subscription.dialogs.confirmUpgradeDialog'));

    if (!confirmed) {
      return;
    }

    try {
      setUpgrading(planId);

      // Call Polar Checkout/Update API
      const response = await fetch('/api/polar/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          userId: user?.id,
          successUrl: `${window.location.origin}/dashboard/subscription?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/subscription?canceled=true`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('dashboard.subscription.errors.processingFailed'));
      }

      // Check response type
      if (data.success && data.message) {
        // Subscription update success (existing user)
        alert(data.message);
        // Reload page to update subscription info
        window.location.reload();
      } else if (data.checkoutUrl) {
        // Need to redirect to Checkout page (new user)
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(t('dashboard.subscription.alerts.unknownResponseFormat'));
      }

    } catch (error) {
      console.error('Error processing subscription:', error);
      alert(error instanceof Error ? error.message : t('dashboard.subscription.errors.processingFailed'));
      setUpgrading(null);
    }
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!user?.id || !profile) return;

    try {
      setCancelling(true);

      const response = await fetch('/api/polar/schedule-downgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetPlan: 'free',
          userId: user.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('dashboard.subscription.errors.cancelFailed'));
      }

      alert(t('dashboard.subscription.alerts.subscriptionCancelSuccess'));
      // Reload page to update subscription info
      window.location.reload();

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert(error instanceof Error ? error.message : t('dashboard.subscription.alerts.cancelError'));
    } finally {
      setCancelling(false);
    }
  };

  // Handle resume subscription
  const handleResumeSubscription = async () => {
    if (!user?.id || !profile) return;

    try {
      setCancelling(true);

      const response = await fetch('/api/polar/cancel-downgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('dashboard.subscription.errors.resumeFailed'));
      }

      alert(t('dashboard.subscription.alerts.subscriptionResumeSuccess'));
      // Reload page to update subscription info
      window.location.reload();

    } catch (error) {
      console.error('Error resuming subscription:', error);
      alert(error instanceof Error ? error.message : t('dashboard.subscription.alerts.resumeError'));
    } finally {
      setCancelling(false);
    }
  };

  // Handle customer portal
  const handleCustomerPortal = async () => {
    if (!user?.id || !profile) return;

    try {
      setIsProcessing(true);

      const response = await fetch('/api/polar/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('dashboard.subscription.alerts.portalError'));
      }

      if (data.portalUrl) {
        window.open(data.portalUrl, '_blank');
      } else {
        throw new Error(t('dashboard.subscription.alerts.portalUrlError'));
      }

    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert(error instanceof Error ? error.message : t('dashboard.subscription.alerts.portalError'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard.subscription.title')}</h1>
        <p className="text-gray-600">
          {t('dashboard.subscription.subtitle')}
        </p>
      </div>

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
{t('dashboard.subscription.currentSubscription')}
          </h2>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionStatusClass(profile.subscription_status)}`}>
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
            </span>
            <div className="text-xs text-gray-500 mt-1">
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
          </div>
        </div>

        {/* Status notifications */}
        {isWillExpire(profile) && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                {t('dashboard.subscription.status.willExpireWarning', { 
                  date: profile.current_period_end ? new Date(profile.current_period_end).toLocaleDateString() : t('dashboard.subscription.billingCycleEnd') 
                })}
              </span>
            </div>
          </div>
        )}

        {isAutoRenewing(profile) && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-800">
                {t('dashboard.subscription.status.autoRenewActive')}
              </span>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-baseline mb-2">
              <span className="text-3xl font-bold text-gray-900">{currentSubscription.plan}</span>
              <span className="ml-2 text-lg text-gray-600">
                {currentSubscription.price === 0 ? t('pricing.plans.free.price') : `$${currentSubscription.price}`}{currentSubscription.price > 0 ? t('dashboard.subscription.ui.perMonth') : ''}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {(() => {
                  if (!hasProAccess(profile)) {
                    return t('dashboard.subscription.unlimited');
                  }
                  switch (profile.subscription_status) {
                    case 'active_recurring':
                      return profile.current_period_end 
                        ? t('dashboard.subscription.nextBilling', { date: new Date(profile.current_period_end).toLocaleDateString() })
                        : t('dashboard.subscription.autoRenew');
                    case 'active_ending':
                      return profile.current_period_end 
                        ? t('dashboard.subscription.willExpire', { date: new Date(profile.current_period_end).toLocaleDateString() })
                        : t('dashboard.subscription.willCancel');
                    default:
                      return t('dashboard.subscription.unlimited');
                  }
                })()}
              </div>
              <div className="flex items-center text-gray-600">
                <CreditCard className="w-4 h-4 mr-2" />
                {t('dashboard.subscription.ui.paymentMethod')}{currentSubscription.paymentMethod}
              </div>
              <div className="flex items-center text-gray-600">
                <Star className="w-4 h-4 mr-2" />
                {t('dashboard.subscription.ui.monthlyQuota')}{currentSubscription.monthlyLimit?.toLocaleString()}{t('dashboard.subscription.ui.apiCallsUnit')}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">{t('dashboard.subscription.ui.includedFeatures')}</h4>
              <ul className="space-y-1">
                {currentSubscription.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-3">
            {canManagePayment(profile) && (
              <button
                disabled={isProcessing}
                className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 ${
                  isProcessing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={handleCustomerPortal}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('dashboard.subscription.loading')}
                  </div>
                ) : (
                  t('dashboard.subscription.manageSubscription')
                )}
              </button>
            )}

            {isProUser && (
              <button
                disabled={isProcessing}
                className={`w-full border py-2 px-4 rounded-lg transition-colors duration-200 ${
                  isProcessing
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={handleCustomerPortal}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('dashboard.subscription.loading')}
                  </div>
                ) : (
                  t('dashboard.subscription.viewInvoices')
                )}
              </button>
            )}

            {canCancelSubscription(profile) && (
              <>
                {isWillExpire(profile) ? (
                  <button
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium border-2 border-green-500"
                    disabled={cancelling}
                    onClick={() => {
                      if (confirm(t('dashboard.subscription.dialogs.confirmResume'))) {
                        handleResumeSubscription();
                      }
                    }}
                  >
                    {cancelling ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t('dashboard.subscription.processing')}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Crown className="w-4 h-4 mr-2" />
                        {t('dashboard.subscription.continueSubscription')}
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    className="w-full border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={cancelling}
                    onClick={() => {
                      if (confirm(t('dashboard.subscription.dialogs.confirmCancel'))) {
                        handleCancelSubscription();
                      }
                    }}
                  >
                    {cancelling ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t('dashboard.subscription.processing')}
                      </div>
                    ) : (
                      t('dashboard.subscription.cancelSubscription')
                    )}
                  </button>
                )}
              </>
            )}

            {!isProUser && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">
                  {t('dashboard.subscription.ui.basicUserNeedNoPayment')}
                </p>
              </div>
            )}

            {profile.subscription_status === 'inactive' && profile.subscription_plan === 'pro' && (
              <div className="text-center py-4">
                <p className="text-sm text-red-600 font-medium">
                  {t('dashboard.subscription.ui.subscriptionCancelledStatus')}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {t('dashboard.subscription.ui.canResubscribeAnytime')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade to Pro Section - Only for non-pro users */}
      {!isProUser && (
        <div className="relative bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6 overflow-hidden">
          {/* Eye-catching badge */}
          <div className="absolute -top-1 -right-1">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-medium animate-pulse">
              {t('dashboard.subscription.ui.upgradeRecommendedBadge')}
            </div>
          </div>

          {/* Header with enhanced visual appeal */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center mb-2">
                <Crown className="w-6 h-6 mr-2 text-yellow-500" />
                {t('dashboard.subscription.ui.upgradeToProfessional')}
              </h2>
              <p className="text-blue-600 font-medium">{t('dashboard.subscription.ui.efficiencyBoost')}</p>
            </div>
            <div className="text-right">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-blue-600">$5</span>
                  <span className="text-gray-600 ml-1">{t('dashboard.subscription.ui.perMonth')}</span>
                </div>
                <p className="text-xs text-blue-500 font-medium">{t('dashboard.subscription.ui.limitedOffer')}</p>
              </div>
            </div>
          </div>

          {/* Enhanced value proposition */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-100">
            <p className="text-gray-700 text-center font-medium">
              {t('dashboard.subscription.ui.avgEfficiencyIncrease', { percent: '300' })}
            </p>
          </div>

          {/* Enhanced Benefits Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                {t('dashboard.subscription.ui.currentBasicUser')}
              </h4>
              <ul className="space-y-2">
                <li className="text-sm text-gray-600 flex items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-300 mr-2 flex-shrink-0"></div>
                  {t('pricing.plans.free.features.0')}
                </li>
                <li className="text-sm text-gray-600 flex items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-300 mr-2 flex-shrink-0"></div>
                  {t('pricing.plans.free.features.1')}
                </li>
                <li className="text-sm text-gray-600 flex items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-300 mr-2 flex-shrink-0"></div>
                  {t('pricing.plans.free.features.2')}
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                {t('dashboard.subscription.ui.upgradeAfterPro')}
              </h4>
              <ul className="space-y-2">
                <li className="text-sm text-gray-700 flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span><strong>{t('pricing.plans.pro.features.0')}</strong> <span className="text-green-600">(+900%)</span></span>
                </li>
                <li className="text-sm text-gray-700 flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <strong>{t('pricing.plans.pro.features.1')}</strong>
                </li>
                <li className="text-sm text-gray-700 flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <strong>{t('pricing.plans.pro.features.2')}</strong>
                </li>
                <li className="text-sm text-gray-700 flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <strong>{t('pricing.plans.pro.features.3')}</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              disabled={upgrading === 'pro'}
              className={`flex-1 py-3 px-6 rounded-lg font-bold text-lg transition-all duration-300 transform ${
                upgrading === 'pro'
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
              onClick={() => {
                if (upgrading !== 'pro') {
                  handlePlanUpgrade('pro');
                }
              }}
            >
              {upgrading === 'pro' ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t('dashboard.subscription.processing')}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Crown className="w-5 h-5 mr-2" />
                  {t('dashboard.subscription.ui.upgradeInstantly')}
                </div>
              )}
            </button>
            
            <button
              className="sm:w-auto px-4 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
              onClick={() => alert(t('dashboard.subscription.alerts.featureComparison'))}
            >
              {t('dashboard.subscription.ui.learnMoreFeatures')}
            </button>
          </div>

          {/* Enhanced Trust Indicators */}
          <div className="mt-6 pt-4 border-t border-blue-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs text-gray-600">{t('dashboard.subscription.ui.moneyBackGuarantee')}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs text-gray-600">{t('dashboard.subscription.ui.cancelAnytime')}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-1">
                  <Star className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs text-gray-600">{t('dashboard.subscription.ui.instantActivation')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">{t('dashboard.subscription.ui.billingNotice')}</h3>
            <p className="text-sm text-yellow-700 mt-1">
              {t('dashboard.subscription.ui.billingNoticeDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
