# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js SaaS starter kit that integrates Clerk (authentication), Polar (payments), and Supabase (database). The project uses the traditional Chinese language for documentation and is designed to be a production-ready template for SaaS applications.

## Architecture

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS, Shadcn/ui
- **Authentication**: Clerk for user management, social logins, MFA, organization management
- **Payments**: Polar for subscription management, billing, invoices
- **Database**: Supabase with PostgreSQL, real-time sync, file storage
- **ORM**: Prisma for type-safe database operations
- **Validation**: Zod for data validation
- **Forms**: React Hook Form

## Common Commands

Based on the README, the expected development commands are:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Database operations
npm run db:migrate    # Run database migrations
npm run db:generate   # Generate Prisma client
```

## Project Structure

From the README documentation:
```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Authentication pages
│   ├── (dashboard)/    # Dashboard pages
│   ├── api/            # API routes
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── ui/            # UI components
│   ├── auth/          # Authentication components
│   └── dashboard/     # Dashboard components
├── lib/               # Utility functions
├── hooks/             # Custom React hooks
└── types/             # TypeScript type definitions

supabase/              # Supabase configuration
├── migrations/        # Database migrations
└── functions/         # Edge Functions
```

## Development Guidelines

This project follows TDD (Test-Driven Development) practices based on the documentation templates found in `documents/功能/`. The team uses structured templates for:

- Feature requirements (功能需求書模板)
- Bug fixes (Bug修正模板)
- Refactoring tasks (重構任務模板)
- Simple feature requests (簡易功能需求書模板)

All development should follow the TDD workflow:
1. Write failing tests (red)
2. Implement minimal code to pass tests (green)
3. Refactor while maintaining tests (refactor)

## Environment Setup

The project requires environment variables for:
- Clerk (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
- Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- Polar (POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET)

Copy `.env.example` to `.env.local` and configure with actual API keys.

## Notes

- Project documentation is primarily in Traditional Chinese
- No package.json found in root - this appears to be a documentation/template repository
- Development workflow emphasizes structured requirement documentation and TDD practices
- Focus on SaaS features: authentication, payments, user management, and admin dashboards