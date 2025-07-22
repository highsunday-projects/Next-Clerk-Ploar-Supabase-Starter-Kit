---
uuid: 9d0e684bc89b45e8a014bafdd260738f
---
# Polar Payment Integration Guide

**Language**: [English](Polar-Payment-Integration-Guide.md) | [繁體中文](../訂閱模組/Polar金流整合說明.md)

## 📋 Document Overview

This document provides detailed instructions on the Polar payment system integration in the Next-Clerk-Polar-Supabase Starter Kit, including payment processing flow, user subscription triggers, and technical implementation details.

### Document Information
- **Created Date**: 2025-07-19
- **Version**: 1.0
- **Related Requirement**: SF05 - Polar Payment System Integration
- **Maintainer**: Development Team

## 🎯 Integration Overview

### Completed Features

✅ **Polar SDK Integration**: Successfully integrated @polar-sh/sdk package  
✅ **Checkout Flow**: Implemented complete subscription upgrade payment flow  
✅ **Webhook Processing**: Automatic subscription status sync to Supabase database  
✅ **Frontend Integration**: Subscription management page supports real upgrade operations  
✅ **Security Verification**: Webhook signature verification ensures data security  
✅ **Error Handling**: Comprehensive error handling and user feedback mechanisms  

### Core Features

- **Seamless Integration**: Perfect integration with existing Clerk authentication and Supabase database
- **Real-time Sync**: Webhook events instantly update user subscription status
- **Secure & Reliable**: Complete signature verification and error handling mechanisms
- **User-Friendly**: Intuitive upgrade flow and clear status feedback
- **Scalable**: Modular design for easy addition of more payment plans

## 🏗️ Technical Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Polar Service │
│   (Next.js)     │    │                 │    │                 │
│ • Subscription  │◄──►│ • Checkout API  │◄──►│ • Payment       │
│   Management    │    │ • Webhook       │    │   Processing    │
│ • Upgrade Button│    │   Handler       │    │ • Subscription  │
│ • Status Display│    │ • Status Sync   │    │   Management    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Clerk Auth    │    │   Supabase DB   │    │   Webhook       │
│                 │    │                 │    │   Events        │
│ • User Identity │    │ • User Profiles │    │ • Status Updates│
│ • Session Mgmt  │    │ • Subscription  │    │ • Event Logging │
│ • Route         │    │   Data          │    │ • Retry Logic   │
│   Protection    │    │ • Audit Trail   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install @polar-sh/sdk
```

### 2. Environment Variables Setup

Add to your `.env.local` file:

```env
# Polar Configuration
POLAR_ACCESS_TOKEN=polar_at_your_access_token
POLAR_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID=your_pro_product_id

# Webhook URLs (for production)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Polar Dashboard Configuration

1. **Create Account**
   - Go to [Polar](https://polar.sh/)
   - Create an account and complete verification
   - Set up your organization

2. **Create Product**
   - Navigate to Products section
   - Create a new product: "Pro Plan"
   - Set price: $5.00 USD
   - Set billing interval: Monthly
   - Copy the Product ID

3. **Generate API Keys**
   - Go to Settings → API Keys
   - Create a new access token
   - Copy the token (keep it secure!)

4. **Configure Webhooks**
   - Go to Settings → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/polar`
   - Subscribe to events:
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
   - Copy the webhook secret

## 🔧 Implementation

### Polar Client Configuration

Create `src/lib/polar.ts`:

```typescript
import { Polar } from '@polar-sh/sdk'

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
})

export const POLAR_CONFIG = {
  PRO_PRODUCT_ID: process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID!,
}
```

### Checkout API Route

Create `src/app/api/polar/create-checkout/route.ts`:

```typescript
import { auth } from '@clerk/nextjs/server'
import { polar, POLAR_CONFIG } from '@/lib/polar'
import { UserProfileService } from '@/lib/userProfileService'

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const userProfile = await UserProfileService.getUserProfile(userId)
    if (!userProfile) {
      return Response.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Create checkout session
    const checkout = await polar.checkouts.create({
      productId: POLAR_CONFIG.PRO_PRODUCT_ID,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/checkout-success`,
      customerEmail: userProfile.email,
      metadata: {
        clerk_user_id: userId,
      },
    })

    return Response.json({ 
      checkoutUrl: checkout.url 
    })
  } catch (error) {
    console.error('Checkout creation error:', error)
    return Response.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
```

### Webhook Handler

Create `src/app/api/webhooks/polar/route.ts`:

```typescript
import { headers } from 'next/headers'
import { UserProfileService } from '@/lib/userProfileService'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('polar-webhook-signature')

    if (!signature) {
      return new Response('Missing signature', { status: 400 })
    }

    // Verify webhook signature
    const secret = process.env.POLAR_WEBHOOK_SECRET!
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      return new Response('Invalid signature', { status: 400 })
    }

    const event = JSON.parse(body)
    
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data)
        break
      
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data)
        break
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal error', { status: 500 })
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  const clerkUserId = subscription.metadata?.clerk_user_id
  
  if (!clerkUserId) {
    console.error('No clerk_user_id in subscription metadata')
    return
  }

  const status = mapPolarStatusToLocal(subscription)
  
  await UserProfileService.updateSubscription(clerkUserId, {
    subscription_plan: 'pro',
    subscription_status: status,
    polar_customer_id: subscription.customerId,
    polar_subscription_id: subscription.id,
    current_period_end: subscription.currentPeriodEnd,
    cancel_at_period_end: subscription.cancelAtPeriodEnd || false,
  })
}

async function handleSubscriptionCanceled(subscription: any) {
  const clerkUserId = subscription.metadata?.clerk_user_id
  
  if (!clerkUserId) {
    console.error('No clerk_user_id in subscription metadata')
    return
  }

  await UserProfileService.updateSubscription(clerkUserId, {
    subscription_plan: null,
    subscription_status: 'inactive',
    cancel_at_period_end: false,
  })
}

function mapPolarStatusToLocal(subscription: any): 'active_recurring' | 'active_ending' | 'inactive' {
  if (subscription.status === 'active') {
    return subscription.cancelAtPeriodEnd ? 'active_ending' : 'active_recurring'
  }
  return 'inactive'
}
```

### Frontend Integration

Update subscription management page:

```typescript
// src/app/dashboard/subscription/page.tsx
'use client'

import { useState } from 'react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { Button } from '@/components/ui/button'

export default function SubscriptionPage() {
  const { profile, loading, refreshProfile } = useUserProfile()
  const [upgrading, setUpgrading] = useState(false)

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const response = await fetch('/api/polar/create-checkout', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to create checkout')
      }
      
      const { checkoutUrl } = await response.json()
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to start upgrade process')
    } finally {
      setUpgrading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return
    }

    try {
      const response = await fetch('/api/polar/cancel-subscription', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }
      
      await refreshProfile()
      alert('Subscription canceled successfully')
    } catch (error) {
      console.error('Cancel error:', error)
      alert('Failed to cancel subscription')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const hasProAccess = profile?.subscription_status === 'active_recurring' || 
                      profile?.subscription_status === 'active_ending'

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
        
        {hasProAccess ? (
          <div>
            <p className="text-green-600 font-medium">Pro Plan - $5/month</p>
            <p className="text-sm text-gray-600 mt-1">
              Status: {profile?.subscription_status === 'active_recurring' 
                ? 'Active (Auto-renewing)' 
                : 'Active (Ending soon)'}
            </p>
            {profile?.current_period_end && (
              <p className="text-sm text-gray-600">
                Next billing: {new Date(profile.current_period_end).toLocaleDateString()}
              </p>
            )}
            
            {profile?.subscription_status === 'active_recurring' && (
              <Button 
                onClick={handleCancelSubscription}
                variant="outline"
                className="mt-4"
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-600">Free Plan</p>
            <p className="text-sm text-gray-500 mt-1">
              Upgrade to Pro for advanced features
            </p>
            
            <Button 
              onClick={handleUpgrade}
              disabled={upgrading}
              className="mt-4"
            >
              {upgrading ? 'Processing...' : 'Upgrade to Pro - $5/month'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
```

## 🔒 Security Best Practices

### Webhook Security
- Always verify webhook signatures
- Use HTTPS endpoints only
- Implement idempotency for webhook processing
- Log all webhook events for debugging

### API Security
- Validate user authentication on all endpoints
- Sanitize and validate all input data
- Use environment variables for sensitive data
- Implement rate limiting

### Error Handling
- Never expose internal errors to users
- Log detailed errors for debugging
- Provide meaningful error messages
- Implement retry logic for failed operations

## 🐛 Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify webhook secret is correct
   - Check Polar dashboard for delivery attempts

2. **Signature verification fails**
   - Ensure webhook secret matches
   - Check request body is not modified
   - Verify HMAC calculation

3. **Checkout creation fails**
   - Verify product ID is correct
   - Check API token permissions
   - Ensure user profile exists

### Debug Tips

- Enable webhook logging in Polar dashboard
- Use ngrok for local webhook testing
- Check browser network tab for API errors
- Monitor Supabase logs for database issues

---

**Document Version**: 1.0  
**Last Updated**: 2025-07-22  
**Maintainer**: Development Team
