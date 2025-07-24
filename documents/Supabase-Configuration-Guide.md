---
uuid: bab7e9e4edc1457e8ba335edcfb99ca7
---
# Supabase Configuration Guide

## 📋 What is Supabase?

Supabase is an open-source Firebase alternative that provides developers with a complete Backend-as-a-Service (BaaS) solution. Built on PostgreSQL database, it offers real-time subscriptions, authentication, instant APIs, file storage, and more.

### 🎯 Key Advantages

- **🗄️ Powerful Database**: Built on PostgreSQL, complete and stable functionality
- **🔐 Built-in Security**: Row Level Security (RLS) provides fine-grained permission control
- **⚡ Real-time Features**: WebSocket real-time data sync and low-latency updates
- **🚀 Developer Experience**: Auto-generated RESTful APIs, type-safe TypeScript support
- **💰 Cost Effective**: Generous free tier, transparent pricing model
- **🔧 Developer Friendly**: Rich client SDKs and comprehensive documentation

### 🏗️ Use Cases

- **SaaS Applications**: Complete user data management and subscription functionality
- **Real-time Applications**: Chat rooms, collaboration tools, real-time dashboards
- **E-commerce Platforms**: Product management, order processing, user data
- **Content Management Systems**: Article and media file storage and management

## 🚀 Quick Start

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **"New Project"** to create a new project
3. Fill in project information:
   - **Organization**: Select or create organization
   - **Name**: Enter project name
   - **Database Password**: Set database password (save securely)
   - **Region**: Choose region closest to users (recommended: Asia-Pacific)
4. Click **"Create new project"** to complete creation
5. Wait for project initialization (approximately 2-3 minutes)

### Step 2: Get API Keys and Project URL

#### 2.1 Get Project URL
1. In the project Dashboard, go to **Settings** → **Data API**
2. In the **Project URL** section, copy the complete URL:
   - Format: `https://your-project-id.supabase.co`

#### 2.2 Get API Keys
1. In the project Dashboard, go to **Settings** → **API Keys**
2. Copy the following two keys:
   - **anon public**: Anonymous public key (frontend use)
   - **service_role**: Service role key (backend use, full permissions)

**Important Security Notes**:
- `anon public` key can be used in frontend, controlled by RLS permissions
- `service_role` key has full database permissions, **must never be exposed in frontend code**

### Step 3: Environment Variables Setup

Add to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key_here
```

### Step 4: Create Database Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy and execute the following complete SQL script:

```sql
-- =====================================================
-- Next-Clerk-Polar-Supabase Non-Destructive Database Setup Script
-- =====================================================
-- Created: 2025-07-21
-- Version: 5.1 (Non-destructive version)

-- =====================================================
-- 1. Safety Check & Notice
-- =====================================================

-- This script is designed to be non-destructive and will not delete existing data
-- If you need to completely rebuild, please manually execute DROP TABLE commands

-- =====================================================
-- 2. Create Main Table (If Not Exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  -- Basic identification fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Simplified subscription status fields
  subscription_status VARCHAR(20) DEFAULT 'inactive' NOT NULL,
  subscription_plan VARCHAR(20) DEFAULT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Other business fields
  monthly_usage_limit INTEGER DEFAULT 1000,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Polar payment system integration fields
  polar_customer_id VARCHAR(255),
  polar_subscription_id VARCHAR(255),
  
  -- System tracking fields
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. Safely Add Constraints (If Not Exists)
-- =====================================================

-- Check and add subscription status constraint
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_subscription_status' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT valid_subscription_status 
        CHECK (subscription_status IN ('active_recurring', 'active_ending', 'inactive'));
    END IF;
END $;

-- Check and add subscription plan constraint
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_subscription_plan' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT valid_subscription_plan 
        CHECK (subscription_plan IS NULL OR subscription_plan = 'pro');
    END IF;
END $;

-- Check and add monthly usage limit constraint
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'positive_monthly_usage_limit' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT positive_monthly_usage_limit 
        CHECK (monthly_usage_limit > 0);
    END IF;
END $;

-- Check and add business logic constraint
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'active_status_requires_plan' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT active_status_requires_plan 
        CHECK (
          (subscription_status = 'inactive' AND subscription_plan IS NULL) OR
          (subscription_status IN ('active_recurring', 'active_ending') AND subscription_plan IS NOT NULL)
        );
    END IF;
END $;

-- =====================================================
-- 4. Safely Create Indexes (If Not Exists)
-- =====================================================

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_user_id ON user_profiles (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles (subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_plan ON user_profiles (subscription_plan);
CREATE INDEX IF NOT EXISTS idx_subscription_status_plan ON user_profiles (subscription_status, subscription_plan);

-- Unique indexes (need special handling)
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_polar_customer_id'
    ) THEN
        CREATE UNIQUE INDEX idx_polar_customer_id 
        ON user_profiles (polar_customer_id) 
        WHERE polar_customer_id IS NOT NULL;
    END IF;
END $;

DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_polar_subscription_id'
    ) THEN
        CREATE UNIQUE INDEX idx_polar_subscription_id 
        ON user_profiles (polar_subscription_id) 
        WHERE polar_subscription_id IS NOT NULL;
    END IF;
END $;

-- =====================================================
-- 5. Safely Enable Row Level Security
-- =====================================================

-- Enable RLS (if not already enabled)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. Safely Create or Replace Policies
-- =====================================================

-- Drop existing policies and recreate them (ensure latest version)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT 
  USING (auth.uid()::text = clerk_user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE 
  USING (auth.uid()::text = clerk_user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid()::text = clerk_user_id);

DROP POLICY IF EXISTS "Service role can insert profile" ON user_profiles;
CREATE POLICY "Service role can insert profile" ON user_profiles
  FOR INSERT
  TO public
  WITH CHECK (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
CREATE POLICY "Service role full access" ON user_profiles
  FOR ALL 
  USING (current_setting('role') = 'service_role');

-- =====================================================
-- 7. Safely Create Trigger Function and Triggers
-- =====================================================

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Safely create trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. Set Permissions
-- =====================================================

-- Grant permissions (will not override existing permissions)
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- =====================================================
-- 9. Completion Notice
-- =====================================================

DO $
BEGIN
    RAISE NOTICE 'Non-destructive database script completed successfully!';
    RAISE NOTICE '- Table created or confirmed to exist';
    RAISE NOTICE '- Constraints safely added';
    RAISE NOTICE '- Indexes created';
    RAISE NOTICE '- RLS policies updated';
    RAISE NOTICE '- Triggers configured';
    RAISE NOTICE '- Permissions granted';
END $;
```

4. Click **"Run"** to execute SQL
5. After successful execution, go to **Table Editor** to view the created tables

**Execution Verification**:
- After SQL execution, you'll see execution results and success messages below
- Go to **Table Editor** in the left menu, you should see the newly created `user_profiles` table
- Click the table name to view table structure, field definitions, and constraints
- In the **Policies** tab, confirm that Row Level Security policies are correctly created

**Important Notes**:
- Includes complete constraints, indexes, and security settings
- Uses simplified subscription logic: `inactive`, `active_recurring`, `active_ending`
- Please ensure important data is backed up before execution
- If in doubt, please test in a test environment first

### Step 5: Install Dependencies

```bash
npm install @supabase/supabase-js
```

### Step 6: Client Configuration

**The project has pre-configured Supabase client** located at `src/lib/supabase.ts`, including:

- **Frontend Client**: Uses anon key, controlled by RLS permissions
- **Backend Admin Client**: Uses service role key, has full database permissions

## 🧪 Testing & Verification

### Testing Checklist

#### Database Connection Tests
- [ ] Successfully connect to Supabase project
- [ ] Frontend client works properly
- [ ] Backend admin client works properly
- [ ] Environment variables load correctly

#### Data Table Operation Tests
- [ ] Can successfully create user data
- [ ] Can read user subscription data
- [ ] Can update subscription plans and status
- [ ] Constraints work correctly

#### Integration Tests
- [ ] New user registration automatically creates subscription record
- [ ] Dashboard correctly displays user data
- [ ] Polar payment system fields update correctly
- [ ] Error handling works appropriately

#### Security Tests
- [ ] RLS policies correctly restrict data access
- [ ] Cannot directly access other users' data
- [ ] API key security confirmed
- [ ] Frontend doesn't expose sensitive information

### Testing Steps

#### 1. Basic Connection Test
```bash
# Execute in browser console
fetch('/api/user/subscription')
  .then(res => res.json())
  .then(console.log);
```

#### 2. User Registration Flow Test
- Register new user account
- Check if `user_profiles` record is automatically created in Supabase
- Confirm default values (free plan, active status) are correct

#### 3. Dashboard Data Display Test
- Login and access user dashboard
- Confirm real subscription data is displayed
- Test data update functionality

## 📚 Related Resources

- [Supabase Official Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)