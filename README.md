---
uuid: 9bec16718b8848d295633ecd0e52a112
---
# Next-Clerk-Polar-Supabase Starter Kit

**Language**: [English](README.md) | [繁體中文](README.zh-TW.md)

> 🚀 A modern SaaS application template that integrates Next.js, Clerk, Polar, and Supabase, providing complete user authentication, payment subscriptions, and data management functionality.

[![Next.js](https://img.shields.io/badge/Next.js-15.4.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-38B2AC)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple)](https://clerk.com/)
[![Polar](https://img.shields.io/badge/Polar-Payments-blue)](https://polar.sh/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)

## ✨ Implemented Features

- 🎨 **SaaS Landing Page** - Responsive design with Hero, Features, Pricing, Testimonials sections
- 🔐 **Clerk Authentication** - User registration, login, route protection, profile management
- 💳 **Polar Payment Integration** - Pro subscription ($5/month), Checkout flow, Webhook handling
- 🗄️ **Supabase Database** - User subscription data management, real-time sync, Row Level Security
- 📊 **User Dashboard** - Subscription status display, plan management, profile settings
- 🔄 **Subscription Management** - Smart upgrade/downgrade, immediate/period-end cancellation, real-time sync
- 🛡️ **Security Features** - Webhook signature verification, permission control, event deduplication

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15.4.1** - React full-stack framework with App Router
- **React 19.1.0** - Frontend UI framework
- **TypeScript 5.x** - Type-safe JavaScript

### Styling & UI
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **PostCSS** - CSS post-processor

### Integrated Services
- **Clerk** - User authentication and management
- **Polar** - Payment and subscription management
- **Supabase** - PostgreSQL database and backend services

### Development Tools
- **ESLint 9.x** - Code quality checking
- **Turbopack** - Fast bundler for development mode

## 🎯 Feature Details

### 🎨 SaaS Landing Page (Completed)
- ✅ **Header Navigation** - Fixed top navigation, responsive design, smooth scrolling, auth state integration
- ✅ **Hero Section** - Product showcase, CTA buttons, dynamic background effects
- ✅ **Features Section** - 4 core feature showcases with icons and descriptions
- ✅ **Pricing Section** - Free vs Pro plan comparison with popular badges
- ✅ **Testimonials Section** - Customer testimonials, statistics, rating displays
- ✅ **Footer** - Complete link navigation, social media, newsletter subscription

### 🔐 Clerk Authentication System (Completed)
- ✅ **User Registration** - Complete registration flow with email verification
- ✅ **User Login** - Secure login system with session management
- ✅ **Route Protection** - Middleware protection for sensitive pages with auto-redirect
- ✅ **User Profile** - User information display and basic settings
- ✅ **Navigation Integration** - Different interfaces based on authentication state

### 💳 Polar Payment System (Completed)
- ✅ **Pro Subscription** - $5/month subscription plan
- ✅ **Checkout Flow** - Secure payment processing
- ✅ **Webhook Handling** - Real-time event synchronization
- ✅ **Subscription Management** - Upgrade, downgrade, and cancellation features
- ✅ **Security Verification** - HMAC-SHA256 signature verification

### 🗄️ Supabase Database (Completed)
- ✅ **User Data Table** - Complete user_profiles structure
- ✅ **Subscription Data** - polar_customer_id, polar_subscription_id, current_period_end fields
- ✅ **Permission Control** - Row Level Security (RLS)
- ✅ **Real-time Sync** - Webhook-triggered automatic updates
- ✅ **Type Safety** - Complete TypeScript type definitions

### 📊 User Dashboard (Completed)
- ✅ **Subscription Status** - Real-time subscription status and expiration display
- ✅ **Plan Management** - Upgrade to Pro, subscription cancellation
- ✅ **User Profile** - Basic user information management
- ✅ **Navigation System** - Clear dashboard navigation

## 🏗️ Project Structure

```
Next-Clerk-Polar-Supabase Starter Kit/
├── src/                          # Source code directory
│   ├── app/                      # Next.js App Router directory
│   │   ├── api/                  # API routes directory
│   │   │   ├── user/subscription/route.ts # User subscription data API
│   │   │   ├── polar/create-checkout/route.ts # Polar Checkout API
│   │   │   ├── webhooks/clerk/route.ts    # Clerk Webhook handler
│   │   │   └── webhooks/polar/route.ts    # Polar Webhook handler
│   │   ├── sign-in/              # Sign-in page
│   │   ├── sign-up/              # Sign-up page
│   │   ├── dashboard/            # User dashboard
│   │   │   ├── page.tsx          # Dashboard home (real subscription data)
│   │   │   ├── subscription/page.tsx # Subscription management page
│   │   │   ├── checkout-success/page.tsx # Payment success page
│   │   │   └── profile/page.tsx  # User profile page
│   │   ├── globals.css           # Global styles (with custom animations)
│   │   ├── layout.tsx            # Root layout component (with ClerkProvider)
│   │   └── page.tsx              # Home page component (SaaS landing page)
│   ├── components/               # React components directory
│   │   ├── Header.tsx            # Navigation component (Clerk integration)
│   │   ├── HeroSection.tsx       # Hero section component
│   │   ├── FeatureSection.tsx    # Features section component
│   │   ├── PricingSection.tsx    # Pricing section component
│   │   ├── TestimonialSection.tsx # Testimonials section component
│   │   ├── Footer.tsx            # Footer component
│   │   └── dashboard/DashboardNav.tsx # Dashboard navigation
│   ├── lib/                      # Utility functions and services
│   │   ├── supabase.ts           # Supabase client configuration
│   │   ├── userProfileService.ts # User subscription data service
│   │   ├── polar.ts              # Polar API client configuration
│   │   └── subscriptionUtils.ts  # Subscription management utilities
│   ├── types/                    # TypeScript type definitions
│   │   └── supabase.ts           # Supabase related types
│   ├── hooks/                    # React Hooks
│   │   └── useUserProfile.ts     # User subscription data Hook
│   └── middleware.ts             # Clerk route protection middleware
├── documents/                    # Project documentation directory
│   ├── 當前專案架構.md           # Project architecture documentation
│   ├── Clerk整合說明文件.md      # Clerk authentication integration guide
│   ├── Supabase配置與使用說明.md # Supabase database configuration guide
│   ├── Polar金流整合說明.md      # Polar payment integration guide
│   └── 功能/                     # Feature requirement documents
├── public/                       # Static assets directory
├── package.json                  # Project configuration and dependencies
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
├── eslint.config.mjs             # ESLint configuration
└── README.md                     # Project documentation
```

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/highsunday/Next-Clerk-Polar-Supabase-Starter-Kit.git
cd Next-Clerk-Polar-Supabase-Starter-Kit
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Setup
Create a `.env.local` file and fill in your API keys:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Polar Payment System
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID=your_polar_pro_product_id
```

### 4. Service Configuration

Before you can start using the application, you need to configure three core services in the following order: Clerk (authentication), Supabase (database), and Polar (payments). We recommend following this sequence as later services depend on the previous configurations.

#### Clerk Authentication Setup
Create authentication application, configure sign-in pages, and set up webhook integration.

**Key Steps:**
1. Create new application in Clerk Dashboard
2. Configure authentication strategies (Email + Password / Social login)
3. Set sign-in/sign-up page routes
4. Configure webhook endpoint `/api/webhooks/clerk`
5. Obtain API keys and set environment variables
6. Test user registration and login flow

📖 For detailed steps, see: [Clerk Authentication Configuration Guide](./documents/Clerk-Authentication-Configuration-Guide.md)

#### Supabase Database Setup
Set up PostgreSQL database, create user data table structure, and configure security policies.

**Key Steps:**
1. Create new project on Supabase
2. Execute SQL scripts to create `user_profiles` table
3. Configure Row Level Security (RLS) policies
4. Obtain API keys and set environment variables
5. Test database connection and permissions
6. Integrate Clerk webhooks to automatically create user profiles

📖 For detailed steps, see: [Supabase Configuration Guide](./documents/Supabase-Configuration-Guide.md)

#### Polar Payment Setup
Create payment account, set up subscription products, and configure webhook event handling.

**Key Steps:**
1. Register Polar account and choose environment (Sandbox/Production)
2. Create organization and Pro product ($5/month)
3. Configure webhook endpoint `/api/webhooks/polar`
4. Obtain Access Token and Webhook Secret
5. Set environment variables and test payment flow
6. Verify webhook events sync with Supabase data

📖 For detailed steps, see: [Polar Configuration Guide](./documents/Polar-Configuration-Guide.md)

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the result.

### 6. Test Features
1. Register a new user account
2. Login and view the dashboard
3. Test Pro subscription flow
4. Verify webhook event handling

## 📖 Documentation

### Configuration Guides
- [Clerk Authentication Configuration Guide](./documents/Clerk-Authentication-Configuration-Guide.md) | [繁體中文](./documents/Clerk認證策略配置指南.md)
- [Supabase Database Configuration Guide](./documents/Supabase-Configuration-Guide.md) | [繁體中文](./documents/Supabase配置與使用說明.md)
- [Polar Payment Configuration Guide](./documents/Polar-Configuration-Guide.md) | [繁體中文](./documents/Polar配置與準備說明.md)

### Architecture Documentation
- [Project Architecture Overview](./documents/Project-Architecture-Overview.md)
- [Feature Requirements](./documents/功能/) *(Chinese only)*

## 🔮 TODO Features

### Authentication System Extensions
- [ ] Social login integration (Google, GitHub, Discord)
- [ ] Multi-factor authentication (MFA)
- [ ] Organization management and invitation system
- [ ] Password reset functionality

### Payment System Extensions
- [ ] Annual subscription plans with discounts
- [ ] Invoice download functionality
- [ ] Refund processing
- [ ] Trial period management
- [ ] Payment history page

### Database Features
- [ ] Real-time data synchronization (Realtime)
- [ ] File upload and storage
- [ ] Data backup mechanisms

### Frontend Features
- [ ] Admin dashboard
- [ ] Internationalization support (i18n)
- [ ] Dark mode
- [ ] PWA support
- [ ] SEO optimization

### Development Tools
- [ ] Unit testing (Jest)
- [ ] E2E testing (Playwright)
- [ ] CI/CD pipeline
- [ ] Docker containerization

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork this project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Support

If this project helps you, please give us a ⭐️!

### Issue Reporting
If you find any issues, please report them in [GitHub Issues](https://github.com/highsunday-projects/Next-Clerk-Polar-Supabase-Starter-Kit/issues).

---

**Project Features**: Complete SaaS application template with authentication, payments, and database integration
**Tech Stack**: Next.js 15 + Clerk + Polar + Supabase + TypeScript + Tailwind CSS
**Perfect for**: Developers who want to quickly build SaaS applications