# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Custodial Command is a comprehensive custodial inspection and management system built for educational institutions. This Progressive Web App (PWA) enables custodial staff to conduct inspections, report concerns, and track building cleanliness standards with a mobile-first design.

## Development Commands

### Core Development
```bash
npm run dev              # Start both frontend and backend in development mode
npm run dev:client       # Start frontend only (Vite dev server on :5173)
npm run dev:server       # Start backend only (Express server on :5000)
```

### Building & Production
```bash
npm run build            # Build for production (runs type check first)
npm run prebuild         # Type check before building
npm run start            # Start production server (runs db:push first)
npm run railway:start   # Railway deployment start command
```

### Database Operations
```bash
npm run db:push          # Push Drizzle schema changes to database
npm run validate-env     # Validate required environment variables
```

### Testing Suite
```bash
npm run test:comprehensive   # Run all tests (comprehensive test runner)
npm run test:health          # Health check tests
npm run test:forms           # Form functionality tests
npm run test:debug           # Debug mode testing with verbose output
npm run test:e2e             # End-to-end user journey tests
npm run test:performance     # Performance and load testing
npm run test:security        # Security vulnerability tests
npm run test:mobile          # Mobile PWA specific tests
```

### UI Testing (Playwright)
```bash
npm run ui:test            # Run Playwright tests
npm run ui:test:headed     # Run Playwright tests with browser UI
npm run ui:test:report     # Show Playwright test report
```

### Analysis & Utilities
```bash
npm run analyze:bundle     # Analyze bundle size and composition
npm run build:analyze      # Build and then analyze bundle
```

## Architecture Overview

### Full-Stack Structure
- **Frontend**: React 18 + TypeScript with Vite build system
- **Backend**: Express.js server with comprehensive middleware
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Railway (primary) with PWA capabilities

### Key Architectural Patterns

**Database Schema Design**:
- `inspections` table supports both single-room and whole-building inspections
- `roomInspections` table for individual room data within building inspections
- Relational structure with building inspection references and room categorization
- Rating system with 10 criteria categories (floors, surfaces, ceilings, restrooms, etc.)

**API Structure**:
- RESTful endpoints in `/server/routes.ts` with security middleware
- Comprehensive error handling and logging in `/server/monitoring.ts`
- Security hardening in `/server/security.ts` with rate limiting and input validation
- File upload handling with multer and image compression

**Frontend Architecture**:
- Component-based structure with extensive Radix UI component library
- Lazy-loaded route components for performance optimization
- Mobile-first responsive design with touch-friendly interfaces
- Form persistence and offline capabilities using localStorage
- React Query for server state management and caching

**State Management**:
- React Query for API calls and server state
- Custom hooks for complex form logic (building inspection, room selection)
- Local storage for form persistence and offline functionality
- React Router (wouter) for client-side routing

### Key Business Logic

**Inspection Types**:
1. **Single Room**: Direct rating of 10 criteria for a specific room
2. **Whole Building**: Multi-step process with room type verification and individual room inspections

**Rating System**: 1-5 scale across 10 criteria:
- Floors, Vertical/Horizontal Surfaces, Ceilings, Restrooms
- Customer Satisfaction, Trash, Project Cleaning, Activity Support
- Safety Compliance, Equipment, Monitoring

**Data Flow**:
1. Frontend forms collect inspection data with validation
2. API endpoints process and store data with security checks
3. React Query manages state and caching
4. Comprehensive logging and monitoring track all operations

## Development Guidelines

### Database Changes
- Schema modifications happen in `shared/schema.ts`
- Use `npm run db:push` to apply changes to database
- Always validate environment variables before database operations

### Testing Strategy
- Comprehensive test suite covers E2E, performance, security, and mobile PWA
- Use `npm run test:comprehensive` for full validation
- Individual test categories available for focused testing

### Code Organization
- Shared types and schemas in `/shared/` directory
- Server-side code in `/server/` with modular route structure
- Frontend components organized by function (ui/, pages/, hooks/)
- Path aliases configured: `@/*` for src, `@shared/*` for shared code

### Performance Considerations
- Lazy loading implemented for all route components
- Bundle splitting with vendor and UI chunks
- Image compression and optimization for mobile
- Comprehensive monitoring and performance tracking

### Security Implementation
- Helmet.js for security headers
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration for cross-origin security

## Environment Configuration

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Development/production environment setting

The application supports multiple database providers (Supabase, Neon, local PostgreSQL) and includes validation scripts to ensure proper configuration.

## Mobile PWA Features

The application is designed as a Progressive Web App with:
- Touch-friendly interfaces optimized for mobile devices
- Offline functionality with form persistence
- PWA installation capabilities for iOS and Android
- Responsive design adapting to all screen sizes
- Comprehensive mobile testing suite

## Development Workflow

1. Use `npm run dev` for local development with hot reload
2. Run `npm run check` for TypeScript validation before commits
3. Use `npm run test:comprehensive` to validate functionality
4. Database changes require `npm run db:push`
5. Build with `npm run build` and preview with `npm run preview`