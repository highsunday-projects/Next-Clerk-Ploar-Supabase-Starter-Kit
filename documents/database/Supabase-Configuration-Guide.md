---
uuid: 67788ca7519847f987aeca941f96dcd0
---
# Supabase Configuration and Usage Guide

**Language**: [English](Supabase-Configuration-Guide.md) | [繁體中文](../Supabase配置與使用說明.md)

## 📋 Document Overview

This document provides detailed instructions on how to configure and use Supabase database in the Next-Clerk-Polar-Supabase Starter Kit, including complete setup steps, database structure design, and best practices.

### Document Information
- **Created Date**: 2025-07-17
- **Version**: 1.0
- **Scope**: Next.js 15.4.1 + Supabase
- **Maintainer**: Development Team

## 🎯 Integration Goals

- ✅ Establish Supabase project and database connection
- ✅ Design user subscription data table structure
- ✅ Implement CRUD operations for user subscription data
- ✅ Integrate Clerk authentication system with Supabase
- ✅ Provide secure data access control

## 🛠️ Technical Architecture

### Core Components
- **@supabase/supabase-js**: Supabase JavaScript client SDK
- **PostgreSQL**: Powerful relational database
- **Row Level Security (RLS)**: Data security control
- **Real-time**: Real-time data synchronization

### File Structure
```
src/
├── lib/
│   ├── supabase.ts                    # Supabase client configuration
│   └── userProfileService.ts          # User subscription data service
├── types/
│   └── supabase.ts                    # TypeScript type definitions
├── hooks/
│   └── useUserProfile.ts              # User subscription data Hook
├── app/api/
│   ├── user/subscription/route.ts     # Subscription data API route
│   └── webhooks/clerk/route.ts        # Clerk Webhook handler
└── .env.local                         # Environment variables
```

## 🚀 Quick Start

### 1. Create Supabase Project

1. **Sign up for Supabase**
   - Go to [Supabase](https://supabase.com/)
   - Create a new account or sign in
   - Click "New Project"

2. **Project Configuration**
   - Choose your organization
   - Enter project name: `next-clerk-polar-starter`
   - Set a strong database password
   - Select a region close to your users
   - Click "Create new project"

3. **Get API Keys**
   - Go to Settings → API
   - Copy the `Project URL` and `anon public` key
   - Copy the `service_role` key (keep this secret!)

### 2. Environment Variables Setup

Add to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 4. Database Schema Setup

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    subscription_plan TEXT CHECK (subscription_plan IN ('pro')) DEFAULT NULL,
    subscription_status TEXT CHECK (subscription_status IN ('active_recurring', 'active_ending', 'inactive')) DEFAULT 'inactive',
    polar_customer_id TEXT,
    polar_subscription_id TEXT,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role can manage all profiles" ON user_profiles
    FOR ALL USING (auth.role() = 'service_role');
```

## 🔧 Client Configuration

### Supabase Client Setup

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key
export function createServiceClient() {
  return createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

### TypeScript Types

Create `src/types/supabase.ts`:

```typescript
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          clerk_user_id: string
          email: string
          subscription_plan: 'pro' | null
          subscription_status: 'active_recurring' | 'active_ending' | 'inactive'
          polar_customer_id: string | null
          polar_subscription_id: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          email: string
          subscription_plan?: 'pro' | null
          subscription_status?: 'active_recurring' | 'active_ending' | 'inactive'
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          email?: string
          subscription_plan?: 'pro' | null
          subscription_status?: 'active_recurring' | 'active_ending' | 'inactive'
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type SubscriptionPlan = 'pro' | null
export type SubscriptionStatus = 'active_recurring' | 'active_ending' | 'inactive'
```

## 📊 Data Service Implementation

### User Profile Service

Create `src/lib/userProfileService.ts`:

```typescript
import { supabase, createServiceClient } from './supabase'
import { UserProfile } from '@/types/supabase'

export class UserProfileService {
  // Get user profile by Clerk user ID
  static async getUserProfile(clerkUserId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  // Create new user profile (server-side only)
  static async createUserProfile(profile: {
    clerk_user_id: string
    email: string
  }): Promise<UserProfile | null> {
    const serviceClient = createServiceClient()
    
    const { data, error } = await serviceClient
      .from('user_profiles')
      .insert({
        clerk_user_id: profile.clerk_user_id,
        email: profile.email,
        subscription_plan: null,
        subscription_status: 'inactive',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return null
    }

    return data
  }

  // Update subscription data (server-side only)
  static async updateSubscription(
    clerkUserId: string,
    updates: {
      subscription_plan?: 'pro' | null
      subscription_status?: 'active_recurring' | 'active_ending' | 'inactive'
      polar_customer_id?: string | null
      polar_subscription_id?: string | null
      current_period_end?: string | null
      cancel_at_period_end?: boolean
    }
  ): Promise<UserProfile | null> {
    const serviceClient = createServiceClient()
    
    const { data, error } = await serviceClient
      .from('user_profiles')
      .update(updates)
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription:', error)
      return null
    }

    return data
  }
}
```

### React Hook for User Profile

Create `src/hooks/useUserProfile.ts`:

```typescript
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { UserProfile } from '@/types/supabase'

export function useUserProfile() {
  const { user, isLoaded } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      if (!isLoaded || !user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/user/subscription')
        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }
        
        const data = await response.json()
        setProfile(data.profile)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, isLoaded])

  const refreshProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/user/subscription')
      if (!response.ok) {
        throw new Error('Failed to refresh profile')
      }
      
      const data = await response.json()
      setProfile(data.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    loading,
    error,
    refreshProfile,
  }
}
```

## 🔒 Security Configuration

### Row Level Security (RLS)

RLS ensures users can only access their own data:

```sql
-- Enable RLS on the table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Policy for users to update their own data
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Policy for service role (webhooks, admin operations)
CREATE POLICY "Service role can manage all profiles" ON user_profiles
    FOR ALL USING (auth.role() = 'service_role');
```

### API Route Security

Always verify user authentication in API routes:

```typescript
// src/app/api/user/subscription/route.ts
import { auth } from '@clerk/nextjs/server'
import { UserProfileService } from '@/lib/userProfileService'

export async function GET() {
  const { userId } = auth()
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await UserProfileService.getUserProfile(userId)
  
  return Response.json({ profile })
}
```

## 🔗 Integration with Clerk

### Webhook Handler

Create `src/app/api/webhooks/clerk/route.ts`:

```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { UserProfileService } from '@/lib/userProfileService'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local')
  }

  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', {
      status: 400
    })
  }

  const { id } = evt.data
  const eventType = evt.type

  if (eventType === 'user.created') {
    await UserProfileService.createUserProfile({
      clerk_user_id: id,
      email: evt.data.email_addresses[0]?.email_address || '',
    })
  }

  return new Response('', { status: 200 })
}
```

## 🐛 Troubleshooting

### Common Issues

1. **RLS blocking queries**
   - Ensure JWT contains correct user ID
   - Check policy conditions
   - Use service role for server-side operations

2. **Connection errors**
   - Verify environment variables
   - Check network connectivity
   - Ensure project is not paused

3. **Type errors**
   - Regenerate types after schema changes
   - Check TypeScript configuration
   - Verify import paths

### Debug Tips

- Use Supabase dashboard to test queries
- Enable logging in development
- Check browser network tab for API errors

---

**Document Version**: 1.0  
**Last Updated**: 2025-07-22  
**Maintainer**: Development Team
