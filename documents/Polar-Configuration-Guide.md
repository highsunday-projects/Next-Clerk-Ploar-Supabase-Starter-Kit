---
uuid: 3672b7fbe56f4a1880b5a0d27f7da0fe
---
# Polar Payment System Configuration Guide

## 📋 What is Polar?

Polar is a modern payment platform designed specifically for developers, providing comprehensive subscription management, billing, and payment processing solutions.

### 🎯 Key Advantages

- **💰 Developer-Friendly Pricing**: Low fees, transparent pricing structure
- **🚀 Quick Integration**: Complete SDK and API documentation for fast deployment
- **🔄 Subscription Management**: Flexible subscription plans, upgrades/downgrades, trial period management
- **📊 Detailed Analytics**: Revenue reports, customer insights, business metrics tracking
- **🛡️ Secure & Reliable**: Enterprise-grade security, PCI compliance, data encryption
- **🌐 Global Support**: Multi-currency, multi-language, international payment methods
- **🔧 Developer Tools**: Webhooks, testing environment, detailed logs

### 🏗️ Use Cases

- **SaaS Applications**: Monthly subscriptions, usage-based billing, enterprise plans
- **Digital Content Platforms**: Content subscriptions, one-time purchases, membership systems
- **Developer Tools**: API subscriptions, usage-based billing, freemium models
- **Online Services**: Professional services, course subscriptions, software licensing

## 🚀 Quick Start

### Step 1: Create Polar Account

1. Go to [Polar Sandbox](https://sandbox.polar.sh) **(Important: Start with Sandbox testing environment)**
2. Click "Sign Up" to register new account
3. Use GitHub or Google account for quick registration
4. Complete email verification

**Environment Description**:

Polar provides two environments:
- **Sandbox** (https://sandbox.polar.sh): Testing environment for development and testing, **recommended to start here**
- **Production** (https://polar.sh): Live environment for actual operations

**Important Reminders**:
- ✅ **Must complete all configuration and testing in Sandbox environment first**
- ✅ Switch to Production environment only after confirming all features work properly
- ⚠️ Never test or learn directly in Production environment

### Step 2: Set Up Organization

1. Login to Polar Dashboard
2. Click "Create Organization"
3. Fill in organization information:
   - **Organization Name**: Your company or project name
   - **Organization Slug**: URL-friendly identifier
   - **Description**: Brief organization description

After creating organization, record the following information:
- **Organization ID**: `12345678-abcd-1234-5678-123456789abc`
- **Organization Slug**: Your set slug

### Step 3: Create Products and Plans

Based on our subscription plans, need to create the following products:

#### Pro Plan
```
Product Name: Pro Plan
Description: Perfect for growing teams and businesses
Price: $5 USD / month
Features:
- 10,000 API calls/month
- Advanced feature access
- Priority support
- Detailed analytics
```

**Creation Steps**:

1. In Polar Dashboard click "Products"
2. Click "Create Product"
3. Fill in product information:
   - **Name**: As per plan names above
   - **Description**: Detailed plan description
   - **Type**: Select "Subscription"
4. Set pricing:
   - **Amount**: 5
   - **Currency**: USD
   - **Billing Period**: Monthly
5. Save product

After creation, record the product ID:
- **Pro Plan Product ID**: `prod_xxxxxxxxxx`

### Step 4: Obtain API Keys

1. In Polar Dashboard, go to **"Settings"** → **"General"** → **"Developers"**
2. In **"Manage access tokens to authenticate with the Polar API"** section
3. Click **"New Token"** to create new API Token
4. Set Token information:
   - **Name**: "SaaS App Integration"
   - **Permissions**: Select required permissions (recommend selecting all permissions)
5. Copy and securely save API Token

**API Token Format**:
- **Sandbox**: `polar_oat_xxxxxxxxxx`
- **Production**: `polar_oat_xxxxxxxxxx`

### Step 5: Configure Webhook

1. In Polar Dashboard go to "Settings" > "Webhooks"
2. Click "Create Webhook"
3. Configure Webhook:
   - **URL**: `https://yourdomain.com/api/webhooks/polar` **(Important: Must include `/api/webhooks/polar` path)**
   - **Events**: Check the following events
     - `checkout.created`
     - `order.created`
     - `order.paid`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.uncanceled`

**Webhook URL Description**:
- ✅ Correct format: `https://yourdomain.com/api/webhooks/polar`
- ✅ Development environment: `https://abc123.ngrok.io/api/webhooks/polar`
- ❌ Wrong format: `https://yourdomain.com` (missing path)
- ❌ Wrong format: `https://yourdomain.com/webhooks/polar` (incorrect path)

After creating Webhook, Polar will provide a Secret:
- **Format**: 32-character hexadecimal string (e.g., `a1b2c3d4e5f6789012345678901234ab`)
- **Purpose**: Verify authenticity of Webhook requests

**Development Environment Testing Instructions**:

Since Webhooks require public URLs, in development environment we use ngrok to expose local localhost to the internet for testing:

```bash
# 1. Install ngrok (if not already installed)
npm install -g ngrok

# 2. Start your development server
npm run dev  # Usually on port 3000

# 3. Start ngrok tunnel in another terminal window
ngrok http 3000

# 4. ngrok will provide a public URL, similar to:
# Forwarding    https://abc123.ngrok.io -> http://localhost:3000

# 5. Set the ngrok provided URL to Polar Webhook (Important: add /api/webhooks/polar)
# Example: https://abc123.ngrok.io/api/webhooks/polar
```

**Important Reminders**:
- ngrok will expose your localhost:3000 to the public internet
- Each restart of ngrok generates a new URL, requiring Polar Webhook settings update
- This is only for development testing, use real domain names for production environment

### Step 6: Environment Variables Configuration

Add the following environment variables to your `.env.local` file:

```env
# Polar Configuration
POLAR_ACCESS_TOKEN=polar_oat_xxxxxxxxxx
POLAR_WEBHOOK_SECRET=a1b2c3d4e5f6789012345678901234ab
POLAR_ORGANIZATION_ID=12345678-abcd-1234-5678-123456789abc
NEXT_PUBLIC_POLAR_ENVIRONMENT=sandbox

# Polar Product IDs  
NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID=prod_xxxxxxxxxx
```

**Environment Variables Description**:

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `POLAR_ACCESS_TOKEN` | Polar API access token | `polar_oat_xxx` |
| `POLAR_WEBHOOK_SECRET` | Webhook signature verification key | `a1b2c3d4e5f6789012345678901234ab` |
| `POLAR_ORGANIZATION_ID` | Organization ID | `12345678-abcd-1234-5678-123456789abc` |
| `NEXT_PUBLIC_POLAR_ENVIRONMENT` | Environment setting | `sandbox` or `production` |
| `NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID` | Pro plan product ID | `prod_xxx` |

### Step 7: Test Configuration

```bash
# Test API connection
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/organizations/YOUR_ORG_ID
```

**Test Product Retrieval**:

```bash
# Test product list
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/products?organization_id=YOUR_ORG_ID
```

**Test Webhook (using ngrok)**:

Since Webhooks require public URLs, in development environment we use ngrok to expose local localhost to the internet for testing:

```bash
# 1. Install ngrok (if not already installed)
npm install -g ngrok

# 2. Start your development server
npm run dev  # Usually on port 3000

# 3. Start ngrok tunnel in another terminal window
ngrok http 3000

# 4. ngrok will provide a public URL, similar to:
# Forwarding    https://abc123.ngrok.io -> http://localhost:3000

# 5. Set the ngrok provided URL to Polar Webhook (Important: add /api/webhooks/polar)
# Example: https://abc123.ngrok.io/api/webhooks/polar
```

**Important Notes**:
- ngrok will expose your localhost:3000 to the public internet
- Each restart of ngrok generates a new URL, requiring Polar Webhook settings update
- This is only for development testing, use real domain names for production environment

## 🎁 Recommended Configuration

### Basic Configuration (Suitable for most applications)

```
Environment Settings:
✅ Complete testing in Sandbox environment first
✅ Confirm all features work properly
✅ Then switch to Production environment

Product Settings:
✅ Pro Plan - $5 USD/month
✅ Clear feature descriptions
✅ Appropriate usage limits
```

### Advanced Configuration (Enterprise applications)

```
Security Considerations:
✅ Secure API key storage
✅ Webhook signature verification
✅ Regular key rotation
✅ Monitoring and logging

Business Processes:
✅ Complete testing procedures
✅ Error handling mechanisms  
✅ Customer support processes
✅ Data backup plans
```

### Production Environment Deployment

When ready to go live, need to complete the following steps:

1. Repeat above steps in Polar Production environment
2. Update environment variables:
   ```env
   POLAR_ACCESS_TOKEN=polar_oat_xxxxxxxxxx
   NEXT_PUBLIC_POLAR_ENVIRONMENT=production
   ```
3. Update Webhook URL to official domain
4. Test complete payment flow

## 🧪 Testing and Verification

### Test Checklist

#### Account and Organization Testing
- [ ] Successfully register Polar account
- [ ] Create organization and obtain Organization ID
- [ ] Product creation successful, obtain Product ID
- [ ] API Token correctly generated and saved

#### API Connection Testing
- [ ] API test calls successfully return organization information
- [ ] Product list API correctly returns product data
- [ ] Environment variables correctly loaded and used
- [ ] Sandbox and Production environments properly distinguished

#### Webhook Integration Testing
- [ ] Webhook URL configured correctly
- [ ] Test events can be triggered and received properly
- [ ] Webhook signature verification works normally
- [ ] Local development environment ngrok testing successful

#### Database Integration Testing  
- [ ] Supabase database migration executed successfully
- [ ] Polar related fields correctly created and indexed
- [ ] User data and Polar customer ID correctly associated
- [ ] Subscription status update mechanism works normally

#### Security Testing
- [ ] API keys securely stored, not exposed in frontend
- [ ] Webhook Secret correctly configured and verified
- [ ] Environment variables security check
- [ ] Production environment configuration isolated from test environment

### Testing Steps

#### 1. Basic API Connection Testing
```bash
# Test organization information
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/organizations/YOUR_ORG_ID

# Test product list
curl -H "Authorization: Bearer YOUR_POLAR_ACCESS_TOKEN" \
     https://sandbox-api.polar.sh/v1/products?organization_id=YOUR_ORG_ID
```

#### 2. Local Webhook Testing (using ngrok)
```bash
# 1. Ensure development server is running
npm run dev

# 2. Start ngrok in new terminal window
ngrok http 3000

# 3. Copy ngrok provided HTTPS URL
# Example: https://abc123.ngrok.io

# 4. Go to Polar Dashboard to update Webhook URL
# Set to: https://abc123.ngrok.io/api/webhooks/polar
```

**ngrok Usage Instructions**:
- ngrok maps local localhost:3000 to public HTTPS URL
- This allows Polar to send Webhook events to your local development environment
- Suitable for testing Webhook functionality during development phase

#### 3. Integration Flow Testing
- Create test user in application
- Simulate subscription flow
- Check customer and subscription data in Polar Dashboard
- Verify Webhook events are processed correctly

**Important: Subscription Status Check**
If subscription succeeds but Dashboard still shows free version, this usually indicates:
- ✅ Polar payment processing successful
- ❌ Webhook events not processed correctly
- 🔧 Need to check Webhook configuration and processing logic

**Troubleshooting Steps**:
1. Check if subscription record exists in Polar Dashboard
2. Confirm Webhook URL is correctly configured: must include `/api/webhooks/polar` path
3. Test if Webhook URL is accessible (especially important when using ngrok)
4. Check application logs for Webhook event reception records
5. Verify Webhook Secret is correctly configured

#### 4. Credit Card Payment Testing
In Sandbox environment, you can use test credit cards for payment testing:

**Test Card Information** (Source: [Stripe Test Cards Documentation](https://docs.stripe.com/testing)):

| Card Brand | Card Number | CVC | Expiry Date | Description |
|------------|-------------|-----|-------------|-------------|
| **Visa** | `4242424242424242` | Any 3 digits | Any future date | Successful payment test card |
| **Visa** | `4000000000000002` | Any 3 digits | Any future date | Declined payment test card |

**Usage Example**:
```
Test credit card number: Visa    4242424242424242    Any 3 digits    Any future date
Expiry date: 12/34
CVC: 123
Postal code: 10001 (or any valid postal code)
```

**Notes**:
- Only use test cards in Sandbox environment
- Test cards will not generate actual charges
- Can test various payment scenarios (success, failure, requires verification, etc.)

## 📚 Related Resources

- [Polar Official Documentation](https://docs.polar.sh)
- [Polar API Reference](https://docs.polar.sh/api)  
- [Polar SDK Documentation](https://docs.polar.sh/sdk)
- [Polar Discord Community](https://discord.gg/polar)

---

**Document Version**: 2.0  
**Last Updated**: 2025-07-23  
**Maintainer**: Development Team  
**Update Content**:
- Reorganized document structure, unified style
- Added complete testing and verification section  
- Optimized step descriptions and formatting
- Added recommended configuration guide