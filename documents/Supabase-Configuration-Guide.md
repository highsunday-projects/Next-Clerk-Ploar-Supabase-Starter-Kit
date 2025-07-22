---
uuid: bab7e9e4edc1457e8ba335edcfb99ca7
---
# Supabase Database Configuration Guide

## 📋 Document Overview

This document provides detailed instructions on how to configure and use Supabase database in the Next-Clerk-Polar-Supabase Starter Kit, including complete setup steps, database structure design, and best practices.

### Document Information
- **Created**: 2025-07-22
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
│   ├── user/subscription/route.ts     # Subscription data API routes
│   └── webhooks/clerk/route.ts        # Clerk Webhook handler
└── .env.local                         # Environment variables
```

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project" to create a new project
3. Select organization and set project name
4. Choose database region (recommend closest to users)
5. Set database password (save securely)
6. Wait for project creation to complete

### 2. Get API Keys

In the project Dashboard:
1. Go to **Settings** → **API**
2. Copy the following keys:
   - **Project URL**: Project API endpoint
   - **anon public**: Anonymous public key (frontend use)
   - **service_role**: Service role key (backend use, full permissions)

### 3. Environment Variables Setup

Configure in `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key_here
```

### 4. Create Database Tables

Execute the following SQL in Supabase SQL Editor:

```sql
-- Create user subscription data table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  subscription_plan VARCHAR(20) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',

  -- Polar payment system integration fields
  polar_customer_id VARCHAR(255),           -- Polar customer ID
  polar_subscription_id VARCHAR(255),       -- Polar subscription ID
  current_period_end TIMESTAMP WITH TIME ZONE, -- Current billing period end time
  cancel_at_period_end BOOLEAN DEFAULT FALSE,   -- Cancel at period end

  monthly_usage_limit INTEGER DEFAULT 1000,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription plan check constraints
ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_plan
CHECK (subscription_plan IN ('free', 'pro', 'enterprise'));

ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_status
CHECK (subscription_status IN ('active', 'trial', 'cancelled', 'expired'));

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create security policies (temporarily allow all operations)
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (true);
```

### 5. Install Dependencies

```bash
npm install @supabase/supabase-js svix
```

## 📖 Detailed Configuration Guide

### Supabase Client Configuration

`src/lib/supabase.ts` provides two client instances:

```typescript
// Client instance (frontend use)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin instance (backend use)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
```

### User Subscription Data Service

`src/lib/userProfileService.ts` provides complete CRUD operations:

- `getUserProfile(clerkUserId)`: Get user subscription data
- `createUserProfile(data)`: Create new subscription record
- `updateUserProfile(clerkUserId, data)`: Update subscription data
- `updateLastActiveDate(clerkUserId)`: Update last active time
- `getOrCreateUserProfile(clerkUserId)`: Get or create subscription record

### API Routes

`src/app/api/user/subscription/route.ts` provides RESTful API:

- `GET /api/user/subscription`: Get current user subscription data
- `POST /api/user/subscription`: Create new subscription record
- `PATCH /api/user/subscription`: Update subscription data

### Clerk Webhook Integration

`src/app/api/webhooks/clerk/route.ts` handles user events:

- `user.created`: Automatically create free plan subscription record
- `user.updated`: Update last active time
- `user.deleted`: Log user deletion event

## 🔐 Security Configuration

### Row Level Security (RLS)

Currently using basic RLS policies allowing all operations. Future implementation can use Clerk JWT for more granular permission control:

```sql
-- Advanced security policy example (future implementation)
CREATE POLICY "Users can only access own data" ON user_profiles
  FOR ALL USING (auth.jwt() ->> 'sub' = clerk_user_id);
```

### Environment Variable Security

- ✅ Use `.env.local` to store sensitive information
- ✅ Don't commit `.env.local` to version control
- ✅ Use different keys for production environment
- ✅ Regularly rotate API keys

## 🧪 Testing Guide

### Functionality Test Checklist

- [ ] **Database Connection**: Successfully connect to Supabase
- [ ] **User Registration**: Auto-create subscription record for new users
- [ ] **Data Reading**: Correctly read user subscription data
- [ ] **Data Updates**: Update subscription plans and status
- [ ] **Webhook Processing**: Clerk events correctly trigger database operations
- [ ] **Error Handling**: Properly handle database errors and connection issues

### Testing Steps

1. **Connection Test**
   ```bash
   # Test in browser console
   fetch('/api/user/subscription')
     .then(res => res.json())
     .then(console.log);
   ```

2. **Registration Flow Test**
   - Register new user
   - Check if subscription record is auto-created in Supabase
   - Confirm default is free plan

3. **Dashboard Display Test**
   - Login user
   - Check if Dashboard displays real subscription data
   - Confirm data format is correct

## 🔧 Troubleshooting

### Common Issues

**Q: Cannot connect to Supabase**
A: Check the following:
- Environment variables are correctly set
- Supabase project is running normally
- Network connection is stable
- API keys are valid

**Q: Database operations fail**
A: Check:
- SQL tables are correctly created
- RLS policies are correctly set
- Data format meets constraint conditions

**Q: Webhooks don't trigger**
A: Confirm:
- Clerk Webhook settings are correct
- Webhook URL is accessible
- Webhook secret is correct

**Q: Permission errors**
A: Check:
- Using correct client instance
- RLS policies allow operations
- User authentication is correct

## 📈 Performance Optimization

### Query Optimization
- Use appropriate indexes
- Limit query result count
- Use select to specify needed fields

### Connection Management
- Reuse client instances
- Properly handle connection errors
- Use connection pooling (production environment)

### Caching Strategy
- Implement appropriate data caching
- Use React Query or SWR
- Avoid unnecessary duplicate queries

## 🔮 Future Extensions

### Advanced Features
- Real-time data synchronization
- Advanced permission control
- Data analytics and reporting
- Automatic backup and recovery

### Integration Preparation
- **Polar**: ✅ Payment subscription status sync (integrated)
- **Analytics**: Usage statistics tracking
- **Notifications**: Subscription status change notifications

### Polar Payment System Integration
- **polar_customer_id**: Store Polar customer identifier
- **polar_subscription_id**: Store Polar subscription identifier
- **current_period_end**: Track billing period end time
- **cancel_at_period_end**: Manage subscription cancellation status

## 📚 Reference Resources

- [Supabase Official Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

---

**Document Version**: 1.1
**Last Updated**: 2025-07-22
**Maintainer**: Development Team
**Update Content**: Integrated Polar payment system fields
