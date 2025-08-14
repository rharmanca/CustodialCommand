# Custodial Command - Shared Service Management Application

A comprehensive Progressive Web App (PWA) for managing custodial services operations with real-time inspection tracking, data analytics, and mobile-first design.

## 🎯 Overview

Custodial Command is a full-stack web application built for facility maintenance teams to track and manage custodial inspections across multiple locations. Features include comprehensive room and building inspections, rating criteria standards, data reporting, and offline capabilities.

## ✨ Key Features

- **Single Room Inspections** - Detailed facility assessments with 11-category rating system
- **Whole Building Inspections** - Multi-category tracking with progress monitoring
- **Rating Criteria Guide** - Transparent inspection standards for consistent evaluations
- **Auto-Save Functionality** - Automatic draft saving every 2 seconds with localStorage backup
- **Data Analytics** - Comprehensive reporting with multiple view perspectives
- **Mobile Optimized** - Touch-friendly interface with dropdown ratings for mobile devices
- **Progressive Web App** - Installable app with offline capabilities
- **Photo Upload** - Image capture and attachment for inspection documentation

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for styling with custom retro design theme
- **Shadcn/UI** components built on Radix UI primitives
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Wouter** for client-side routing

### Backend
- **Express.js** REST API server
- **PostgreSQL** database with Neon serverless support
- **Drizzle ORM** for type-safe database operations
- **Express Sessions** with PostgreSQL store
- **File upload** handling for inspection photos

### Database Schema
- **Users** - Authentication and user management
- **Inspections** - Building-level inspection records
- **Room Inspections** - Individual room assessment data
- **Custodial Notes** - Additional feedback and concerns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file with your database connection:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   ```

3. **Database Setup:**
   ```bash
   npm run db:push
   ```

4. **Development:**
   ```bash
   npm run dev
   ```
   
   Access the app at `http://localhost:5000`

5. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

## 📱 Progressive Web App Features

- **Installable** on iOS and Android devices
- **Offline Support** with service worker caching
- **Mobile Installation Instructions** provided in-app
- **Custom PWA Icons** with retro theme design
- **Auto-save Drafts** stored locally for offline resilience

## 🎨 Design System

The app features a distinctive retro propaganda poster aesthetic:
- **Colors**: Cream (#F5DEB3), Red (#B22222/#8B0000), Charcoal (#2F1B14)
- **Typography**: Bold, motivational messaging
- **UI Components**: Consistent Shadcn/UI design system
- **Mobile-First**: Responsive design optimized for touch interfaces

## 📊 Inspection Categories

The rating system covers 11 comprehensive categories:
- Floors
- Vertical/Horizontal Surfaces  
- Ceiling
- Restrooms
- Customer Satisfaction
- Trash Management
- Project Cleaning
- Activity Support
- Safety Compliance
- Equipment
- Monitoring

Each category uses a 1-5 star rating system with detailed criteria standards.

## 🗄️ Database Configuration

### Supported Databases
- **PostgreSQL** (recommended)
- **Neon Serverless** for production deployments

### Schema Management
- **Drizzle ORM** for type-safe operations
- **Migration Management** via `npm run db:push`
- **Auto-generated Types** from database schema

## 🔧 API Endpoints

- `GET/POST /api/inspections` - Building inspection management
- `GET/POST /api/room-inspections` - Individual room assessments  
- `GET/POST /api/custodial-notes` - Additional feedback submission
- `GET /api/inspections/:id/rooms` - Building progress tracking

## 📈 Data Analytics Features

- **School-Level Summaries** with category performance breakdowns
- **Room-Specific Analysis** tracking inspection history and trends
- **Category Performance** with rating distribution visualization
- **Interactive Filtering** by school, room number, and inspection type
- **Export Capabilities** for data analysis and reporting

## 🛠️ Development Guidelines

### Code Organization
- `/src/pages` - Route components
- `/src/components` - Reusable UI components
- `/server` - Express API and database logic
- `/shared` - Common types and schemas

### Best Practices
- TypeScript for type safety
- Zod schema validation
- Responsive mobile-first design
- Progressive enhancement
- Error boundary implementation

## 🚀 Deployment

### Production Requirements
- Node.js 18+ runtime
- PostgreSQL database
- HTTPS enabled (for PWA features)
- Static file serving configured

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
PORT=3000
```

### Build Process
```bash
npm run build  # Builds frontend and backend
npm start      # Runs production server
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues or questions, please create an issue in the repository or contact the development team.

---

Built with ❤️ for custodial service excellence.