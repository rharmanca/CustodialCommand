# Shared Services Management Application

A comprehensive custodial services management Progressive Web App (PWA) for detailed facility inspections and operational tracking.

## 🏢 Overview

This full-stack application provides custodial teams with powerful tools to conduct thorough facility inspections, track maintenance notes, and access motivational resources. Built with a retro propaganda poster aesthetic, it combines professional functionality with engaging visual design.

## ✨ Features

### 🔍 Dual Inspection Workflows
- **Single Room Inspections**: Quick assessments with immediate 11-category rating system
- **Whole Building Inspections**: Comprehensive multi-step workflow with progress tracking and save/resume functionality

### 📊 11-Point Rating System
Each inspection covers these critical areas (1-5 star ratings):
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

### 🏫 Multi-School Support
Supports inspections across multiple facilities:
- ASA (American School of Amsterdam)
- LCA (Liberty Christian Academy)
- GWC (Gateway Christian)
- OA (Oaks Academy)
- CBR (Cedar Brook)
- WLC (Westminster Learning Center)

### 📱 Progressive Web App
- Offline functionality with service worker
- Mobile installation support (iOS/Android)
- Native app-like experience
- Custom retro-themed icons

### 🎨 Gallery & Motivation
- Retro propaganda-style motivational posters
- High-resolution image viewing with modal functionality
- Downloadable content for team motivation

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Shadcn/UI** components with Radix UI primitives
- **Tailwind CSS** for styling
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Wouter** for client-side routing
- **Vite** for development and builds

### Backend
- **Node.js** with TypeScript
- **Express.js** REST API
- **PostgreSQL** database
- **Drizzle ORM** for type-safe database operations
- **Zod** for request validation

### Database Schema
- **Inspections**: Flexible table supporting both single room and building inspections
- **Room Inspections**: Individual room records for building inspection workflows
- **Custodial Notes**: Simple note-taking functionality
- **Users**: Authentication support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shared-services-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   NODE_ENV=development
   PORT=5000
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 📝 Usage

### Single Room Inspection
1. Navigate to the Custodial section
2. Select "Submit Inspection"
3. Choose school and location details
4. Rate all 11 categories using the star system
5. Add notes and submit

### Whole Building Inspection
1. Navigate to the Custodial section  
2. Select "Whole Building Inspection"
3. Create a new building inspection record
4. Complete room inspections by category
5. Track progress with the visual checklist
6. Submit when all requirements are met

### Viewing Data
- Access "Inspection Data" to view all completed inspections
- Filter and search through historical records
- Export data for reporting purposes

## 🏗️ Project Structure

```
├── client/src/           # React frontend application
│   ├── pages/           # Page components (Home, Custodial, Gallery)
│   ├── components/ui/   # Reusable UI components
│   └── lib/            # Utilities and query client
├── server/              # Express backend
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Database interface
│   └── db.ts          # Database connection
├── shared/             # Shared type definitions
│   └── schema.ts      # Drizzle schemas and Zod validation
└── public/            # Static assets and PWA files
```

## 🔧 Available Scripts

- `npm run dev` - Start development servers (frontend + backend)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:generate` - Generate database migrations

## 🌐 API Endpoints

### Inspections
- `GET /api/inspections` - Retrieve all inspections
- `POST /api/inspections` - Create new inspection
- `GET /api/inspections/:id` - Get specific inspection
- `PATCH /api/inspections/:id` - Update inspection

### Room Inspections
- `GET /api/room-inspections` - Get room inspections
- `POST /api/room-inspections` - Create room inspection

### Custodial Notes
- `GET /api/custodial-notes` - Retrieve all notes
- `POST /api/custodial-notes` - Create new note

## 🎨 Design System

The application features a distinctive retro propaganda poster aesthetic with:
- Vintage color palette
- Bold typography
- Motivational messaging
- Professional functionality

## 📱 PWA Installation

### iOS
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Confirm installation

### Android
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home Screen"
4. Confirm installation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for custodial teams who keep our facilities running smoothly
- Inspired by vintage propaganda poster design aesthetics
- Powered by modern web technologies for reliable performance

## 📞 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ for facility management excellence**