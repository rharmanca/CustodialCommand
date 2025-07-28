# Shared Services Management Application

## Overview

This is a comprehensive custodial services management Progressive Web App (PWA) built for detailed facility inspections and operational tracking. The application supports dual inspection workflows, multi-school operations, and offline functionality with a retro-themed interface designed for custodial teams.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite for fast development and optimized production builds
- **UI Components**: Shadcn/UI component library built on Radix UI primitives for accessible, modern interface elements
- **Styling**: Tailwind CSS with custom design system featuring retro propaganda-style theming
- **State Management**: TanStack Query for efficient server state management and caching
- **Mobile Optimization**: Custom hooks for mobile detection, touch-friendly interactions, and responsive design
- **PWA Features**: Service worker for offline functionality, web app manifest for native installation experience

### Backend Architecture
- **Runtime**: Node.js with TypeScript using ESM modules
- **Framework**: Express.js REST API with structured route handling
- **Database ORM**: Drizzle ORM providing type-safe database operations with PostgreSQL
- **Session Management**: Express sessions with PostgreSQL store using connect-pg-simple
- **Development Tools**: Hot reload with tsx, concurrent frontend/backend development servers

### Database Architecture
- **Primary Database**: PostgreSQL (configured for Neon serverless with WebSocket support)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection Handling**: Optimized connection pooling for serverless environments with proper WebSocket configuration

## Key Components

### Inspection System
The application provides two main inspection workflows:

1. **Single Room Inspections**: Quick assessments with immediate 11-category rating system
2. **Whole Building Inspections**: Comprehensive multi-step workflow with progress tracking and save/resume functionality

Each inspection covers 11 critical areas with 1-5 star ratings:
- Floors, Vertical/Horizontal Surfaces, Ceiling, Restrooms
- Customer Satisfaction, Trash Management, Project Cleaning
- Activity Support, Safety Compliance, Equipment, Monitoring

### Database Schema
- **Inspections Table**: Core inspection data with flexible schema supporting both single room and whole building inspections
- **Room Inspections Table**: Individual room data within building inspections
- **Custodial Notes Table**: Quick note-taking functionality for maintenance issues
- **Users Table**: Basic authentication system

### Multi-School Support
Supports inspections across six facilities:
- ASA (American School of Amsterdam)
- LCA (Liberty Christian Academy) 
- GWC (Gateway Christian)
- OA (Oaks Academy)
- CBR (Cedar Brook)
- WLC (Westminster Learning Center)

## Data Flow

### Inspection Workflow
1. User selects inspection type (single room or whole building)
2. Form submission validates data using Zod schemas
3. Data persists to PostgreSQL via Drizzle ORM
4. Real-time updates using TanStack Query for immediate UI feedback
5. Offline support through service worker caching

### Building Inspection Process
1. Initialize building inspection with metadata
2. Track completion requirements per room category
3. Submit individual room inspections that link to parent building inspection
4. Progress tracking with real-time checklist updates
5. Final submission only enabled when all requirements met

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL with WebSocket support for real-time connections
- **WebSocket Configuration**: Custom ws library integration for serverless compatibility

### UI & Development
- **Radix UI Primitives**: Accessible headless components for complex UI interactions
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Vite**: Modern build tool with React plugin and development server
- **Replit Integration**: Custom error overlay and cartographer plugin for development environment

### Authentication & Storage
- **Session Management**: PostgreSQL-backed sessions for persistent authentication
- **File Handling**: Image upload and storage capabilities with preview functionality

## Deployment Strategy

### Development Environment
- **Concurrent Servers**: Frontend (Vite dev server) and backend (tsx with hot reload) run simultaneously
- **Database**: Development database with live schema updates via Drizzle Kit
- **Asset Handling**: Static assets served from attached_assets directory with custom Vite alias

### Production Build
- **Frontend**: Vite builds optimized static assets to dist/public directory
- **Backend**: esbuild bundles server code with external package dependencies
- **Static Serving**: Express serves built frontend assets with API routes under /api prefix
- **PWA Deployment**: Service worker and manifest files for offline functionality and mobile installation

### Mobile & Legacy Support
- **Progressive Enhancement**: Graceful degradation for older browsers with polyfills
- **Touch Optimization**: Custom hooks for touch-friendly interactions and mobile-specific UI adjustments
- **Offline Capability**: Service worker caches essential resources with network-first strategy for API calls

The application is designed as a production-ready PWA with comprehensive mobile support, offline functionality, and a robust inspection workflow suitable for professional custodial operations across multiple facilities.