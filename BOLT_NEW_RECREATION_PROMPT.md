# Complete Bolt.new Recreation Prompt for Custodial Command App

## Project Overview
Create a comprehensive Progressive Web App called "Custodial Command" for facility maintenance inspection management. This is a full-stack application with React frontend, Express backend, and PostgreSQL database using a retro propaganda poster aesthetic.

## Tech Stack Requirements
- **Frontend**: React 18 + TypeScript, Vite build tool
- **UI Library**: Shadcn/UI components with Tailwind CSS
- **Backend**: Express.js with TypeScript 
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **PWA**: Service worker, manifest.json, offline capabilities

## Design System & Theme
**Retro Propaganda Poster Aesthetic:**
- **Primary Colors**: Cream (#F5DEB3), Red (#B22222, #8B0000), Charcoal (#2F1B14)
- **Typography**: Bold, motivational messaging with strong contrast
- **Icons**: Use Lucide React icons
- **Layout**: Mobile-first responsive design with large touch targets
- **Fonts**: Inter font family from Google Fonts

## Database Schema (PostgreSQL with Drizzle ORM)

### Users Table
```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});
```

### Inspections Table
```typescript
export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  inspectorName: text("inspector_name"),
  school: text("school").notNull(),
  date: text("date").notNull(),
  inspectionType: text("inspection_type").notNull(), // 'single_room' or 'whole_building'
  locationDescription: text("location_description").notNull(),
  roomNumber: text("room_number"),
  locationCategory: text("location_category"),
  buildingName: text("building_name"),
  buildingInspectionId: integer("building_inspection_id"),
  // Rating categories (1-5 stars, nullable for building inspections)
  floors: integer("floors"),
  verticalHorizontalSurfaces: integer("vertical_horizontal_surfaces"),
  ceiling: integer("ceiling"),
  restrooms: integer("restrooms"),
  customerSatisfaction: integer("customer_satisfaction"),
  trash: integer("trash"),
  projectCleaning: integer("project_cleaning"),
  activitySupport: integer("activity_support"),
  safetyCompliance: integer("safety_compliance"),
  equipment: integer("equipment"),
  monitoring: integer("monitoring"),
  notes: text("notes"),
  images: text("images").array(),
  verifiedRooms: text("verified_rooms").array(),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Room Inspections Table
```typescript
export const roomInspections = pgTable("room_inspections", {
  id: serial("id").primaryKey(),
  buildingInspectionId: integer("building_inspection_id").notNull(),
  roomType: text("room_type").notNull(),
  roomIdentifier: text("room_identifier"),
  // Same 11 rating categories as above
  floors: integer("floors"),
  verticalHorizontalSurfaces: integer("vertical_horizontal_surfaces"),
  ceiling: integer("ceiling"),
  restrooms: integer("restrooms"),
  customerSatisfaction: integer("customer_satisfaction"),
  trash: integer("trash"),
  projectCleaning: integer("project_cleaning"),
  activitySupport: integer("activity_support"),
  safetyCompliance: integer("safety_compliance"),
  equipment: integer("equipment"),
  monitoring: integer("monitoring"),
  notes: text("notes"),
  images: text("images").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Custodial Notes Table
```typescript
export const custodialNotes = pgTable("custodial_notes", {
  id: serial("id").primaryKey(),
  school: text("school").notNull(),
  date: text("date").notNull(),
  location: text("location").notNull(),
  locationDescription: text("location_description").notNull(),
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Rating System (11 Categories)
Create a comprehensive 1-5 star rating system with detailed criteria for each category:

1. **Floors** - Cleanliness, shine, and condition of flooring
2. **Vertical/Horizontal Surfaces** - Walls, surfaces, windows
3. **Ceiling** - Dust, debris, and air vents
4. **Restrooms** - Cleanliness, supplies, odor, monitoring
5. **Customer Satisfaction** - Overall facility experience
6. **Trash** - Waste management and disposal
7. **Project Cleaning** - Special cleaning projects
8. **Activity Support** - Support for facility activities
9. **Safety Compliance** - Safety standards adherence
10. **Equipment** - Cleaning equipment condition
11. **Monitoring** - Oversight and quality control

**Rating Descriptions:**
- 5 Stars: "Orderly Spotlessness" - Showpiece Facility
- 4 Stars: "Ordinary Tidiness" - Comprehensive Care
- 3 Stars: "Casual Inattention" - Managed Care
- 2 Stars: "Moderate Dinginess" - Reactive
- 1 Star: "Unkempt Neglect" - Crisis

## Core App Features

### 1. Home Page
- Retro propaganda poster design with bold messaging
- Navigation cards for different inspection types
- PWA installation instructions for iOS/Android
- School selection dropdown: ASA, LCA, GWC, OA, CBR, WLC
- Mobile installation guide with step-by-step instructions

### 2. Single Room Inspection Page
- Dynamic form with all 11 rating categories
- Star rating system (mobile dropdown for touch compatibility)
- Auto-save every 2 seconds with localStorage backup
- Photo upload functionality with camera capture
- Location category dropdown with 10 predefined options
- Save/resume draft functionality
- Visual auto-save indicators with timestamps

### 3. Whole Building Inspection Page
- Multi-step inspection workflow
- Category-specific requirements (e.g., 3 classrooms, 2 restrooms)
- Real-time progress tracking with visual indicators
- Dynamic checklist system showing completion status
- Auto-save functionality for each room inspection
- Final submission only when all requirements met
- Progress detection for resuming incomplete inspections

### 4. Rating Criteria Reference Page
- Comprehensive guide showing detailed criteria for each rating level
- Interactive accordion layout for easy navigation
- Category-specific standards and examples
- Mobile-optimized display with clear typography

### 5. Data Analytics & Reporting Page
- Three summary views: by school, room number, and category
- Interactive filtering and sorting capabilities
- Performance metrics and trend analysis
- Visual charts using Recharts library
- Export capabilities for data analysis

### 6. Custodial Notes Page
- Additional feedback and concern reporting
- Photo upload with 5MB file limit per image
- Form validation with error handling
- Image preview and removal functionality

## Key Technical Requirements

### Auto-Save Functionality
- Save form drafts to localStorage every 2 seconds
- Visual indicators showing save status and timestamps
- Automatic resume of incomplete inspections
- Prevent data loss during navigation or crashes

### PWA Features
- Manifest.json with app icons and branding
- Service worker for offline functionality
- Installable on mobile devices (iOS/Android)
- Add to home screen capabilities
- Offline form draft storage

### Mobile Optimization
- Touch-friendly interface with 44px minimum touch targets
- Dropdown rating selectors for mobile devices (Firefox Android compatibility)
- Responsive design with mobile-first approach
- Camera integration for photo capture
- Optimized for various screen sizes and orientations

### Photo Upload System
- Multiple image upload with preview
- Camera capture integration
- File size validation (5MB limit)
- Error handling without alert() popups (use console.error instead)
- Image compression and optimization

### API Endpoints
```
GET/POST /api/inspections - Building inspection management
GET/POST /api/room-inspections - Individual room assessments
GET /api/inspections/:id/rooms - Building progress tracking
GET/POST /api/custodial-notes - Additional feedback submission
```

## Project Structure
```
src/
├── components/ui/ - Shadcn/UI components
├── pages/ - Route components
│   ├── custodial-inspection.tsx
│   ├── whole-building-inspection.tsx
│   ├── rating-criteria.tsx
│   ├── inspection-data.tsx
│   └── custodial-notes.tsx
├── hooks/ - Custom React hooks
├── lib/ - Utility functions and configurations
└── assets/ - Static assets and images

server/
├── index.ts - Express server setup
├── routes.ts - API route definitions
├── storage.ts - Database interface
└── db.ts - Database connection

shared/
├── schema.ts - Drizzle database schema
└── custodial-criteria.ts - Rating standards
```

## Critical Implementation Details

### Error Handling
- Never use alert() popups as they can cause navigation issues
- Use console.error() and console.log() for error messages
- Implement proper form validation with visual feedback
- Handle photo upload errors gracefully

### Data Persistence
- Use TanStack Query for server state management
- Implement proper cache invalidation after mutations
- Store drafts in localStorage with cleanup after submission
- Ensure database transactions for complex operations

### Performance Optimization
- Implement code splitting and lazy loading
- Optimize images and assets for mobile
- Use proper TypeScript types throughout
- Minimize bundle size with tree shaking

### Accessibility
- Ensure keyboard navigation support
- Implement proper ARIA labels
- Maintain color contrast ratios
- Support screen readers

## Development Scripts
```json
{
  "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
  "dev:server": "NODE_ENV=development tsx server/index.ts",
  "dev:client": "vite",
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js",
  "db:push": "drizzle-kit push"
}
```

## Environment Variables
```
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=development
PORT=5000
```

This prompt will recreate the complete Custodial Command application with all features, bug fixes, and optimizations intact. The app should be fully functional with inspection workflows, auto-save, PWA capabilities, and comprehensive data analytics.