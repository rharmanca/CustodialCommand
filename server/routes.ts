import type { Express } from "express";
import { createServer, type Server } from "http";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { insertInspectionSchema, insertCustodialNoteSchema, insertRoomInspectionSchema } from "../shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from "./logger"; // Assuming logger is configured elsewhere
import express from 'express'; // Import express to use express.static

// Assume objectStorageService is imported and configured elsewhere
// import { objectStorageService } from './objectStorageService'; 
// For demonstration purposes, let's mock it if not provided
const objectStorageService = {
  uploadLargeFile: async (buffer: Buffer, filename: string, mimetype: string) => {
    console.log(`Mock: Uploading ${filename} (${mimetype}) with size ${buffer.length}`);
    // In a real scenario, this would upload to Replit Object Storage
    // and return a success status and potentially a URL.
    // For now, simulate success.
    return { success: true, url: `/objects/${filename}` };
  },
  getObjectFile: async (filename: string) => {
    console.log(`Mock: Getting metadata for ${filename}`);
    // Simulate finding a file
    return { httpMetadata: { contentType: 'image/jpeg' }, httpEtag: 'mock-etag' };
  },
  downloadObject: async (filename: string) => {
    console.log(`Mock: Downloading ${filename}`);
    // Simulate downloading file data
    return { success: true, data: Buffer.from("mock file content") };
  }
};

// Add async wrapper for better error handling
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Configure multer for file uploads (5MB limit to match client-side)
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

export async function registerRoutes(app: Express): Promise<void> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Inspection routes
  // POST /api/inspections
  app.post('/api/inspections', upload.array('images'), async (req, res) => {
    logger.info('[POST] Building inspection submission started', {
      body: req.body,
      files: req.files ? req.files.length : 0
    });

    try {
      const { inspectorName, school, inspectionType } = req.body;
      const files = req.files as Express.Multer.File[];

      // Validate required fields
      if (!school || !inspectionType) {
        logger.warn('[POST] Missing required fields', { school, inspectionType });
        return res.status(400).json({
          message: 'Missing required fields',
          details: { school: !!school, inspectionType: !!inspectionType }
        });
      }

      let imageUrls: string[] = [];

      // Process uploaded files using object storage
      if (files && files.length > 0) {
        logger.info('[POST] Processing uploaded files with object storage', { count: files.length });

        for (const file of files) {
          try {
            const filename = `inspections/${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
            const uploadResult = await objectStorageService.uploadLargeFile(
              file.buffer,
              filename,
              file.mimetype
            );

            if (uploadResult.success) {
              imageUrls.push(`/objects/${filename}`);
              logger.info('[POST] File uploaded to object storage', { filename, url: `/objects/${filename}` });
            } else {
              logger.error('[POST] Failed to upload file to object storage', { filename, error: uploadResult.error });
            }
          } catch (uploadError) {
            logger.error('[POST] Error uploading file to object storage:', uploadError);
          }
        }
      }

      const inspectionData = {
        inspectorName: inspectorName || null,
        school,
        inspectionType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isCompleted: false,
        images: JSON.stringify(imageUrls)
      };

      logger.info('[POST] Creating building inspection', { inspectionData });

      const [newInspection] = await storage.createInspection(inspectionData);

      logger.info('[POST] Building inspection created successfully', { id: newInspection.id });

      res.status(201).json({
        message: 'Building inspection created successfully',
        id: newInspection.id,
        imageCount: imageUrls.length
      });

    } catch (error) {
      logger.error('[POST] Error creating building inspection:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

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
  app.post("/api/custodial-notes", upload.array('images'), async (req, res) => {
    logger.info('[POST] Custodial Notes submission started', {
      body: req.body,
      files: req.files ? req.files.length : 0
    });

    try {
      const { school, date, custodian, adminNotes, location, notes } = req.body;
      const files = req.files as Express.Multer.File[];

      // Validate required fields
      if (!school || !date || !custodian || !location) {
        logger.warn('[POST] Missing required fields', { school, date, custodian, location });
        return res.status(400).json({
          message: 'Missing required fields',
          details: { school: !!school, date: !!date, custodian: !!custodian, location: !!location }
        });
      }

      let imageUrls: string[] = [];

      // Process uploaded files using object storage
      if (files && files.length > 0) {
        logger.info('[POST] Processing uploaded files with object storage', { count: files.length });

        for (const file of files) {
          try {
            const filename = `custodial-notes/${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
            const uploadResult = await objectStorageService.uploadLargeFile(
              file.buffer,
              filename,
              file.mimetype
            );

            if (uploadResult.success) {
              imageUrls.push(`/objects/${filename}`);
              logger.info('[POST] File uploaded to object storage', { filename, url: `/objects/${filename}` });
            } else {
              logger.error('[POST] Failed to upload file to object storage', { filename, error: uploadResult.error });
            }
          } catch (uploadError) {
            logger.error('[POST] Error uploading file to object storage:', uploadError);
          }
        }
      }

      const custodialNote = {
        school,
        date,
        custodian,
        adminNotes: adminNotes || '',
        location,
        notes: notes || '',
        images: JSON.stringify(imageUrls)
      };

      logger.info('[POST] Creating custodial note', { custodialNote });

      const custodialNoteResult = await storage.createCustodialNote(custodialNote);

      logger.info('[POST] Custodial note created successfully', { id: custodialNoteResult.id });

      res.status(201).json({
        message: 'Custodial note submitted successfully',
        id: custodialNoteResult.id,
        imageCount: imageUrls.length
      });

    } catch (error) {
      logger.error('[POST] Error creating custodial note:', error);
      res.status(500).json({ message: 'Internal server error' });
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

  // Submit building inspection endpoint (alias for POST /api/inspections)
  app.post("/api/submit-building-inspection", async (req: any, res: any) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Creating building inspection via submit endpoint', { requestId });

    try {
      console.log(`[${requestId}] Raw building inspection request:`, JSON.stringify(req.body, null, 2));

      const validatedData = insertInspectionSchema.parse(req.body);
      console.log(`[${requestId}] Validated building inspection:`, JSON.stringify(validatedData, null, 2));

      const result = await storage.createInspection(validatedData);

      logger.info('Building inspection created successfully', { requestId, inspectionId: result.id });
      return res.status(201).json({ success: true, id: result.id, ...result });
    } catch (err) {
      console.error(`[${requestId}] Failed to create building inspection:`, err);
      logger.error('Failed to create building inspection', { requestId, error: err });

      if (err instanceof z.ZodError) {
        console.error(`[${requestId}] Validation errors:`, err.errors);
        return res.status(400).json({
          error: 'Invalid building inspection data',
          details: err.errors,
          message: 'Please check all required fields are filled correctly'
        });
      }

      res.status(500).json({ error: 'Failed to create building inspection' });
    }
  });

  // Get rooms for a specific building inspection
  app.get("/api/inspections/:id/rooms", async (req: any, res: any) => {
    try {
      const buildingInspectionId = parseInt(req.params.id);
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

  // Submit single area inspection
  app.post('/api/inspections/:id/rooms/:roomId/submit', upload.array('images'), async (req, res) => {
    logger.info('[POST] Room inspection submission started', {
      inspectionId: req.params.id,
      roomId: req.params.roomId,
      body: req.body,
      files: req.files ? req.files.length : 0
    });

    try {
      const inspectionId = parseInt(req.params.id);
      const roomId = parseInt(req.params.roomId);
      const { responses } = req.body;
      const files = req.files as Express.Multer.File[];

      // Validate required fields
      if (!responses) {
        logger.warn('[POST] Missing responses', { inspectionId, roomId });
        return res.status(400).json({ message: 'Missing responses data' });
      }

      let parsedResponses;
      try {
        parsedResponses = typeof responses === 'string' ? JSON.parse(responses) : responses;
      } catch (parseError) {
        logger.error('[POST] Error parsing responses:', parseError);
        return res.status(400).json({ message: 'Invalid responses format' });
      }

      let imageUrls: string[] = [];

      // Process uploaded files using object storage
      if (files && files.length > 0) {
        logger.info('[POST] Processing uploaded files with object storage', { count: files.length });

        for (const file of files) {
          try {
            const filename = `room-inspections/${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
            const uploadResult = await objectStorageService.uploadLargeFile(
              file.buffer,
              filename,
              file.mimetype
            );

            if (uploadResult.success) {
              imageUrls.push(`/objects/${filename}`);
              logger.info('[POST] File uploaded to object storage', { filename, url: `/objects/${filename}` });
            } else {
              logger.error('[POST] Failed to upload file to object storage', { filename, error: uploadResult.error });
            }
          } catch (uploadError) {
            logger.error('[POST] Error uploading file to object storage:', uploadError);
          }
        }
      }

      // Update room with responses and images
      const updatedRoom = await storage.updateRoomInspection(roomId, inspectionId, {
        responses: JSON.stringify(parsedResponses),
        images: JSON.stringify(imageUrls),
        updatedAt: new Date().toISOString(),
        isCompleted: true
      });

      if (!updatedRoom) {
        logger.error('[POST] Room not found', { inspectionId, roomId });
        return res.status(404).json({ message: 'Room not found' });
      }

      logger.info('[POST] Room inspection completed successfully', {
        inspectionId,
        roomId,
        responseCount: Object.keys(parsedResponses).length,
        imageCount: imageUrls.length
      });

      res.status(200).json({
        message: 'Room inspection submitted successfully',
        roomId: updatedRoom.id,
        responseCount: Object.keys(parsedResponses).length,
        imageCount: imageUrls.length
      });

    } catch (error) {
      logger.error('[POST] Error submitting room inspection:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Static file serving for uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Object storage image serving route
  app.get('/objects/:filename(*)', async (req, res) => {
    try {
      const filename = req.params.filename;
      logger.info('[GET] Serving object from storage', { filename });

      const objectFile = await objectStorageService.getObjectFile(filename);
      if (!objectFile) {
        logger.warn('[GET] Object not found', { filename });
        return res.status(404).json({ message: 'File not found' });
      }

      const downloadResult = await objectStorageService.downloadObject(filename);
      if (!downloadResult.success || !downloadResult.data) {
        logger.error('[GET] Failed to download object', { filename, error: downloadResult.error });
        return res.status(500).json({ message: 'Failed to serve file' });
      }

      // Set appropriate headers
      res.set({
        'Content-Type': objectFile.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': downloadResult.data.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // 1 year cache
        'ETag': `"${objectFile.httpEtag}"`,
      });

      res.send(downloadResult.data);
      logger.info('[GET] Object served successfully', { filename, size: downloadResult.data.length });

    } catch (error) {
      logger.error('[GET] Error serving object:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Catch-all handler for unknown API routes (must be at the end)
  app.use('/api/*', (req: any, res: any) => {
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        'POST /api/inspections',
        'GET /api/inspections',
        'POST /api/submit-building-inspection',
        'POST /api/custodial-notes',
        'POST /api/room-inspections'
      ]
    });
  });

  // Routes are now registered on the app
}