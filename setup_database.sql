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
DO $$
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
END $$;

-- Check and add subscription plan constraint
DO $$
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
END $$;

-- Check and add monthly usage limit constraint
DO $$
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
END $$;

-- Check and add business logic constraint
DO $$
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
END $$;

-- =====================================================
-- 4. Safely Create Indexes (If Not Exists)
-- =====================================================

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_user_id ON user_profiles (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles (subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_plan ON user_profiles (subscription_plan);
CREATE INDEX IF NOT EXISTS idx_subscription_status_plan ON user_profiles (subscription_status, subscription_plan);

-- Unique indexes (need special handling)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_polar_customer_id'
    ) THEN
        CREATE UNIQUE INDEX idx_polar_customer_id 
        ON user_profiles (polar_customer_id) 
        WHERE polar_customer_id IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_polar_subscription_id'
    ) THEN
        CREATE UNIQUE INDEX idx_polar_subscription_id 
        ON user_profiles (polar_subscription_id) 
        WHERE polar_subscription_id IS NOT NULL;
    END IF;
END $$;

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
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

DO $$
BEGIN
    RAISE NOTICE 'Non-destructive database script completed successfully!';
    RAISE NOTICE '- Table created or confirmed to exist';
    RAISE NOTICE '- Constraints safely added';
    RAISE NOTICE '- Indexes created';
    RAISE NOTICE '- RLS policies updated';
    RAISE NOTICE '- Triggers configured';
    RAISE NOTICE '- Permissions granted';
END $$;