import type { Express } from "express";
import { createServer, type Server } from "http";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { insertInspectionSchema, insertCustodialNoteSchema, insertRoomInspectionSchema } from "../shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Add async wrapper for better error handling
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Configure multer for file uploads (5MB limit to match client-side)
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + random + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_config,
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

export async function registerRoutes(app: Express): Promise<void> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Inspection routes
  app.post("/api/inspections", asyncHandler(async (req: Request, res: Response) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] POST /api/inspections - Starting submission`);
    console.log(`[${requestId}] Request body keys:`, Object.keys(req.body));
    console.log(`[${requestId}] Request body:`, JSON.stringify(req.body, null, 2));
    
    try {
      console.log(`[${requestId}] Validating data with schema...`);
      const validatedData = insertInspectionSchema.parse(req.body);
      console.log(`[${requestId}] Validation successful, creating inspection...`);
      
      const inspection = await storage.createInspection(validatedData);
      console.log(`[${requestId}] Inspection created successfully with ID:`, inspection.id);
      
      res.json(inspection);
    } catch (error) {
      console.error(`[${requestId}] Error creating inspection:`, error);
      
      if (error instanceof z.ZodError) {
        console.error(`[${requestId}] Validation errors:`, error.errors);
        res.status(400).json({ 
          error: "Invalid inspection data", 
          details: error.errors,
          requestId 
        });
      } else {
        console.error(`[${requestId}] Database or server error:`, error);
        res.status(500).json({ 
          error: "Failed to create inspection",
          message: process.env.NODE_ENV === 'development' ? 
            (error instanceof Error ? error.message : 'Unknown error') : 
            'Server error occurred',
          requestId
        });
      }
    }
  }));

  app.get("/api/inspections", async (req: any, res: any) => {
    try {
      const { type, incomplete } = req.query;
      let inspections;
      
      inspections = await storage.getInspections();
      console.log(`[GET] Found ${inspections.length} total inspections`);
      
      if (type === 'whole_building' && incomplete === 'true') {
        const beforeFilter = inspections.length;
        inspections = inspections.filter(inspection => 
          inspection.inspectionType === 'whole_building' && !inspection.isCompleted
        );
        console.log(`[GET] Filtered whole_building incomplete: ${beforeFilter} → ${inspections.length} inspections`);
        console.log(`[GET] Incomplete inspections:`, inspections.map(i => ({ id: i.id, school: i.school, isCompleted: i.isCompleted })));
      }
      
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      res.status(500).json({ error: "Failed to fetch inspections" });
    }
  });

  app.get("/api/inspections/:id", async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      const inspection = await storage.getInspection(id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      res.status(500).json({ error: "Failed to fetch inspection" });
    }
  });

  // Custodial Notes routes - now supports file uploads
  app.post("/api/custodial-notes", upload.array('image', 5), async (req: any, res: any) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      console.log(`[${requestId}] POST /api/custodial-notes - Starting submission`);
      console.log(`[${requestId}] Body:`, req.body);
      console.log(`[${requestId}] Files:`, req.files?.map((f: any) => ({ name: f.originalname, size: f.size, path: f.path })));
      
      // Handle case where files are sent with indexed names (image_0, image_1, etc.)
      let imageFiles = req.files || [];
      
      // If no files in standard array, check for indexed field names
      if (!imageFiles.length && req.body) {
        const fileFields = Object.keys(req.body).filter(key => key.startsWith('image_'));
        if (fileFields.length > 0) {
          console.log("Found indexed image fields, but files should be in req.files");
        }
      }
      
      // Prepare data for database - combine form fields with file paths
      const noteData = {
        inspectorName: req.body.inspectorName,
        school: req.body.school,
        date: req.body.date,
        location: req.body.location,
        locationDescription: req.body.locationDescription,
        notes: req.body.notes
      };
      
      // Add file paths to notes if images were uploaded
      if (imageFiles.length > 0) {
        const imagePaths = imageFiles.map((file: any) => file.path).join(', ');
        noteData.notes = `${noteData.notes}\n\nUploaded Images: ${imagePaths}`;
      }
      
      console.log("Validating data:", noteData);
      const validatedData = insertCustodialNoteSchema.parse(noteData);
      
      const custodialNote = await storage.createCustodialNote(validatedData);
      
      console.log("Successfully created custodial note:", custodialNote.id);
      res.json(custodialNote);
      
    } catch (error) {
      console.error("Error creating custodial note:", error);
      
      // Clean up uploaded files if database save failed
      if (req.files) {
        req.files.forEach((file: any) => {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error("Error cleaning up file:", unlinkError);
          }
        });
      }
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid custodial note data", 
          details: error.errors,
          message: "Please check all required fields are filled correctly"
        });
      } else if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ 
            error: "File too large",
            message: "Maximum file size is 5MB per file"
          });
        } else if (error.code === 'LIMIT_FILE_COUNT') {
          res.status(400).json({ 
            error: "Too many files",
            message: "Maximum 5 files allowed"
          });
        } else {
          res.status(400).json({ 
            error: "File upload error",
            message: error.message
          });
        }
      } else {
        res.status(500).json({ 
          error: "Failed to create custodial note",
          message: "Server error occurred. Please try again."
        });
      }
    }
  });

  app.get("/api/custodial-notes", async (req: any, res: any) => {
    try {
      const custodialNotes = await storage.getCustodialNotes();
      res.json(custodialNotes);
    } catch (error) {
      console.error("Error fetching custodial notes:", error);
      res.status(500).json({ error: "Failed to fetch custodial notes" });
    }
  });

  app.get("/api/custodial-notes/:id", async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid custodial note ID" });
      }
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid custodial note ID" });
      }
      const custodialNote = await storage.getCustodialNote(id);
      if (!custodialNote) {
        return res.status(404).json({ error: "Custodial note not found" });
      }
      res.json(custodialNote);
    } catch (error) {
      console.error("Error fetching custodial note:", error);
      res.status(500).json({ error: "Failed to fetch custodial note" });
    }
  });

  // Update inspection (for marking building inspections as completed)
  app.patch("/api/inspections/:id", async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      const updates = req.body;
      console.log(`[PATCH] Updating inspection ${id} with:`, updates);
      
      const inspection = await storage.updateInspection(id, updates);
      if (!inspection) {
        console.log(`[PATCH] Inspection ${id} not found`);
        return res.status(404).json({ error: "Inspection not found" });
      }
      
      console.log(`[PATCH] Successfully updated inspection ${id}. isCompleted: ${inspection.isCompleted}`);
      res.json(inspection);
    } catch (error) {
      console.error("Error updating inspection:", error);
      res.status(500).json({ error: "Failed to update inspection" });
    }
  });

  // Delete inspection
  app.delete("/api/inspections/:id", async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      const success = await storage.deleteInspection(id);
      if (!success) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json({ message: "Inspection deleted successfully" });
    } catch (error) {
      console.error("Error deleting inspection:", error);
      res.status(500).json({ error: "Failed to delete inspection" });
    }
  });

  // Update inspection (full update)
  app.put("/api/inspections/:id", async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }
      const validatedData = insertInspectionSchema.parse(req.body);
      const inspection = await storage.updateInspection(id, validatedData);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      console.error("Error updating inspection:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid inspection data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update inspection" });
      }
    }
  });

  // Get rooms for a specific building inspection
  app.get("/api/inspections/:id/rooms", async (req: any, res: any) => {
    try {
      const buildingInspectionId = parseInt(req.params.id);
      if (isNaN(buildingInspectionId)) {
        return res.status(400).json({ error: "Invalid building inspection ID" });
      }
      if (isNaN(buildingInspectionId)) {
        return res.status(400).json({ error: "Invalid building inspection ID" });
      }
      const rooms = await storage.getRoomInspectionsByBuildingId(buildingInspectionId);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms for building inspection:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  // Room Inspection routes
  app.post("/api/room-inspections", async (req: any, res: any) => {
    try {
      console.log("[POST] Creating room inspection with data:", JSON.stringify(req.body, null, 2));
      
      const validatedData = insertRoomInspectionSchema.parse(req.body);
      console.log("[POST] Validated room inspection data:", JSON.stringify(validatedData, null, 2));
      
      const roomInspection = await storage.createRoomInspection(validatedData);
      console.log("[POST] Successfully created room inspection:", roomInspection.id);
      
      res.json(roomInspection);
    } catch (error) {
      console.error("Error creating room inspection:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ 
          error: "Invalid room inspection data", 
          details: error.errors,
          message: "Please check that all required fields are properly filled."
        });
      } else {
        console.error("Database or server error:", error);
        res.status(500).json({ 
          error: "Failed to create room inspection",
          message: process.env.NODE_ENV === 'development' ? 
            (error instanceof Error ? error.message : 'Unknown server error') : 
            'Server error occurred. Please try again.'
        });
      }
    }
  });

  app.get("/api/room-inspections", async (req: any, res: any) => {
    try {
      const buildingInspectionId = req.query.buildingInspectionId;
      const roomInspections = await storage.getRoomInspections();
      
      if (buildingInspectionId) {
        const filteredRooms = roomInspections.filter(room => 
          room.buildingInspectionId === parseInt(buildingInspectionId)
        );
        res.json(filteredRooms);
      } else {
        res.json(roomInspections);
      }
    } catch (error) {
      console.error("Error fetching room inspections:", error);
      res.status(500).json({ error: "Failed to fetch room inspections" });
    }
  });

  app.get("/api/room-inspections/:id", async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid room inspection ID" });
      }
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid room inspection ID" });
      }
      const roomInspection = await storage.getRoomInspection(id);
      if (!roomInspection) {
        return res.status(404).json({ error: "Room inspection not found" });
      }
      res.json(roomInspection);
    } catch (error) {
      console.error("Error fetching room inspection:", error);
      res.status(500).json({ error: "Failed to fetch room inspection" });
    }
  });

  // Routes are now registered on the app
}