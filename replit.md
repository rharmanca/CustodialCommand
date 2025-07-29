# Shared Services Management Application

## Overview

This is a full-stack web application built for managing custodial services operations. The application uses a modern tech stack with React frontend, Express backend, and PostgreSQL database with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

**Project Maintenance Requirements:**
- README.md, LICENSE, and .gitignore files must be maintained and updated whenever working on the project
- Any architectural changes, new features, or significant modifications should be reflected in README.md
- Keep documentation current with actual project state

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds
- **Component Structure**: Modular component architecture with reusable UI components

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot reload with tsx

### Build and Deployment Strategy
- **Development**: Concurrent frontend (Vite) and backend (tsx) servers
- **Production**: Backend bundled with esbuild, frontend built with Vite
- **Static Assets**: Served from dist/public directory

## Key Components

### Database Schema
- **Users Table**: Basic user authentication with username/password
- **Schema Location**: `shared/schema.ts` using Drizzle ORM
- **Migrations**: Managed through Drizzle Kit in `migrations/` directory

### API Structure
- **Base Path**: All API routes prefixed with `/api`
- **Storage Interface**: Abstracted storage layer supporting both memory and database implementations
- **Error Handling**: Centralized error middleware with status code mapping

### Frontend Features
- **Navigation**: Three-page application with Home, Custodial, and Gallery sections
- **UI Components**: Complete Shadcn/UI component library
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Gallery**: Showcases retro propaganda-style motivational posters for custodial teams
- **Data Analytics**: Comprehensive summary and reporting system with multiple view perspectives
- **Filtering**: Interactive data filtering by school, room number, and inspection category

### Authentication System
- **Storage**: PostgreSQL database with DatabaseStorage implementation
- **Session Management**: Express sessions with PostgreSQL backend
- **User Schema**: Username/password with Drizzle Zod validation

### Inspection System
- **Database Schema**: PostgreSQL tables for inspections with 11 rating categories
- **API Endpoints**: RESTful API for creating and retrieving inspections
- **Rating System**: 1-5 star rating system based on custodial criteria
- **Form Validation**: Zod schema validation for inspection data

## Data Flow

1. **Client Requests**: React frontend makes API calls through TanStack Query
2. **API Processing**: Express server handles requests with route-based middleware
3. **Data Access**: Storage interface abstracts database operations
4. **Response**: JSON responses with error handling and logging
5. **State Management**: TanStack Query manages caching and synchronization

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI component primitives
- **react-hook-form**: Form state management and validation

### Development Tools
- **Vite**: Frontend build tool with React plugin
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **Drizzle Kit**: Database migration and schema management

### UI Framework
- **Shadcn/UI**: Pre-built components with Tailwind CSS
- **Class Variance Authority**: Component variant management
- **Lucide React**: Icon library for UI components

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR on client directory
- **Backend**: tsx for TypeScript execution with hot reload
- **Database**: Drizzle migrations with push command for schema sync

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server to `dist/index.js`
- **Static Serving**: Express serves built frontend from dist/public
- **Environment**: NODE_ENV=production with optimized builds

### Database Configuration
- **Connection**: DATABASE_URL environment variable required
- **Migrations**: Automatic schema push via `npm run db:push`
- **Dialect**: PostgreSQL with Neon serverless compatibility
- **Session Store**: PostgreSQL-backed session storage for production

### Key Architectural Decisions

1. **Monorepo Structure**: Single repository with client, server, and shared directories for code organization
2. **Type Safety**: End-to-end TypeScript with shared schema definitions
3. **Component Library**: Shadcn/UI for consistent design system and rapid development
4. **Database Strategy**: Drizzle ORM chosen for type safety and PostgreSQL compatibility
5. **State Management**: TanStack Query for server state, avoiding complex client state management
6. **Build Strategy**: Separate bundling for frontend and backend with optimized production builds

## Recent Changes

**January 17, 2025**
- Added PostgreSQL database support with Drizzle ORM
- Implemented custodial inspection system with comprehensive rating criteria
- Created DatabaseStorage class replacing in-memory storage  
- Added inspection API endpoints (/api/inspections)
- Built interactive star rating system for facility assessments
- Integrated inspection form with backend database storage
- Converted application to Progressive Web App (PWA) with manifest.json and service worker
- Updated color scheme throughout app to match retro propaganda poster aesthetics
- Added mobile installation instructions on home page for iOS and Android devices
- Created custom PWA icons in retro theme colors matching the application design
- Simplified application to focus only on Home and Custodial sections, removing all other service departments
- Simplified inspection system to only support single room inspections
- Added school dropdown with predefined options: ASA, LCA, GWC, OA, CBR, WLC
- Removed whole building inspection functionality based on user feedback
- Added Gallery page showcasing retro propaganda-style motivational posters for custodial teams
- Integrated image modal functionality for enlarged poster viewing with download options

**January 18, 2025**
- Changed inspection form title from "Submit New Room Inspection" to "Submit Inspection"
- Added location category dropdown with 10 predefined options for better categorization
- Updated database schema to include location_category field
- Re-implemented whole building inspection feature as a separate comprehensive workflow
- Created dynamic checklist system for tracking completion of required inspections per category
- Added real-time progress tracking with visual indicators (checkmarks and completion counts)
- Implemented category-specific inspection requirements (e.g., 3 classrooms, 2 restrooms)
- Added final submission button that only enables when all category requirements are met
- Implemented save/resume functionality for whole building inspections
- Added automatic progress detection when user returns to incomplete building inspection
- Updated database schema to include building_inspection_id for linking room inspections to building inspections
- Fixed database constraint errors by properly handling null values for building inspection records

**July 19, 2025**
- Fixed critical startup issues preventing application from running
- Resolved missing zod import in server/routes.ts causing ReferenceError
- Fixed database constraint violations by making rating columns nullable for building inspections
- Updated database schema to match existing table structure with verified_rooms column
- Verified both single room and whole building inspection workflows are functioning correctly

**July 21, 2025**
- Fixed major syntax errors in whole-building-inspection.tsx that were preventing application startup
- Resolved JSX structure issues and missing closing tags causing pre-transform errors
- Fixed TypeScript errors by implementing missing functions and proper state management
- Corrected MobileCard component prop usage by removing unsupported description prop
- Application now successfully starts and runs without syntax errors
- Improved mobile experience by implementing dropdown-based rating system for Firefox Android compatibility
- Added mobile-friendly dropdown rating selectors that replace star buttons on mobile devices
- Enhanced mobile touch targets with larger button sizes and better spacing
- Updated both single room and whole building inspection forms for better mobile usability

**July 22, 2025**
- Fixed application startup failure caused by duplicate project structure conflicts
- Resolved build errors from conflicting custodial-criteria.ts exports
- Added comprehensive data summary and reporting functionality to inspection data page
- Implemented three summary views: by school, by room number, and by category
- Added aggregated statistics showing total inspections, average ratings, and performance metrics
- Created school-level summaries with category performance breakdowns
- Built room-specific summaries tracking inspection history and trends
- Added category analysis with rating distribution charts
- Enhanced data visualization with interactive filtering and sorting capabilities

**July 28, 2025**
- Fixed critical syntax error in shared/custodial-criteria.ts preventing application startup
- Resolved extra quotation mark and period causing JavaScript parse failure
- Enhanced "Start New Building Inspection" button with prominent blue styling, shadows, and clear visual definition
- Added building emoji icon and improved button contrast for better user experience
- Application now runs successfully without startup errors

**July 29, 2025**
- Fixed missing Replit plugin dependencies causing application startup failure
- Installed @replit/vite-plugin-runtime-error-modal and @replit/vite-plugin-cartographer packages
- Resolved module not found errors in vite.config.ts that prevented server from starting
- Application now successfully starts and runs on port 5000