---
uuid: f37277f7fc2943f7aff1a5607062ea39
---
# Project Architecture Overview

**Language**: [English](Project-Architecture-Overview.md) | [繁體中文](當前專案架構.md)

## 📋 Project Overview

This project is a modern SaaS application template based on Next.js, integrating Clerk (authentication), Polar (payments), and Supabase (database) services to provide a complete SaaS solution.

### Project Information
- **Project Name**: Next-Clerk-Polar-Supabase Starter Kit
- **Version**: 0.1.0
- **Type**: SaaS Application Template

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15.4.1** - React full-stack framework with App Router
- **React 19.1.0** - Frontend UI framework
- **TypeScript 5.x** - Type-safe JavaScript

### Styling & UI
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **PostCSS** - CSS post-processor
- **Lucide React** - Modern icon library

### Authentication System
- **@clerk/nextjs** - Complete user authentication and management solution

### Development Tools
- **ESLint 9.x** - Code quality checking
- **Turbopack** - Fast bundler for development mode

### Integrated Services
- **Clerk** - User authentication and management ✅ Completed
- **Supabase** - Database and backend services ✅ Completed
- **Polar** - Payment and subscription management ✅ Completed

## 📁 Project Structure

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
│   │   │   ├── layout.tsx        # Dashboard layout
│   │   │   ├── page.tsx          # Dashboard home (real subscription data)
│   │   │   ├── subscription/page.tsx # Subscription management page
│   │   │   ├── checkout-success/page.tsx # Payment success page
│   │   │   └── profile/page.tsx  # User profile page
│   │   ├── favicon.ico           # Website icon
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
│   │   └── dashboard/            # Dashboard components
│   │       └── DashboardNav.tsx  # Dashboard navigation
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
├── public/                       # Static assets directory
│   ├── file.svg                  # File icon
│   ├── globe.svg                 # Globe icon
│   ├── next.svg                  # Next.js logo
│   ├── vercel.svg                # Vercel logo
│   └── window.svg                # Window icon
├── documents/                    # Project documentation directory
│   ├── Project-Architecture-Overview.md # Project architecture documentation (EN)
│   ├── 當前專案架構.md           # Project architecture documentation (ZH)
│   ├── user-authentication/      # Authentication documentation
│   │   └── Clerk-Integration-Guide.md # Clerk integration guide (EN)
│   ├── database/                 # Database documentation
│   │   └── Supabase-Configuration-Guide.md # Supabase guide (EN)
│   ├── payment/                  # Payment documentation
│   │   └── Polar-Payment-Integration-Guide.md # Polar guide (EN)
│   └── 功能/                     # Feature requirement documents
├── node_modules/                 # Dependencies directory
├── package.json                  # Project configuration and dependencies
├── package-lock.json             # Dependency version lock
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
├── eslint.config.mjs             # ESLint configuration
├── next-env.d.ts                 # Next.js type definitions
├── README.md                     # Project documentation (EN)
├── README.zh-TW.md               # Project documentation (ZH)
└── CLAUDE.md                     # Claude AI related documentation
```

## 🏗️ Architecture Design

### 1. Frontend Architecture

#### App Router Structure
- Uses Next.js 15 App Router architecture
- File-system based routing based on `src/app/` directory structure
- Supports Server Components and Client Components

#### Layout System
- **Root Layout** (`layout.tsx`): Defines site-wide HTML structure
- **Font Configuration**: Uses Geist Sans and Geist Mono fonts
- **Styling System**: Integrates Tailwind CSS for styling management

#### Component Architecture
- **Page Components**:
  - `src/app/page.tsx` - SaaS landing page
  - `src/app/sign-in/[[...sign-in]]/page.tsx` - Sign-in page
  - `src/app/sign-up/[[...sign-up]]/page.tsx` - Sign-up page
  - `src/app/dashboard/` - User dashboard page group
- **Layout Components**:
  - `src/app/layout.tsx` - Root layout (with ClerkProvider integration)
  - `src/app/dashboard/layout.tsx` - Dashboard-specific layout
- **UI Components**: Located in `src/components/` directory
  - `Header.tsx` - Navigation component (Clerk auth state integration)
  - `HeroSection.tsx` - Hero section component
  - `FeatureSection.tsx` - Features section component
  - `PricingSection.tsx` - Pricing section component
  - `TestimonialSection.tsx` - Testimonials section component
  - `Footer.tsx` - Footer component
  - `dashboard/DashboardNav.tsx` - Dashboard navigation component
- **Middleware**: `src/middleware.ts` - Clerk route protection
- **Styling System**: Uses Tailwind CSS classes and custom CSS animations

### 2. Development Environment Configuration

#### TypeScript Configuration
- **Target Version**: ES2017
- **Module System**: ESNext with bundler resolution
- **Path Aliases**: `@/*` maps to `./src/*`
- **Strict Mode**: Enables all TypeScript strict checks

#### Build Tools
- **Development Mode**: Uses Turbopack for enhanced development experience
- **Production Build**: Uses Next.js built-in build system
- **Code Linting**: ESLint configured with Next.js recommended rules

### 3. Project Scripts

```json
{
  "dev": "next dev --turbopack",     // Development mode (with Turbopack)
  "build": "next build",             // Production build
  "start": "next start",             // Start production server
  "lint": "next lint"                // Code linting
}
```

## 🔧 Configuration Files

### Next.js Configuration (`next.config.ts`)
- Currently basic configuration, can be extended for more features
- Supports TypeScript configuration file format

### TypeScript Configuration (`tsconfig.json`)
- Configured to compile to ES2017 target
- Enables strict mode and all type checking
- Sets up path aliases for convenient module imports

### PostCSS Configuration (`postcss.config.mjs`)
- Integrates Tailwind CSS processing
- Supports modern CSS features

## 🎯 Completed Features

### SaaS Landing Page (SF01) ✅ Completed
- ✅ **Header Navigation** - Fixed top navigation, responsive design, smooth scrolling, auth state integration
- ✅ **Hero Section** - Product showcase, CTA buttons, dynamic background effects
- ✅ **Features Section** - 4 core feature showcases with icons and descriptions
- ✅ **Pricing Section** - Free vs Pro plan comparison with popular badges
- ✅ **Testimonials Section** - Customer testimonials, statistics, rating displays
- ✅ **Footer** - Complete link navigation, social media, newsletter subscription

### Clerk Authentication System (SF02) ✅ Completed
- ✅ **User Registration** - Complete registration flow with email verification
- ✅ **User Login** - Secure login system with session management
- ✅ **Route Protection** - Middleware protection for sensitive pages with auto-redirect
- ✅ **SaaS Dashboard** - Subscription status, usage statistics, quick actions
- ✅ **Subscription Management** - Plan comparison, upgrade/downgrade, payment management
- ✅ **User Profile** - Simplified user information display and basic settings
- ✅ **Navigation Integration** - Different interfaces based on authentication state

### Supabase Subscription Data Integration (SF04) ✅ Completed
- ✅ **Database Connection** - Successfully established Supabase project connection
- ✅ **user_profiles Table** - Complete user subscription data structure
- ✅ **Polar Integration Fields** - Added polar_customer_id, polar_subscription_id, current_period_end, cancel_at_period_end
- ✅ **Automated User Management** - Auto-create free plan records for new user registrations
- ✅ **Real Data Display** - Dashboard displays subscription data from Supabase
- ✅ **API Interface** - Complete subscription data CRUD operations
- ✅ **Webhook Integration** - Clerk and Polar events automatically trigger database operations
- ✅ **Type Safety** - Complete TypeScript type definitions
- ✅ **Security Control** - Row Level Security and permission management

### Polar Payment System Integration (SF05) ✅ Completed
- ✅ **Polar SDK Integration** - Successfully integrated @polar-sh/sdk package with corrected API parameter format
- ✅ **Checkout API** - Implemented /api/polar/create-checkout endpoint with proper redirects
- ✅ **Webhook Processing** - Implemented /api/webhooks/polar endpoint
- ✅ **Frontend Integration** - Subscription management page supports real upgrade flow, tested successfully
- ✅ **Database Extension** - Added Polar-related field support

### Subscription Plan Switching (SF07) ✅ Completed
- ✅ **Smart Detection** - Auto-identify new users vs existing subscription users
- ✅ **Subscription Management** - Support Pro subscription/cancellation with status-based permission control
- ✅ **Prorated Billing** - Uses 'invoice' mode for immediate billing differences
- ✅ **Downgrade Confirmation** - Downgrade operations require user confirmation to prevent accidental actions
- ✅ **Database Sync** - Fixed webhook field mapping to ensure real-time sync
- ✅ **Debug Tools** - Built complete debugging and diagnostic tools
- ✅ **Security Verification** - HMAC-SHA256 webhook signature verification
- ✅ **Error Handling** - Comprehensive error handling and user feedback
- ✅ **Status Sync** - Real-time subscription status sync to database
- ✅ **Plan Management** - Single product logic, Pro plan ($5/month) subscription
- ✅ **Environment Configuration** - Fixed environment variable settings to ensure proper operation

### Technical Features ✅ Completed
- ✅ **Responsive Design** - Supports desktop, tablet, and mobile devices
- ✅ **Modern UI** - Uses Tailwind CSS 4.x and Lucide React icons
- ✅ **Interactive Effects** - Hover animations, smooth scrolling, visual feedback
- ✅ **Performance Optimization** - Fast loading, no layout shifts
- ✅ **Code Quality** - TypeScript type safety, ESLint checks passed
- ✅ **Security** - Clerk enterprise-grade authentication, Supabase RLS, Polar webhook verification
- ✅ **Data Management** - Real database integration, automated data sync
- ✅ **Payment Integration** - Complete SaaS payment flow, real-time status sync
- ✅ **Scalability** - Modular architecture for easy future feature expansion

## 🚀 Development Workflow

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Development Standards
- Use TypeScript for type-safe development
- Follow ESLint rules for code quality control
- Use Tailwind CSS for styling development
- Follow Next.js App Router best practices

### 3. Build and Deployment
```bash
# Code linting
npm run lint

# Production build
npm run build

# Start production server
npm run start
```

## 📝 Notes

1. **Current Status**: Completed SaaS landing page, Clerk authentication system, and Supabase database integration
2. **Development Environment**: Recommended Node.js 18+ version
3. **Package Management**: Use npm for dependency management
4. **Version Control**: Recommended to use Git for version control
5. **Deployment Platform**: Recommended to use Vercel for deployment
6. **Authentication Setup**: Need to configure correct environment variables in Clerk Dashboard
7. **Database Setup**: Need to create project and configure environment variables in Supabase Dashboard

---

**Document Version**: 2.5  
**Last Updated**: 2025-07-22  
**Maintainer**: Development Team  
**Update Content**: 
1. Updated README.md based on current implementation, focusing on completed features, moved unimplemented features to TODO section
2. Added English and Chinese version switching, default to English (README.md), Chinese version as README.zh-TW.md
3. Enhanced internationalization display for global developers on GitHub
