---
uuid: e3f0737bd0804b48a021da2d5e640598
---
# Clerk Authentication System Integration Guide

**Language**: [English](Clerk-Integration-Guide.md) | [繁體中文](../用戶認證/Clerk整合說明文件.md)

## 📋 Document Overview

This document provides detailed instructions on how to integrate the Clerk authentication system in the Next-Clerk-Polar-Supabase Starter Kit, including complete setup steps, usage guidelines, and best practices.

### Document Information
- **Created Date**: 2025-07-16
- **Version**: 1.0
- **Scope**: Next.js 15.4.1 + Clerk
- **Maintainer**: Development Team

## 🎯 Integration Goals

- ✅ Provide complete user authentication functionality (registration, login, logout)
- ✅ Implement route protection and permission management
- ✅ Build user dashboard and profile management
- ✅ Integrate with existing SaaS landing page
- ✅ Prepare for subsequent Polar and Supabase integration

## 🛠️ Technical Architecture

### Core Components
- **@clerk/nextjs**: Clerk's official Next.js SDK
- **ClerkProvider**: Global authentication state management
- **Middleware**: Route protection and redirection
- **Pre-built Components**: SignIn, SignUp, UserButton, UserProfile

### File Structure
```
src/
├── app/
│   ├── sign-in/[[...sign-in]]/page.tsx    # Sign-in page
│   ├── sign-up/[[...sign-up]]/page.tsx    # Sign-up page
│   ├── dashboard/                          # User dashboard
│   │   ├── layout.tsx                      # Dashboard layout
│   │   ├── page.tsx                        # Dashboard home
│   │   ├── profile/page.tsx                # Profile page
│   │   └── settings/page.tsx               # Settings page
│   ├── layout.tsx                          # Root layout (with ClerkProvider)
│   └── middleware.ts                       # Clerk middleware
├── components/
│   ├── Header.tsx                          # Updated navigation
│   └── dashboard/
│       └── DashboardNav.tsx                # Dashboard navigation
└── .env.local                              # Environment variables
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install @clerk/nextjs
```

### 2. Environment Variables Setup

Create or update your `.env.local` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 3. Clerk Dashboard Configuration

1. **Create Application**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create a new application
   - Choose "Next.js" as the framework

2. **Configure URLs**
   - Set sign-in URL: `/sign-in`
   - Set sign-up URL: `/sign-up`
   - Set after sign-in URL: `/dashboard`
   - Set after sign-up URL: `/dashboard`

3. **Webhook Setup** (for Supabase integration)
   - Add webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Subscribe to `user.created` and `user.updated` events

### 4. Root Layout Configuration

Update `src/app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### 5. Middleware Setup

Create `src/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

## 📱 Component Implementation

### Sign-In Page

Create `src/app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}
```

### Sign-Up Page

Create `src/app/sign-up/[[...sign-up]]/page.tsx`:

```typescript
import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  )
}
```

### Dashboard Layout

Create `src/app/dashboard/layout.tsx`:

```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

## 🔧 Advanced Configuration

### Custom Styling

Clerk components can be customized using the `appearance` prop:

```typescript
<SignIn 
  appearance={{
    elements: {
      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
      card: 'shadow-lg',
    }
  }}
/>
```

### User Profile Management

Implement user profile access in your dashboard:

```typescript
import { UserProfile } from '@clerk/nextjs'

export default function ProfilePage() {
  return (
    <div className="flex justify-center">
      <UserProfile />
    </div>
  )
}
```

## 🔗 Integration with Other Services

### Supabase Integration

When a user signs up or updates their profile, sync data to Supabase via webhooks:

```typescript
// src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase'

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
    const supabase = createClient()
    
    await supabase
      .from('user_profiles')
      .insert({
        clerk_user_id: id,
        email: evt.data.email_addresses[0]?.email_address,
        subscription_plan: null,
        subscription_status: 'inactive',
        created_at: new Date().toISOString(),
      })
  }

  return new Response('', { status: 200 })
}
```

## 🔒 Security Best Practices

### Environment Variables
- Never expose secret keys in client-side code
- Use different keys for development and production
- Regularly rotate API keys

### Route Protection
- Always protect sensitive routes with middleware
- Implement proper error handling for unauthorized access
- Use server-side authentication checks for API routes

### User Data Handling
- Validate user input on both client and server
- Implement proper CORS policies
- Use HTTPS in production

## 🐛 Troubleshooting

### Common Issues

1. **Middleware not working**
   - Check if `middleware.ts` is in the correct location
   - Verify the matcher configuration
   - Ensure environment variables are set correctly

2. **Redirect loops**
   - Check if protected routes are properly configured
   - Verify sign-in/sign-up URLs match your setup
   - Ensure after-sign-in URLs are correct

3. **Styling issues**
   - Clerk components may conflict with Tailwind CSS
   - Use the `appearance` prop to customize styling
   - Check for CSS specificity issues

### Debug Mode

Enable debug mode in development:

```typescript
<ClerkProvider 
  publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
  debug={process.env.NODE_ENV === 'development'}
>
```

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Community](https://discord.com/invite/b5rXHjAg7A)

---

**Document Version**: 1.0  
**Last Updated**: 2025-07-22  
**Maintainer**: Development Team
