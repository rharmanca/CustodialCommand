# Custodial Inspection Tracker

A standalone Progressive Web App (PWA) for facility custodial inspection tracking and maintenance management.

## Features

- **Detailed Inspections**: Submit comprehensive facility inspections with 11-category star ratings
- **Quick Notes**: Submit simple custodial notes for quick issues
- **Data Viewing**: View all inspections and notes in organized tabs
- **Photo Upload**: Attach photos to inspection reports
- **Offline Support**: Works offline after installation
- **Mobile-First**: Optimized for mobile devices with PWA installation

## Installation

### For Users
1. Visit the app in your mobile browser
2. Follow the installation instructions on the home page
3. Install as a PWA for offline access

### For Developers

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database:**
   - Ensure you have a PostgreSQL database
   - Set the `DATABASE_URL` environment variable
   ```bash
   npm run db:push
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with retro theme
- **PWA**: Service Worker + Web App Manifest
- **Build**: Vite + esbuild

## Database Schema

### Inspections
- 11 rating categories (1-5 star system)
- Individual comments for each category
- Photo attachments
- Facility and inspector information

### Custodial Notes
- Quick issue reporting
- Priority levels
- Status tracking
- Facility information

## API Endpoints

- `POST /api/inspections` - Submit new inspection
- `GET /api/inspections` - Get all inspections
- `GET /api/inspections/:id` - Get specific inspection
- `POST /api/custodial-notes` - Submit new note
- `GET /api/custodial-notes` - Get all notes
- `GET /api/custodial-notes/:id` - Get specific note

## Inspection Categories

1. General Cleanliness
2. Restroom Cleanliness
3. Floor Maintenance
4. Window Cleanliness
5. Trash Removal
6. Supplies Stocking
7. Equipment Maintenance
8. Safety Compliance
9. Timeliness
10. Professionalism
11. Responsiveness to Feedback

## PWA Features

- **Offline Access**: Previously viewed pages work offline
- **Home Screen Installation**: Install like a native app
- **Custom Icons**: Professional custodial-themed icons
- **Service Worker**: Caches resources for offline use
- **Responsive Design**: Works on all device sizes

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - development or production
- `PORT` - Server port (default: 5000)

## License

MIT License - See LICENSE file for details