# Shared Services Management Application

## Overview
This is a full-stack web application designed for managing custodial services operations. It provides tools for conducting single area and whole building inspections, reporting custodial concerns, and visualizing inspection data. The application aims to streamline custodial management with features like comprehensive rating criteria, auto-save functionality, and a mobile-optimized interface, all within a retro propaganda poster aesthetic.

## User Preferences
Preferred communication style: Simple, everyday language.

**Project Maintenance Requirements:**
- README.md, LICENSE, and .gitignore files must be maintained and updated whenever working on the project
- Any architectural changes, new features, or significant modifications should be reflected in README.md
- Keep documentation current with actual project state

## Recent Changes
**Date: August 05, 2025**
- Fixed critical storage interface bug: Added missing deleteInspection method
- Enhanced input validation: Added NaN checks for all integer parsing in API routes
- Improved error handling: Replaced console.error with user-friendly alert messages
- Added try-catch blocks around FileReader operations for image uploads
- Implemented localStorage quota management with automatic cleanup of old drafts
- Enhanced service worker with better error handling for cache operations
- Added foreign key constraint between roomInspections and inspections tables
- Fixed image array validation in Zod schemas
- Improved user feedback for all form submissions and API errors

## System Architecture
### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system (cream, red, charcoal color scheme)
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite
- **Component Structure**: Modular with reusable UI components
- **Key Features**: Three-page application (Home, Custodial, Gallery), responsive design (mobile-first), form handling with React Hook Form and Zod validation, comprehensive data analytics with filtering, interactive star rating system (with mobile-friendly dropdowns).
- **PWA Capabilities**: Progressive Web App with manifest.json and service worker for offline functionality and mobile installation.

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Management**: Express sessions with PostgreSQL store
- **API Structure**: All API routes prefixed with `/api`, abstracted storage layer, centralized error handling.
- **Authentication**: User authentication with username/password, PostgreSQL database storage, Express sessions.
- **Inspection System**: PostgreSQL tables for inspections (11 rating categories), RESTful API, 1-5 star rating system, Zod schema validation.

### Build and Deployment Strategy
- **Development**: Concurrent Vite (frontend) and tsx (backend) servers with hot reload. Drizzle migrations for schema sync.
- **Production**: Backend bundled with esbuild, frontend built with Vite. Static assets served from `dist/public`.
- **Monorepo Structure**: Client, server, and shared directories for code organization.
- **Type Safety**: End-to-end TypeScript with shared schema definitions.
- **Build Strategy**: Separate bundling for frontend and backend with optimized production builds.

## External Dependencies
### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for PostgreSQL
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI component primitives
- **react-hook-form**: Form state management and validation
- **zod**: Schema validation
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **Vite**: Frontend build tool
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Drizzle Kit**: Database migration and schema management
- **tsx**: TypeScript execution for Node.js development
- **esbuild**: Bundler for Node.js production build

### UI Framework
- **Shadcn/UI**: Pre-built components
- **Class Variance Authority**: Component variant management
- **Lucide React**: Icon library