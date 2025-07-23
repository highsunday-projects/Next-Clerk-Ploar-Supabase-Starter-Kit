---
title: Polar Configuration and Setup Guide
author: Development Team
date: '2025-07-22'
version: 1.0
uuid: 4a685a211cbf49eda57233db9e1dee50
---

# Polar Configuration and Setup Guide

## 📋 Document Overview

This document provides detailed instructions on how to configure the Polar payment platform, including account setup, product creation, API configuration, and environment preparation.

### Document Information
- **Created**: 2025-07-22
- **Version**: 1.0
- **Related Feature**: SF05 - Polar Payment System Integration
- **Maintainer**: Development Team

## 🎯 Preparation Checklist

Before starting integration, ensure you complete the following preparation work:

- [ ] Create Polar account
- [ ] Set up organization and products
- [ ] Obtain API keys
- [ ] Configure Webhooks
- [ ] Update environment variables
- [ ] Execute database migration

## 🚀 Step 1: Create Polar Account

### 1.1 Register Polar Account

1. Go to [Polar.sh](https://polar.sh)
2. Click "Sign Up" to register new account
3. Use GitHub or Google account for quick registration
4. Complete email verification

### 1.2 Choose Environment

Polar provides two environments:

- **Sandbox**: Testing environment for development and testing
- **Production**: Live environment for actual operations

**Recommended Flow**:
1. Complete integration and testing in Sandbox environment first
2. Switch to Production after confirming functionality works

## 🏢 Step 2: Set Up Organization

### 2.1 Create Organization

1. Login to Polar Dashboard
2. Click "Create Organization"
3. Fill in organization information:
   - **Organization Name**: Your company or project name
   - **Organization Slug**: URL-friendly identifier
   - **Description**: Brief organization description

### 2.2 Organization Settings

After creating organization, record the following information:
- **Organization ID**: `org_xxxxxxxxxx`
- **Organization Slug**: Your set slug

## 📦 Step 3: Create Products and Plans

### 3.1 Create Products

Based on our subscription plans, need to create the following products:

#### Pro Plan
```
Product Name: Pro Plan
Description: Perfect for growing teams and businesses
Price: $29 USD / month
Features:
- 10,000 API calls/month
- Advanced feature access
- Priority support
- Detailed analytics
```

#### Enterprise Plan
```
Product Name: Enterprise Plan
Description: Perfect for large enterprises and high-traffic applications
Price: $99 USD / month
Features:
- 100,000 API calls/month
- All feature access
- 24/7 dedicated support
- Custom integrations
- Advanced analytics
```

### 3.2 Creation Steps

1. In Polar Dashboard click "Products"
2. Click "Create Product"
3. Fill in product information:
   - **Name**: As per plan names above
   - **Description**: Detailed plan description
   - **Type**: Select "Subscription"
4. Set pricing:
   - **Amount**: 29 or 99
   - **Currency**: USD
   - **Billing Period**: Monthly
5. Save product

### 3.3 Record Product IDs

After creation, record each product's ID:
- **Pro Plan Product ID**: `prod_xxxxxxxxxx`
- **Enterprise Plan Product ID**: `prod_xxxxxxxxxx`

## 🔑 Step 4: Obtain API Keys

### 4.1 Create API Token

1. Go to Polar Dashboard "Settings" > "API"
2. Click "Create API Token"
3. Set permissions:
   - **Name**: "SaaS App Integration"
   - **Permissions**: Select required permissions (recommend full permissions)
4. Copy and securely save API Token

### 4.2 API Token Format

- **Sandbox**: `polar_pat_sandbox_xxxxxxxxxx`
- **Production**: `polar_pat_xxxxxxxxxx`

## 🔗 Step 5: Configure Webhook

### 5.1 Create Webhook

1. In Polar Dashboard go to "Settings" > "Webhooks"
2. Click "Create Webhook"
3. Configure Webhook:
   - **URL**: `https://yourdomain.com/api/webhooks/polar`
   - **Events**: Select the following events
     - `checkout.created`
     - `checkout.updated`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`

### 5.2 Webhook Secret

After creating Webhook, Polar will provide a Secret:
- **Format**: `polar_wh_xxxxxxxxxx`
- **Purpose**: Verify authenticity of Webhook requests

## ⚙️ Step 6: Environment Variables Configuration

### 6.1 Update .env.local

Add the following environment variables to your `.env.local` file:

```env
# Polar Configuration
POLAR_ACCESS_TOKEN=polar_pat_sandbox_xxxxxxxxxx
POLAR_WEBHOOK_SECRET=polar_wh_xxxxxxxxxx
POLAR_ORGANIZATION_ID=org_xxxxxxxxxx
NEXT_PUBLIC_POLAR_ENVIRONMENT=sandbox

# Polar Product IDs
POLAR_PRO_PRODUCT_ID=prod_xxxxxxxxxx
POLAR_ENTERPRISE_PRODUCT_ID=prod_xxxxxxxxxx
```

### 6.2 Environment Variables Description

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `POLAR_ACCESS_TOKEN` | Polar API access token | `polar_pat_sandbox_xxx` |
| `POLAR_WEBHOOK_SECRET` | Webhook signature verification key | `polar_wh_xxx` |
| `POLAR_ORGANIZATION_ID` | Organization ID | `org_xxx` |
| `NEXT_PUBLIC_POLAR_ENVIRONMENT` | Environment setting | `sandbox` or `production` |
| `POLAR_PRO_PRODUCT_ID` | Pro plan product ID | `prod_xxx` |
| `POLAR_ENTERPRISE_PRODUCT_ID` | Enterprise plan product ID | `prod_xxx` |

## 🗄️ Step 7: Database Migration

### 7.1 Execute SQL Migration

Execute the following script in Supabase Dashboard SQL Editor:

```sql
-- Add Polar related fields
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS polar_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS polar_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS polar_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_polar_customer_id 
ON user_profiles(polar_customer_id);
```

### 7.2 Verify Migration

Execute the following query to confirm fields were successfully added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name LIKE 'polar_%';
```

## 🧪 Step 8: Test Configuration

### 8.1 Test API Connection

```bash
# Test API connection
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/organizations/YOUR_ORG_ID
```

### 8.2 Test Product Retrieval

```bash
# Test product list
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/products?organization_id=YOUR_ORG_ID
```

### 8.3 Test Webhook

Use ngrok or similar tool to test local Webhook:

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3000

# Update Polar Webhook URL to ngrok provided URL
# Example: https://abc123.ngrok.io/api/webhooks/polar
```

## 🔒 Security Considerations

### 9.1 API Key Security

- ✅ Use environment variables to store sensitive information
- ✅ Don't commit API keys to version control
- ✅ Regularly rotate API keys
- ✅ Use principle of least privilege

### 9.2 Webhook Security

- ✅ Verify Webhook signatures
- ✅ Use HTTPS endpoints
- ✅ Implement retry mechanisms
- ✅ Log all Webhook events

## 🚀 Step 9: Deployment Preparation

### 9.1 Production Environment Switch

When ready to go live, need to:

1. Repeat above steps in Polar Production environment
2. Update environment variables:
   ```env
   POLAR_ACCESS_TOKEN=polar_pat_xxxxxxxxxx  # Remove sandbox
   NEXT_PUBLIC_POLAR_ENVIRONMENT=production
   ```
3. Update Webhook URL to official domain
4. Test complete payment flow

### 9.2 Go-Live Checklist

- [ ] Production API keys configured
- [ ] Webhook URL points to production environment
- [ ] Product prices and descriptions correct
- [ ] Payment flow fully functional
- [ ] Customer support process ready

## 📞 Support and Resources

### Official Resources

- **Polar Documentation**: https://docs.polar.sh
- **API Reference**: https://docs.polar.sh/api
- **SDK Documentation**: https://docs.polar.sh/sdk

### Community Support

- **Discord**: Polar official Discord community
- **GitHub**: Polar SDK and example projects

## 🎉 Completion Confirmation

After completing all configuration, you should be able to:

- ✅ See organization and products in Polar Dashboard
- ✅ API test calls succeed
- ✅ Webhook correctly receives events
- ✅ Environment variables correctly set
- ✅ Database structure updated

---

**Document Version**: 1.0  
**Last Updated**: 2025-07-22  
**Maintainer**: Development Team  
**Status**: ✅ Setup Complete
