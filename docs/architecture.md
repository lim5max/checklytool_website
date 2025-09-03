# ChecklyTool Architecture Documentation

## 1. Project Overview

**ChecklyTool** is a full-stack web application designed to streamline the grading process for school assignments by automatically calculating scores and grades. The application saves time for teachers and tutors while improving accuracy in assessment.

### Core Features
- Automated score and grade calculation
- Check creation and variant management
- Student submission processing
- Results analytics and reporting
- User authentication and profile management

## 2. Technology Stack

### Frontend Framework
- **Next.js 15.5.0** with App Router
- **React 19.1.0** for UI components
- **TypeScript** for type safety
- **Turbopack** for fast development builds

### Styling & UI
- **Tailwind CSS 4.0** for styling
- **Shadcn/UI** component library
- **Framer Motion** for animations
- **Lucide React** for icons

### Authentication
- **NextAuth.js v5 (beta)** for authentication
- **OAuth providers**: Google, Yandex
- **JWT-based sessions**

### Database & Backend
- **Supabase** as PostgreSQL database
- **Row Level Security (RLS)** bypassed via service role
- **Prisma-like schema** with TypeScript types

### Validation & Forms
- **Zod** for schema validation
- **React Hook Form** for form management
- **Sonner** for toast notifications

### Development Tools
- **ESLint** with Next.js config
- **TypeScript** strict mode
- **Git** version control

## 3. Project Structure

```
checklytool_website/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── checks/               # Check management
│   │   ├── dashboard/            # Dashboard data
│   │   ├── submissions/          # Student submissions
│   │   └── users/                # User management
│   ├── auth/                     # Auth pages
│   ├── dashboard/                # Dashboard pages
│   │   └── checks/               # Check management UI
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── checks/                   # Check-related components
│   ├── dashboard/                # Dashboard components
│   ├── results/                  # Results display
│   ├── submission/               # Submission components
│   └── ui/                       # Shadcn UI components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── database.ts               # Database utilities
│   ├── supabase/                 # Supabase client setup
│   └── validations/              # Zod schemas
├── types/                        # TypeScript definitions
└── tasks/                        # Database scripts
```

## 4. Database Architecture

### Core Tables

#### `user_profiles`
- Stores user metadata from NextAuth
- Links OAuth identities to application data
- Fields: `user_id`, `email`, `name`, `provider`, `role`

#### `checks`
- Main entity for check/assignment creation
- Fields: `id`, `user_id`, `title`, `description`, `subject`, `class_level`, `variant_count`, `total_questions`

#### `check_variants`
- Different versions of the same check
- Fields: `id`, `check_id`, `variant_number`, `reference_answers`, `reference_image_urls`

#### `grading_criteria`
- Scoring rules for each check
- Fields: `id`, `check_id`, `grade`, `min_percentage`

#### `student_submissions`
- Student work submissions
- Fields: `id`, `check_id`, `student_name`, `answers`, `images`, `submitted_at`

#### `evaluation_results`
- Automated grading results
- Fields: `id`, `submission_id`, `score`, `grade`, `feedback`

### Database Access Strategy
- **Service Role Key**: Used to bypass RLS policies
- **NextAuth Integration**: User context set via `session.user.id`
- **Type Safety**: TypeScript interfaces for all database operations

## 5. API Architecture

### Authentication Endpoints
```
GET  /api/auth/[...nextauth]     # NextAuth.js handler
POST /api/auth/register          # User registration
```

### Check Management
```
GET    /api/checks               # List user's checks
POST   /api/checks               # Create new check
GET    /api/checks/[id]          # Get specific check
PUT    /api/checks/[id]          # Update check
DELETE /api/checks/[id]          # Delete check
GET    /api/checks/[id]/statistics  # Check analytics
```

### Submission Management
```
GET  /api/checks/[id]/submissions    # List submissions
POST /api/checks/[id]/submissions    # Submit student work
POST /api/submissions/[id]/evaluate  # Evaluate submission
```

### User Management
```
GET  /api/users/profile          # Get user profile
PUT  /api/users/profile          # Update profile
```

### Dashboard Data
```
GET  /api/dashboard/stats        # Dashboard statistics
```

## 6. Frontend Architecture

### Page Structure

#### Landing Page (`/`)
- Marketing content
- Authentication buttons
- Feature showcase

#### Dashboard (`/dashboard`)
- Check overview cards
- Statistics display
- Search and filtering
- Navigation to check management

#### Check Management (`/dashboard/checks`)
- **New Check** (`/new`): Check creation form
- **Check Details** (`/[id]`): Variant management, settings
- **Submit Work** (`/[id]/submit`): Student submission interface
- **Results** (`/[id]/results`): Grading results and analytics

### Key Components

#### `CreateCheckForm`
- Multi-step form for check creation
- Validation with Zod schemas
- Grading criteria configuration

#### `VariantManager`
- Reference answer management
- Image upload for reference materials
- Variant navigation and editing

#### `ImageUpload` & `CameraScanner`
- File upload with drag-and-drop
- Camera integration for mobile
- Image preview and management

#### `ResultsDisplay`
- Automated grading visualization
- Score breakdown and feedback
- Export functionality

### State Management
- **React Hook Form** for form state
- **React useState** for component state
- **NextAuth session** for user state
- **URL parameters** for filtering and pagination

## 7. Authentication Flow

1. **User clicks login** → Redirects to NextAuth
2. **OAuth provider** (Google/Yandex) → Returns user data
3. **NextAuth signIn callback** → Creates/updates user profile
4. **Session established** → User can access protected routes
5. **Database operations** → Use service role key for data access

## 8. Data Flow

### Check Creation Flow
1. **Teacher creates check** → Form validation
2. **Check saved to database** → Variants auto-created
3. **Reference materials added** → Images and answers stored
4. **Check ready for use** → Students can submit work

### Submission & Grading Flow
1. **Student submits work** → Images and answers uploaded
2. **Automatic evaluation** → Compares with reference answers
3. **Score calculation** → Based on grading criteria
4. **Results generated** → Feedback and grade assigned
5. **Teacher reviews** → Can adjust scores if needed

## 9. Security Considerations

### Authentication Security
- **OAuth 2.0** with secure providers
- **JWT tokens** with expiration
- **CSRF protection** via NextAuth

### Database Security
- **Service role access** bypasses RLS for application
- **Input validation** via Zod schemas
- **SQL injection prevention** via Supabase client

### File Upload Security
- **File type validation**
- **Size limits** on uploads
- **Secure storage** via Supabase Storage

## 10. Performance Optimizations

### Build Optimizations
- **Turbopack** for fast development builds
- **Next.js App Router** with automatic code splitting
- **Static generation** for marketing pages

### Runtime Optimizations
- **Server-side rendering** for dynamic content
- **Image optimization** via Next.js Image component
- **Database indexing** on frequently queried fields

### Caching Strategy
- **Next.js caching** for API routes
- **Browser caching** for static assets
- **Database connection pooling** via Supabase



