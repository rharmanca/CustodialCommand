# 🧹 Custodial Command

A comprehensive custodial inspection and management system built for educational institutions. This Progressive Web App (PWA) enables custodial staff to conduct inspections, report concerns, and track building cleanliness standards.

## ✨ Features

- **📱 Progressive Web App (PWA)** - Install on mobile devices for offline access
- **🏢 Building Inspections** - Complete whole-building or single-room inspections
- **📝 Custodial Notes** - Report and track custodial concerns
- **📊 Data Analytics** - View inspection data and generate reports
- **🔒 Admin Panel** - Administrative oversight and management
- **📱 Mobile Optimized** - Touch-friendly interface for mobile devices
- **⚡ Real-time Updates** - Live data synchronization

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or use free options like Supabase/Neon)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CustodialCommand-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your database URL
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

4. **Set up the database**
   ```bash
   # Push the database schema
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🗄️ Database Setup

### Option 1: Supabase (Recommended - Free)

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Get your connection string from Settings → Database
4. Update your `.env` file with the connection string

### Option 2: Neon (Alternative Free Option)

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new database
3. Copy the connection string
4. Update your `.env` file

### Option 3: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database named `custodial_command`
3. Update your `.env` file with local connection details

## 📱 PWA Installation

### On Mobile Devices

**iPhone/iPad:**
1. Open the app in Safari
2. Tap the Share button (□↗)
3. Select "Add to Home Screen"
4. Tap "Add"

**Android:**
1. Open the app in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home screen" or "Install app"
4. Tap "Add" or "Install"

## 🧪 Testing

### Run Comprehensive Tests
```bash
# Run all tests
npm run test:forms

# Health check
npm run test:health

# Debug mode
npm run test:debug
```

### Manual Testing
See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing instructions.

## 🏗️ Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Main application pages
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── assets/            # Static assets
├── server/                # Backend Express server
│   ├── routes.ts          # API route definitions
│   ├── security.ts        # Security middleware
│   ├── monitoring.ts      # Performance monitoring
│   └── logger.ts          # Logging utilities
├── shared/                # Shared code between frontend/backend
│   ├── schema.ts          # Database schema
│   └── custodial-criteria.ts # Business logic
└── uploads/               # File upload storage
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:client       # Start frontend only
npm run dev:server       # Start backend only

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Database
npm run db:push          # Push schema changes to database

# Testing
npm run test:forms       # Run comprehensive form tests
npm run test:health      # Health check test
npm run test:debug       # Debug mode testing

# Production
npm start                # Start production server
```

## 🔌 API Endpoints

### Inspections
- `GET /api/inspections` - Get all inspections
- `POST /api/inspections` - Create new inspection
- `GET /api/inspections/:id` - Get specific inspection
- `POST /api/room-inspections` - Create room inspection

### Custodial Notes
- `GET /api/custodial-notes` - Get all notes
- `POST /api/custodial-notes` - Create new note

### Admin
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/inspections` - Admin inspection data

### System
- `GET /health` - Health check
- `GET /metrics` - Performance metrics

## 🛡️ Security Features

- **Rate Limiting** - API request throttling
- **Input Sanitization** - XSS protection
- **CORS Configuration** - Cross-origin request security
- **Security Headers** - Helmet.js security middleware
- **Request Validation** - Input validation and sanitization

## 📊 Performance Monitoring

- **Request Timing** - Track slow requests
- **Memory Usage** - Monitor memory consumption
- **Error Tracking** - Comprehensive error logging
- **Health Checks** - System health monitoring

## 🚀 Deployment

### Railway (Recommended)
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Vercel** - Frontend deployment
- **Heroku** - Full-stack deployment
- **DigitalOcean** - VPS deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Database Connection Errors:**
- Verify `DATABASE_URL` is set correctly
- Check database server is running
- Ensure database exists

**Port Conflicts:**
```bash
# Kill processes on port 5000
kill -9 $(lsof -ti:5000) 2>/dev/null
```

**Form Submission Failures:**
- Check server logs for error details
- Verify all required fields are filled
- Check network connectivity

### Getting Help

1. Check the [TESTING_GUIDE.md](./TESTING_GUIDE.md)
2. Review server logs for error details
3. Verify environment configuration
4. Test database connectivity

## 🏆 Acknowledgments

- Built for educational institutions
- Designed for custodial staff efficiency
- Optimized for mobile-first usage
- "For the People!" - Shared Service Command

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Maintainer:** Shared Service Command
