# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChecklyTool is a Next.js application designed for automated checking of student work. It uses Supabase as a backend database and OpenRouter for AI-powered evaluation. The app includes authentication, file upload/processing, and real-time feedback systems.

## Development Commands

- `npm run dev` - Start development server with localhost binding
- `npm run dev:turbo` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## Authentication Architecture

- Uses NextAuth.js v5 with multiple providers (Google, Yandex, Credentials)
- Auth configuration in `lib/auth.ts`
- Protected routes handled by middleware in `middleware.ts`
- User profiles stored in Supabase with email as primary identifier
- Session management with JWT tokens

## Database Architecture

- **Backend**: Supabase PostgreSQL with Row Level Security (RLS)
- **Client**: Service role configuration in `lib/database.ts` for RLS bypass
- **Tables**: `user_profiles`, `checks`, `submissions`, `evaluation_results`
- **Authentication**: Email-based user identification for consistency across providers

## File Upload & Processing

- File uploads handled through `lib/upload-submissions.ts`
- Support for various document formats (images, PDFs, docs)
- Processing includes OCR and AI evaluation via OpenRouter API
- Draft system for saving work in progress

## Key Libraries & Dependencies

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4 with custom configuration
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Forms**: React Hook Form with Zod validation
- **State Management**: React useState/useContext for local state
- **Animation**: Framer Motion
- **Icons**: Lucide React

## Project Structure

```
app/                    # Next.js App Router pages
├── api/               # API routes for backend functionality
├── auth/              # Authentication pages (login, register)
├── dashboard/         # Protected dashboard area
└── globals.css        # Global styles with Tailwind

components/            # React components
├── auth/              # Auth-related components
├── checks/            # Check creation and management
├── submission/        # File upload and submission handling
└── ui/                # Reusable UI components

lib/                   # Core business logic and utilities
├── auth.ts            # NextAuth configuration
├── database.ts        # Supabase database helpers
├── openrouter.ts      # AI evaluation service
└── supabase/          # Supabase client configuration

types/                 # TypeScript type definitions
```

## Environment Configuration

Required environment variables (see `.env.example`):
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- NextAuth: `AUTH_SECRET`, provider credentials
- OpenRouter: API keys for AI evaluation
- Site URL for production deployment

## Mobile-First Design

- Responsive design implemented throughout
- Mobile-specific components (MobileHeader, MobileDashboard)
- PWA support with manifest.json
- Touch-friendly interfaces and navigation

## Development Notes

- Uses strict TypeScript configuration with bundler module resolution
- ESLint configured with Next.js and TypeScript rules
- Russian language interface and content
- Yandex Metrika analytics integration
- Docker deployment configuration available

## API Architecture

- RESTful API routes in `app/api/`
- Server-side validation with Zod schemas
- Authenticated endpoints use database helpers for RLS
- Error handling with structured responses
- File upload endpoints with processing pipelines

## Security Considerations

- RLS policies enforced at database level
- JWT-based authentication with NextAuth
- File upload validation and sanitization
- Protected route middleware for access control
- Environment variable management for secrets
