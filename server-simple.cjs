// Full-featured server with all API routes
const express = require('express');
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const crypto = require('crypto');

// Environment variables are loaded by Railway automatically
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL must be set');
  process.exit(1);
}

// Safety check: Ensure we're using NeonDB, not Railway's PostgreSQL
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('neon.tech')) {
  console.error('⚠️  WARNING: DATABASE_URL does not point to NeonDB!');
  console.error('Expected: neon.tech domain');
  console.error('Current:', process.env.DATABASE_URL);
  console.error('This will cause database driver mismatch errors.');
  process.exit(1);
}

console.log('✅ Database configuration verified: Using NeonDB');

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);
const HOST = "0.0.0.0";

// Trust proxy for Railway deployment (fixes rate limiting warnings)
app.set('trust proxy', 1);

// Database setup
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Simple file storage service for Railway
class FileStorageService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      await fs.mkdir(this.uploadDir, { recursive: true });
      console.log('Created uploads directory');
    }
  }

  async uploadFile(buffer, originalName, mimeType) {
    try {
      // Generate unique filename
      const fileExtension = originalName.split('.').pop() || '';
      const uniqueId = crypto.randomUUID();
      const filename = `${uniqueId}.${fileExtension}`;
      const filepath = path.join(this.uploadDir, filename);

      // Save file
      await fs.writeFile(filepath, buffer);

      // Return URL path
      return `/uploads/${filename}`;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getFile(filename) {
    try {
      const filepath = path.join(this.uploadDir, filename);
      const buffer = await fs.readFile(filepath);
      return buffer;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  async deleteFile(filename) {
    try {
      const filepath = path.join(this.uploadDir, filename);
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

const fileStorage = new FileStorageService();

// Import schema definitions (we'll define them inline for CommonJS compatibility)
const inspections = {
  id: 'id',
  inspectorName: 'inspector_name',
  school: 'school',
  date: 'date',
  inspectionType: 'inspection_type',
  locationDescription: 'location_description',
  roomNumber: 'room_number',
  locationCategory: 'location_category',
  buildingName: 'building_name',
  buildingInspectionId: 'building_inspection_id',
  floors: 'floors',
  verticalHorizontalSurfaces: 'vertical_horizontal_surfaces',
  ceiling: 'ceiling',
  restrooms: 'restrooms',
  customerSatisfaction: 'customer_satisfaction',
  trash: 'trash',
  projectCleaning: 'project_cleaning',
  activitySupport: 'activity_support',
  safetyCompliance: 'safety_compliance',
  equipment: 'equipment',
  monitoring: 'monitoring',
  notes: 'notes',
  images: 'images',
  verifiedRooms: 'verified_rooms',
  isCompleted: 'is_completed',
  createdAt: 'created_at'
};

const custodialNotes = {
  id: 'id',
  school: 'school',
  date: 'date',
  location: 'location',
  locationDescription: 'location_description',
  notes: 'notes',
  images: 'images',
  createdAt: 'created_at'
};

const roomInspections = {
  id: 'id',
  buildingInspectionId: 'building_inspection_id',
  roomType: 'room_type',
  roomIdentifier: 'room_identifier',
  floors: 'floors',
  verticalHorizontalSurfaces: 'vertical_horizontal_surfaces',
  ceiling: 'ceiling',
  restrooms: 'restrooms',
  customerSatisfaction: 'customer_satisfaction',
  trash: 'trash',
  projectCleaning: 'project_cleaning',
  activitySupport: 'activity_support',
  safetyCompliance: 'safety_compliance',
  equipment: 'equipment',
  monitoring: 'monitoring',
  notes: 'notes',
  images: 'images',
  createdAt: 'created_at'
};

// Configure multer for file uploads (5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for sensitive endpoints
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/admin/', strictLimiter);

// Basic middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// CORS middleware (more restrictive for production)
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://cacustodialcommand.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Input validation middleware
const validateInput = (req, res, next) => {
  // Basic XSS protection
  const sanitizeInput = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        obj[key] = sanitizeInput(obj[key]);
      }
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  
  next();
};

app.use(validateInput);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Basic API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Inspection routes
app.post('/api/inspections', upload.array('images'), async (req, res) => {
  console.log('[POST] Building inspection submission started', {
    body: req.body,
    files: req.files ? req.files.length : 0
  });

  try {
    const { inspectorName, school, inspectionType } = req.body;
    const files = req.files;

    // Validate required fields
    if (!school || !inspectionType) {
      console.warn('[POST] Missing required fields', { school, inspectionType });
      return res.status(400).json({
        message: 'Missing required fields',
        details: { school: !!school, inspectionType: !!inspectionType }
      });
    }

    let imageUrls = [];

    // Process uploaded files using file storage service
    if (files && files.length > 0) {
      console.log('[POST] Processing uploaded files', { count: files.length });

      for (const file of files) {
        try {
          const imageUrl = await fileStorage.uploadFile(file.buffer, file.originalname, file.mimetype);
          imageUrls.push(imageUrl);
          console.log('[POST] File uploaded successfully', { filename: file.originalname, url: imageUrl });
        } catch (uploadError) {
          console.error('[POST] Error uploading file:', uploadError);
          // Continue with other files even if one fails
        }
      }
    }

    const inspectionData = {
      inspectorName: inspectorName || "",
      school,
      date: req.body.date || new Date().toISOString(),
      inspectionType,
      locationDescription: req.body.locationDescription || '',
      roomNumber: req.body.roomNumber || null,
      locationCategory: req.body.locationCategory || null,
      floors: req.body.floors || null,
      verticalHorizontalSurfaces: req.body.verticalHorizontalSurfaces || null,
      ceiling: req.body.ceiling || null,
      restrooms: req.body.restrooms || null,
      customerSatisfaction: req.body.customerSatisfaction || null,
      trash: req.body.trash || null,
      projectCleaning: req.body.projectCleaning || null,
      activitySupport: req.body.activitySupport || null,
      safetyCompliance: req.body.safetyCompliance || null,
      equipment: req.body.equipment || null,
      monitoring: req.body.monitoring || null,
      notes: req.body.notes || null,
      images: imageUrls,
      verifiedRooms: [],
      isCompleted: false
    };

    console.log('[POST] Creating building inspection', { inspectionData });

    // Insert into database
    try {
      const result = await sql`
        INSERT INTO inspections (
          inspector_name, school, date, inspection_type, location_description,
          room_number, location_category, floors, vertical_horizontal_surfaces,
          ceiling, restrooms, customer_satisfaction, trash, project_cleaning,
          activity_support, safety_compliance, equipment, monitoring, notes,
          images, verified_rooms, is_completed
        ) VALUES (
          ${inspectionData.inspectorName}, ${inspectionData.school}, ${inspectionData.date},
          ${inspectionData.inspectionType}, ${inspectionData.locationDescription},
          ${inspectionData.roomNumber}, ${inspectionData.locationCategory},
          ${inspectionData.floors}, ${inspectionData.verticalHorizontalSurfaces},
          ${inspectionData.ceiling}, ${inspectionData.restrooms},
          ${inspectionData.customerSatisfaction}, ${inspectionData.trash},
          ${inspectionData.projectCleaning}, ${inspectionData.activitySupport},
          ${inspectionData.safetyCompliance}, ${inspectionData.equipment},
          ${inspectionData.monitoring}, ${inspectionData.notes},
          ${inspectionData.images}, ${inspectionData.verifiedRooms},
          ${inspectionData.isCompleted}
        ) RETURNING id
      `;

      const newId = result[0].id;
      console.log('[POST] Building inspection created successfully', { id: newId });

      res.status(201).json({
        message: 'Building inspection created successfully',
        id: newId,
        imageCount: imageUrls.length
      });
    } catch (dbError) {
      console.error('[POST] Database error creating inspection:', dbError);
      res.status(500).json({ message: 'Database error creating inspection' });
    }

  } catch (error) {
    console.error('[POST] Error creating building inspection:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get("/api/inspections", async (req, res) => {
  try {
    const { type, incomplete } = req.query;
    
    // Fetch inspections from database
    let result;
    
    if (type === 'whole_building' && incomplete === 'true') {
      result = await sql`
        SELECT * FROM inspections 
        WHERE inspection_type = 'whole_building' AND is_completed = false 
        ORDER BY created_at DESC
      `;
    } else {
      result = await sql`
        SELECT * FROM inspections ORDER BY created_at DESC
      `;
    }
    
    // Transform the data to match the expected format
    const inspections = result.map(row => ({
      id: row.id,
      inspectorName: row.inspector_name,
      school: row.school,
      date: row.date,
      inspectionType: row.inspection_type,
      locationDescription: row.location_description,
      roomNumber: row.room_number,
      locationCategory: row.location_category,
      buildingName: row.building_name,
      buildingInspectionId: row.building_inspection_id,
      floors: row.floors,
      verticalHorizontalSurfaces: row.vertical_horizontal_surfaces,
      ceiling: row.ceiling,
      restrooms: row.restrooms,
      customerSatisfaction: row.customer_satisfaction,
      trash: row.trash,
      projectCleaning: row.project_cleaning,
      activitySupport: row.activity_support,
      safetyCompliance: row.safety_compliance,
      equipment: row.equipment,
      monitoring: row.monitoring,
      notes: row.notes,
      images: row.images || [],
      verifiedRooms: row.verified_rooms || [],
      isCompleted: row.is_completed,
      createdAt: row.created_at
    }));
    
    console.log(`[GET] Found ${inspections.length} total inspections`);
    res.json(inspections);
  } catch (error) {
    console.error("Error fetching inspections:", error);
    res.status(500).json({ error: "Failed to fetch inspections" });
  }
});

app.get("/api/inspections/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid inspection ID" });
    }

    // Fetch inspection from database
    const result = await sql`
      SELECT * FROM inspections WHERE id = ${id}
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: "Inspection not found" });
    }

    const row = result[0];
    const inspection = {
      id: row.id,
      inspectorName: row.inspector_name,
      school: row.school,
      date: row.date,
      inspectionType: row.inspection_type,
      locationDescription: row.location_description,
      roomNumber: row.room_number,
      locationCategory: row.location_category,
      buildingName: row.building_name,
      buildingInspectionId: row.building_inspection_id,
      floors: row.floors,
      verticalHorizontalSurfaces: row.vertical_horizontal_surfaces,
      ceiling: row.ceiling,
      restrooms: row.restrooms,
      customerSatisfaction: row.customer_satisfaction,
      trash: row.trash,
      projectCleaning: row.project_cleaning,
      activitySupport: row.activity_support,
      safetyCompliance: row.safety_compliance,
      equipment: row.equipment,
      monitoring: row.monitoring,
      notes: row.notes,
      images: row.images || [],
      verifiedRooms: row.verified_rooms || [],
      isCompleted: row.is_completed,
      createdAt: row.created_at
    };

    res.json(inspection);
  } catch (error) {
    console.error("Error fetching inspection:", error);
    res.status(500).json({ error: "Failed to fetch inspection" });
  }
});

// Custodial Notes routes
app.post("/api/custodial-notes", upload.array('images'), async (req, res) => {
  console.log('[POST] Custodial Notes submission started', {
    body: req.body,
    files: req.files ? req.files.length : 0
  });

  try {
    const { school, date, locationDescription, location, notes } = req.body;
    const files = req.files;

    // Validate required fields
    if (!school || !date || !location) {
      console.warn('[POST] Missing required fields', { school, date, location });
      return res.status(400).json({
        message: 'Missing required fields',
        details: { school: !!school, date: !!date, location: !!location }
      });
    }

    let imageUrls = [];

    // Process uploaded files using file storage service
    if (files && files.length > 0) {
      console.log('[POST] Processing uploaded files', { count: files.length });

      for (const file of files) {
        try {
          const imageUrl = await fileStorage.uploadFile(file.buffer, file.originalname, file.mimetype);
          imageUrls.push(imageUrl);
          console.log('[POST] File uploaded successfully', { filename: file.originalname, url: imageUrl });
        } catch (uploadError) {
          console.error('[POST] Error uploading file:', uploadError);
          // Continue with other files even if one fails
        }
      }
    }

    const custodialNote = {
      school,
      date,
      location,
      locationDescription: locationDescription || '',
      notes: notes || '',
      images: imageUrls
    };

    console.log('[POST] Creating custodial note', { custodialNote });

    // Insert into database
    try {
      const result = await sql`
        INSERT INTO custodial_notes (
          school, date, location, location_description, notes
        ) VALUES (
          ${custodialNote.school}, ${custodialNote.date}, ${custodialNote.location},
          ${custodialNote.locationDescription}, ${custodialNote.notes}
        ) RETURNING id
      `;

      const newId = result[0].id;
      console.log('[POST] Custodial note created successfully', { id: newId });

      res.status(201).json({
        message: 'Custodial note submitted successfully',
        id: newId,
        imageCount: imageUrls.length
      });
    } catch (dbError) {
      console.error('[POST] Database error creating custodial note:', dbError);
      res.status(500).json({ message: 'Database error creating custodial note' });
    }

  } catch (error) {
    console.error('[POST] Error creating custodial note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get("/api/custodial-notes", async (req, res) => {
  try {
    // Fetch custodial notes from database
    const result = await sql`
      SELECT * FROM custodial_notes ORDER BY created_at DESC
    `;
    
    // Transform the data to match the expected format
    const custodialNotes = result.map(row => ({
      id: row.id,
      school: row.school,
      date: row.date,
      location: row.location,
      locationDescription: row.location_description,
      notes: row.notes,
      images: row.images || [],
      createdAt: row.created_at
    }));
    
    res.json(custodialNotes);
  } catch (error) {
    console.error("Error fetching custodial notes:", error);
    res.status(500).json({ error: "Failed to fetch custodial notes" });
  }
});

// Room Inspection routes
app.post("/api/room-inspections", async (req, res) => {
  try {
    console.log("[POST] Creating room inspection with data:", JSON.stringify(req.body, null, 2));

    const { buildingInspectionId: buildingInspectionIdStr, roomType, roomIdentifier, floors, verticalHorizontalSurfaces, ceiling, restrooms, customerSatisfaction, trash, projectCleaning, activitySupport, safetyCompliance, equipment, monitoring, notes, images, responses } = req.body;
    const buildingInspectionId = parseInt(buildingInspectionIdStr, 10);

    // Validate required fields
    if (!buildingInspectionIdStr || !roomType || isNaN(buildingInspectionId)) {
      return res.status(400).json({
        error: "Missing required fields",
        details: { buildingInspectionId: !!buildingInspectionIdStr, roomType: !!roomType }
      });
    }

    // Insert into database
    const result = await sql`
      INSERT INTO room_inspections (
        building_inspection_id, room_type, room_identifier, floors,
        vertical_horizontal_surfaces, ceiling, restrooms, customer_satisfaction,
        trash, project_cleaning, activity_support, safety_compliance,
        equipment, monitoring, notes, images
      ) VALUES (
        ${buildingInspectionId}, ${roomType}, ${roomIdentifier || null},
        ${floors || null}, ${verticalHorizontalSurfaces || null}, ${ceiling || null},
        ${restrooms || null}, ${customerSatisfaction || null}, ${trash || null},
        ${projectCleaning || null}, ${activitySupport || null}, ${safetyCompliance || null},
        ${equipment || null}, ${monitoring || null}, ${notes || null},
        ${images || []}
      ) RETURNING id
    `;

    const newId = result[0].id;
    console.log("[POST] Room inspection created successfully", { id: newId });

    res.status(201).json({
      id: newId,
      message: 'Room inspection created successfully'
    });
  } catch (error) {
    console.error("Error creating room inspection:", error);
    res.status(500).json({ error: "Failed to create room inspection" });
  }
});

app.get("/api/room-inspections", async (req, res) => {
  try {
    const { buildingInspectionId } = req.query;
    
    let result;
    
    if (buildingInspectionId) {
      result = await sql`
        SELECT * FROM room_inspections 
        WHERE building_inspection_id = ${buildingInspectionId} 
        ORDER BY created_at DESC
      `;
    } else {
      result = await sql`
        SELECT * FROM room_inspections ORDER BY created_at DESC
      `;
    }
    
    // Transform the data to match the expected format
    const roomInspections = result.map(row => ({
      id: row.id,
      buildingInspectionId: row.building_inspection_id,
      roomType: row.room_type,
      roomIdentifier: row.room_identifier,
      floors: row.floors,
      verticalHorizontalSurfaces: row.vertical_horizontal_surfaces,
      ceiling: row.ceiling,
      restrooms: row.restrooms,
      customerSatisfaction: row.customer_satisfaction,
      trash: row.trash,
      projectCleaning: row.project_cleaning,
      activitySupport: row.activity_support,
      safetyCompliance: row.safety_compliance,
      equipment: row.equipment,
      monitoring: row.monitoring,
      notes: row.notes,
      images: row.images || [],
      createdAt: row.created_at
    }));
    
    res.json(roomInspections);
  } catch (error) {
    console.error("Error fetching room inspections:", error);
    res.status(500).json({ error: "Failed to fetch room inspections" });
  }
});

// Admin authentication endpoints
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Check credentials against environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
    }

    if (username === adminUsername && password === adminPassword) {
      // Generate a simple session token (in production, use JWT)
      const sessionToken = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store session (in production, use Redis or database)
      if (!global.adminSessions) {
        global.adminSessions = new Map();
      }
      global.adminSessions.set(sessionToken, {
        username,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      console.log('Admin login successful', { username });
      
      res.json({ 
        success: true, 
        message: 'Login successful',
        sessionToken 
      });
    } else {
      console.warn('Admin login failed', { username });
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('Admin login error', { error });
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Admin session validation middleware
const validateAdminSession = (req, res, next) => {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return res.status(401).json({ 
      success: false, 
      message: 'No session token provided' 
    });
  }

  if (!global.adminSessions) {
    return res.status(401).json({ 
      success: false, 
      message: 'No active sessions' 
    });
  }

  const session = global.adminSessions.get(sessionToken);
  
  if (!session) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid session token' 
    });
  }

  if (new Date() > session.expiresAt) {
    global.adminSessions.delete(sessionToken);
    return res.status(401).json({ 
      success: false, 
      message: 'Session expired' 
    });
  }

  // Add session info to request
  req.adminSession = session;
  next();
};

// Protected admin routes
app.get('/api/admin/inspections', validateAdminSession, async (req, res) => {
  try {
    const result = await sql`
      SELECT * FROM inspections ORDER BY created_at DESC
    `;
    
    const inspections = result.map(row => ({
      id: row.id,
      inspectorName: row.inspector_name,
      school: row.school,
      date: row.date,
      inspectionType: row.inspection_type,
      locationDescription: row.location_description,
      roomNumber: row.room_number,
      locationCategory: row.location_category,
      buildingName: row.building_name,
      buildingInspectionId: row.building_inspection_id,
      floors: row.floors,
      verticalHorizontalSurfaces: row.vertical_horizontal_surfaces,
      ceiling: row.ceiling,
      restrooms: row.restrooms,
      customerSatisfaction: row.customer_satisfaction,
      trash: row.trash,
      projectCleaning: row.project_cleaning,
      activitySupport: row.activity_support,
      safetyCompliance: row.safety_compliance,
      equipment: row.equipment,
      monitoring: row.monitoring,
      notes: row.notes,
      images: row.images || [],
      verifiedRooms: row.verified_rooms || [],
      isCompleted: row.is_completed,
      createdAt: row.created_at
    }));
    
    res.json({ success: true, data: inspections });
  } catch (error) {
    console.error('Error fetching admin inspections', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.delete('/api/admin/inspections/:id', validateAdminSession, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid inspection ID' });
    }
    
    const result = await sql`
      DELETE FROM inspections WHERE id = ${id} RETURNING id
    `;
    
    if (result.length > 0) {
      res.json({ success: true, message: 'Inspection deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Inspection not found' });
    }
  } catch (error) {
    console.error('Error deleting admin inspection', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// File serving route with proper error handling
app.get('/uploads/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const buffer = await fileStorage.getFile(filename);
    
    if (!buffer) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    res.set({
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=31536000', // 1 year cache
    });

    res.send(buffer);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files from dist/public
app.use(express.static(path.join(process.cwd(), 'dist/public')));

// Catch-all handler for frontend routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  // Serve the React app for all other routes
  res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔧 API endpoints: http://${HOST}:${PORT}/api/*`);
});

module.exports = app;
