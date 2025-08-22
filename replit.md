# Custodial Command - Facility Management Application

## Overview

Custodial Command is a comprehensive Progressive Web App (PWA) designed for managing custodial services operations across educational facilities. The application provides real-time inspection tracking, data analytics, and mobile-first design for facility maintenance teams. It supports both single room assessments and comprehensive whole building inspections using an 11-category rating system based on APPA standards.

The system enables inspectors to conduct detailed facility assessments, track progress across multiple locations, capture photos for documentation, and generate comprehensive reports for facility management. Built with auto-save functionality and offline capabilities, it ensures no data loss during field inspections.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 with TypeScript**: Modern component-based architecture with strict type safety
- **Vite Build System**: Fast development server with hot module replacement and optimized production builds
- **Tailwind CSS + Shadcn/UI**: Utility-first styling with pre-built accessible components based on Radix UI primitives
- **Progressive Web App**: Installable application with offline capabilities, service worker caching, and native-like mobile experience
- **Client-side Routing**: Wouter router for lightweight navigation between inspection pages
- **State Management**: TanStack Query for server state with automatic caching and synchronization

### Backend Architecture
- **Express.js REST API**: Production-ready server with comprehensive middleware stack
- **TypeScript**: End-to-end type safety from database to frontend
- **Security Middleware**: Helmet for security headers, rate limiting, input sanitization, and CORS protection
- **Monitoring & Logging**: Structured JSON logging, performance monitoring, health checks, and metrics collection
- **Session Management**: Express sessions with PostgreSQL store for user authentication

### Database Design
- **PostgreSQL with Drizzle ORM**: Type-safe database operations with automatic schema generation
- **Multi-table Schema**: Separate tables for inspections, room inspections, custodial notes, and users
- **Flexible Inspection Types**: Single table supporting both individual room and whole building inspections
- **Image Storage**: Array fields for photo attachments and documentation
- **Progress Tracking**: Verified rooms array for tracking completion status in building inspections

### Mobile-First Design
- **Responsive Layout**: Touch-friendly interface optimized for mobile devices and tablets
- **Dropdown Rating System**: Mobile-optimized rating inputs replacing desktop star systems
- **Auto-save Functionality**: Local storage backup with 2-second intervals to prevent data loss
- **Offline Support**: Service worker implementation for inspection continuation without network connectivity

### Development Workflow
- **Hot Reload**: Vite development server with instant updates during development
- **Production Build**: Optimized bundle splitting and compression for fast loading
- **Database Migrations**: Drizzle Kit for schema versioning and deployment
- **Environment Configuration**: Separate development and production configurations

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL hosting with connection pooling optimized for Replit deployment
- **Drizzle ORM**: Database toolkit providing type-safe queries and automatic schema migrations

### UI Component Libraries
- **Radix UI Primitives**: Unstyled, accessible components for dialogs, forms, navigation, and data display
- **Shadcn/UI**: Pre-styled component library built on Radix UI with Tailwind CSS integration
- **React Hook Form**: Form handling with Zod validation for type-safe data collection

### Development Tools
- **Vite**: Build tool providing fast development server and optimized production builds
- **TypeScript**: Static type checking across the entire application stack
- **TanStack Query**: Server state management with automatic caching and background synchronization

### Production Services
- **Express Rate Limiting**: API protection against abuse and DDoS attacks
- **Helmet Security**: HTTP security headers and XSS protection
- **Compression Middleware**: Gzip compression for improved loading performance
- **File Upload Handling**: Multer for inspection photo processing and storage

### PWA Infrastructure
- **Web App Manifest**: Native app installation and launch configuration
- **Service Worker**: Offline caching strategy with cache-first fallback for essential resources
- **Workbox**: Advanced caching strategies and background sync capabilities