import type { Express } from "express";
import * as express from "express";
import * as path from "path";
import { createServer, type Server } from "http";
import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { insertInspectionSchema, insertCustodialNoteSchema, insertRoomInspectionSchema, insertMonthlyFeedbackSchema } from "../shared/schema";
import { z } from "zod";
import multer from "multer";
import { logger } from "./logger";
import { doclingService } from './doclingService';

import { ObjectStorageService } from './objectStorage';
import { calculateBuildingScore, calculateSchoolScores, getComplianceStatus } from './utils/scoring';

const objectStorageService = new ObjectStorageService();



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

      logger.info('[POST] Creating building inspection', { inspectionData });

      // Now validate the data before saving
      try {
        const validatedData = insertInspectionSchema.parse(inspectionData);
        const newInspection = await storage.createInspection(validatedData);

      logger.info('[POST] Building inspection created successfully', { id: newInspection.id });

      res.status(201).json({
        message: 'Building inspection created successfully',
        id: newInspection.id,
        imageCount: imageUrls.length
      });

      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          logger.warn('[POST] Validation failed', { errors: validationError.errors });
          return res.status(400).json({
            message: 'Invalid inspection data',
            details: validationError.errors
          });
        }
        throw validationError;
      }
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
      headers: req.headers,
      contentType: req.headers['content-type'],
      files: req.files ? req.files.length : 0
    });

    // Explicit content type validation - ensure multipart/form-data
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      logger.warn('[POST] Invalid content type for multipart endpoint', {
        contentType,
        userAgent: req.headers['user-agent']
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid content type',
        details: 'This endpoint requires multipart/form-data. Please use the form to submit data.',
        technical: 'Expected multipart/form-data, got ' + (contentType || 'none')
      });
    }

    try {
      const { inspectorName, school, date, locationDescription, location, notes } = req.body;
      const files = Array.isArray(req.files) ? req.files as Express.Multer.File[] : [];

      logger.info('[POST] Parsed form data', {
        inspectorName,
        school,
        date,
        location,
        locationDescription,
        notes: notes ? `${notes.substring(0, 50)}...` : 'none',
        fileCount: files.length
      });

      // Validate required fields
      if (!inspectorName || !school || !date || !location) {
        logger.warn('[POST] Missing required fields', {
          received: { inspectorName, school, date, location },
          validation: {
            inspectorName: !!inspectorName,
            school: !!school,
            date: !!date,
            location: !!location
          }
        });
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          details: {
            inspectorName: !!inspectorName ? '✓' : '✗ required',
            school: !!school ? '✓' : '✗ required',
            date: !!date ? '✓' : '✗ required',
            location: !!location ? '✓' : '✗ required'
          },
          receivedFields: { inspectorName, school, date, location }
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
        inspectorName,
        school,
        date,
        location,
        locationDescription: locationDescription || null,
        notes: notes || '',
        images: imageUrls
      };

      logger.info('[POST] Validating custodial note data', { custodialNote });

      // Validate data with Zod schema
      const validatedData = insertCustodialNoteSchema.parse(custodialNote);

      logger.info('[POST] Creating custodial note', { validatedData });

      const custodialNoteResult = await storage.createCustodialNote(validatedData);

      logger.info('[POST] Custodial note created successfully', { id: custodialNoteResult.id });

      res.status(201).json({
        success: true,
        message: 'Custodial note submitted successfully',
        id: custodialNoteResult.id,
        imageCount: imageUrls.length
      });

    } catch (error) {
      logger.error('[POST] Error creating custodial note:', error);

      // Handle multer/busboy specific errors
      if (error && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large',
          details: 'Maximum file size is 5MB per image'
        });
      }

      if (error && error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files',
          details: 'Maximum 5 images allowed'
        });
      }

      if (error && error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Invalid file field',
          details: 'Only image files are allowed'
        });
      }

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        logger.warn('[POST] Validation failed', { errors: error.errors });
        return res.status(400).json({
          success: false,
          message: 'Invalid form data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      // Handle multer parsing errors
      if (error && error.message && error.message.includes('Unexpected end of form')) {
        logger.error('[POST] FormData parsing error - likely malformed request', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid form data format',
          details: 'The form data was not properly formatted. Please try again.',
          technical: 'FormData parsing failed'
        });
      }

      // Generic error
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ?
          (error instanceof Error ? error.message : 'Unknown error') :
          'Please try again or contact support'
      });
    }
  });

  // Add multer error handling middleware for the custodial notes route
  app.use('/api/custodial-notes', (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('[POST] Multipart error in custodial notes:', err);

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large',
          details: 'Maximum file size is 5MB per image'
        });
      }

      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files',
          details: 'Maximum 5 images allowed'
        });
      }

      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Invalid file field',
          details: 'Only image files are allowed'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'File upload error',
        details: err.message
      });
    }

    // Handle various multipart parsing errors
    if (err && err.message) {
      if (err.message.includes('Unexpected end of form') ||
          err.message.includes('Multipart: Boundary not found') ||
          err.message.includes('Malformed part header')) {
        return res.status(400).json({
          success: false,
          message: 'Form data is malformed',
          details: 'The request format was invalid. Please try submitting the form again.',
          technical: 'FormData parsing failed'
        });
      }

      // Handle JSON sent to multipart endpoint
      if (err.message.includes('Unexpected field') ||
          err.message.includes('Error: Multipart') ||
          req.headers['content-type']?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid content type',
          details: 'This endpoint requires multipart/form-data. Please use the form to submit data.',
          technical: 'Wrong content type for multipart endpoint'
        });
      }
    }

    // Generic multipart error
    return res.status(400).json({
      success: false,
      message: 'Invalid request format',
      details: 'The request could not be processed. Please ensure you are submitting the form correctly.',
      technical: 'Multipart processing error'
    });
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
      console.log(`[${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));

      // Ensure we have a body
      if (!req.body) {
        logger.warn(`[${requestId}] No request body received`);
        return res.status(400).json({
          error: 'No request body received',
          message: 'Please ensure the request contains valid JSON data'
        });
      }

      const validatedData = insertInspectionSchema.parse(req.body);
      console.log(`[${requestId}] Validated building inspection:`, JSON.stringify(validatedData, null, 2));

      const result = await storage.createInspection(validatedData);

      logger.info('Building inspection created successfully', { requestId, inspectionId: result.id });
      const responsePayload = { success: true, id: result.id, ...result };
      console.log(`[${requestId}] Response (JSON):`, JSON.stringify(responsePayload, null, 2));
      res.setHeader('Content-Type', 'application/json');
      return res.status(201).json(responsePayload);
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

      // Ensure we always return JSON, never HTML
      const errorPayload = {
        error: 'Failed to create building inspection',
        message: 'An internal server error occurred. Please try again.',
        requestId
      };
      console.log(`[${requestId}] Response (ERROR JSON):`, JSON.stringify(errorPayload, null, 2));
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json(errorPayload);
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

      res.status(201).json(roomInspection);
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

  // Finalize building inspection
  app.post("/api/inspections/:id/finalize", async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid inspection ID" });
      }

      const inspection = await storage.updateInspection(id, { isCompleted: true });
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      console.error("Error finalizing inspection:", error);
      res.status(500).json({ error: "Failed to finalize inspection" });
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

  // Admin authentication endpoint
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

      // Check credentials against environment variables (more secure)
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminPassword) {
        logger.error('ADMIN_PASSWORD environment variable not set');
        return res.status(500).json({ 
          success: false, 
          message: 'Server configuration error' 
        });
      }

      if (username === adminUsername && password === adminPassword) {
        // Generate a cryptographically secure session token
        const sessionToken = 'admin_' + randomBytes(32).toString('hex');

        // Store session (in production, use Redis or database)
        if (!global.adminSessions) {
          global.adminSessions = new Map();
        }
        global.adminSessions.set(sessionToken, {
          username,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        logger.info('Admin login successful', { username });
        
        res.json({ 
          success: true, 
          message: 'Login successful',
          sessionToken 
        });
      } else {
        logger.warn('Admin login failed', { username });
        res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
    } catch (error) {
      logger.error('Admin login error', { error });
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  });

  // Admin session validation middleware
  const validateAdminSession = (req: Request, res: Response, next: NextFunction) => {
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
    (req as any).adminSession = session;
    next();
  };

  // Protected admin routes
  app.get('/api/admin/inspections', validateAdminSession, async (req, res) => {
    try {
      const inspections = await storage.getInspections();
      res.json({ success: true, data: inspections });
    } catch (error) {
      logger.error('Error fetching admin inspections', { error });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.delete('/api/admin/inspections/:id', validateAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInspection(id);
      
      if (success) {
        res.json({ success: true, message: 'Inspection deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Inspection not found' });
      }
    } catch (error) {
      logger.error('Error deleting admin inspection', { error });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.delete('/api/admin/custodial-notes/:id', validateAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid custodial note ID' });
      }
      
      const success = await storage.deleteCustodialNote(id);
      
      if (success) {
        res.json({ success: true, message: 'Custodial note deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Custodial note not found' });
      }
    } catch (error) {
      logger.error('Error deleting custodial note', { error });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // PDF upload configuration for monthly feedback
  const pdfUpload = multer({
    storage: multer.memoryStorage(),
    limits: { 
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 1 // Only one PDF at a time
    },
    fileFilter: (req, file, cb) => {
      // Strict PDF validation
      if (file.mimetype === 'application/pdf' && file.originalname.toLowerCase().endsWith('.pdf')) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    }
  });

  // Monthly Feedback routes
  app.post('/api/monthly-feedback', pdfUpload.single('pdf'), async (req, res) => {
    logger.info('[POST] Monthly feedback upload started', {
      body: req.body,
      file: req.file ? req.file.originalname : 'none'
    });

    try {
      const { school, month, year, notes, uploadedBy } = req.body;
      const file = req.file as Express.Multer.File;

      // Validate required fields
      if (!school || !month || !year || !file) {
        logger.warn('[POST] Missing required fields');
        return res.status(400).json({
          message: 'Missing required fields',
          details: { school: !!school, month: !!month, year: !!year, file: !!file }
        });
      }

      // Validate year is a number
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
        return res.status(400).json({ message: 'Invalid year' });
      }

      // Upload PDF to storage
      const filename = `monthly-feedback/${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
      const uploadResult = await objectStorageService.uploadLargeFile(
        file.buffer,
        filename,
        file.mimetype
      );

      if (!uploadResult.success) {
        logger.error('[POST] Failed to upload PDF', { error: uploadResult.error });
        return res.status(500).json({ message: 'Failed to upload PDF file' });
      }

      const pdfUrl = `/objects/${filename}`;
      logger.info('[POST] PDF uploaded successfully', { filename, url: pdfUrl });

      // Extract text using Docling
      let extractedText: string | null = null;
      try {
        extractedText = await doclingService.extractTextFromPDF(file.buffer, file.originalname);
        if (!extractedText) {
          logger.warn('[POST] Docling returned empty content, continuing without text');
        }
      } catch (extractError) {
        logger.error('[POST] Docling extraction failed, continuing without text:', extractError);
        // Continue without extracted text rather than failing the upload
      }

      // Create database record
      const feedbackData = {
        school,
        month,
        year: yearNum,
        pdfUrl,
        pdfFileName: file.originalname,
        extractedText,
        notes: notes || null,
        uploadedBy: uploadedBy || null,
        fileSize: file.size,
      };

      // Validate with Zod
      const validatedData = insertMonthlyFeedbackSchema.parse(feedbackData);
      const newFeedback = await storage.createMonthlyFeedback(validatedData);

      logger.info('[POST] Monthly feedback created successfully', { id: newFeedback.id });

      res.status(201).json({
        message: 'Monthly feedback uploaded successfully',
        id: newFeedback.id,
        hasExtractedText: !!extractedText
      });

    } catch (error) {
      logger.error('[POST] Error creating monthly feedback:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid data',
          details: error.errors
        });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/monthly-feedback', async (req, res) => {
    try {
      // Validate and sanitize query parameters
      const school = typeof req.query.school === 'string' ? req.query.school.trim() : '';
      const yearStr = typeof req.query.year === 'string' ? req.query.year.trim() : '';
      const month = typeof req.query.month === 'string' ? req.query.month.trim() : '';

      let feedback = await storage.getMonthlyFeedback();

      // Apply filters with validated parameters
      if (school && school.length > 0) {
        feedback = feedback.filter(f => f.school === school);
      }
      if (yearStr) {
        const yearNum = parseInt(yearStr, 10);
        if (!isNaN(yearNum) && yearNum > 1900 && yearNum < 2100) {
          feedback = feedback.filter(f => f.year === yearNum);
        }
      }
      if (month && month.length > 0) {
        feedback = feedback.filter(f => f.month === month);
      }

      logger.info('[GET] Retrieved filtered monthly feedback', { 
        total: feedback.length,
        filters: { school, year, month }
      });

      res.json(feedback);
    } catch (error) {
      logger.error('[GET] Error fetching monthly feedback:', error);
      res.status(500).json({ message: 'Failed to fetch monthly feedback' });
    }
  });

  app.get('/api/monthly-feedback/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid feedback ID' });
      }

      const feedback = await storage.getMonthlyFeedbackById(id);
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      res.json(feedback);
    } catch (error) {
      logger.error('[GET] Error fetching feedback by ID:', error);
      res.status(500).json({ message: 'Failed to fetch feedback' });
    }
  });

  app.delete('/api/monthly-feedback/:id', validateAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid feedback ID' });
      }

      const success = await storage.deleteMonthlyFeedback(id);
      if (success) {
        res.json({ message: 'Monthly feedback deleted successfully' });
      } else {
        res.status(404).json({ message: 'Feedback not found' });
      }
    } catch (error) {
      logger.error('[DELETE] Error deleting monthly feedback:', error);
      res.status(500).json({ message: 'Failed to delete feedback' });
    }
  });

  app.patch('/api/monthly-feedback/:id/notes', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid feedback ID' });
      }

      if (typeof notes !== 'string') {
        return res.status(400).json({ message: 'Notes must be a string' });
      }

      const updated = await storage.updateMonthlyFeedbackNotes(id, notes);
      if (!updated) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      res.json({ message: 'Notes updated successfully', feedback: updated });
    } catch (error) {
      logger.error('[PATCH] Error updating notes:', error);
      res.status(500).json({ message: 'Failed to update notes' });
    }
  });

  // Scoring routes
  // GET /api/scores - Get scores for all schools
  app.get('/api/scores', async (req, res) => {
    try {
      // Validate and sanitize query parameters
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate.trim() : '';
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate.trim() : '';

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const validStartDate = startDate && dateRegex.test(startDate) ? startDate : '';
      const validEndDate = endDate && dateRegex.test(endDate) ? endDate : '';

      logger.info('[GET] Fetching building scores', { startDate: validStartDate, endDate: validEndDate });

      // Fetch all inspections and notes
      const allInspections = await storage.getInspections();
      const allNotes = await storage.getCustodialNotes();

      // Filter by date range if provided
      let filteredInspections = allInspections;
      let filteredNotes = allNotes;

      if (validStartDate) {
        filteredInspections = filteredInspections.filter(i => i.date >= validStartDate);
        filteredNotes = filteredNotes.filter(n => n.date >= validStartDate);
      }

      if (validEndDate) {
        filteredInspections = filteredInspections.filter(i => i.date <= validEndDate);
        filteredNotes = filteredNotes.filter(n => n.date <= validEndDate);
      }

      // Group by school
      const inspectionsBySchool: Record<string, any[]> = {};
      const notesBySchool: Record<string, any[]> = {};

      filteredInspections.forEach(inspection => {
        if (!inspectionsBySchool[inspection.school]) {
          inspectionsBySchool[inspection.school] = [];
        }
        inspectionsBySchool[inspection.school].push(inspection);
      });

      filteredNotes.forEach(note => {
        if (!notesBySchool[note.school]) {
          notesBySchool[note.school] = [];
        }
        notesBySchool[note.school].push(note);
      });

      // Calculate scores for each school
      const schoolScores = calculateSchoolScores(
        inspectionsBySchool,
        notesBySchool,
        startDate && endDate
          ? { start: startDate as string, end: endDate as string }
          : undefined
      );

      res.json({
        success: true,
        scores: schoolScores,
        dateRange: {
          start: startDate || 'all',
          end: endDate || 'all',
        },
      });
    } catch (error) {
      logger.error('[GET] Error fetching scores:', error);
      res.status(500).json({ message: 'Failed to fetch scores' });
    }
  });

  // GET /api/scores/:school - Get score for a specific school
  app.get('/api/scores/:school', async (req, res) => {
    try {
      // Validate and sanitize parameters
      const school = req.params.school ? req.params.school.trim() : '';
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate.trim() : '';
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate.trim() : '';

      // Validate school parameter
      if (!school || school.length === 0) {
        return res.status(400).json({ message: 'School parameter is required' });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const validStartDate = startDate && dateRegex.test(startDate) ? startDate : '';
      const validEndDate = endDate && dateRegex.test(endDate) ? endDate : '';

      logger.info('[GET] Fetching score for school', { school, startDate: validStartDate, endDate: validEndDate });

      // Fetch inspections and notes for this school
      const allInspections = await storage.getInspections();
      const allNotes = await storage.getCustodialNotes();

      let inspections = allInspections.filter(i => i.school === school);
      let notes = allNotes.filter(n => n.school === school);

      // Filter by date range if provided
      if (validStartDate) {
        inspections = inspections.filter(i => i.date >= validStartDate);
        notes = notes.filter(n => n.date >= validStartDate);
      }

      if (validEndDate) {
        inspections = inspections.filter(i => i.date <= validEndDate);
        notes = notes.filter(n => n.date <= validEndDate);
      }

      // Calculate score
      const scoringResult = calculateBuildingScore(inspections, notes);
      const complianceStatus = getComplianceStatus(scoringResult.overallScore);

      res.json({
        success: true,
        school,
        score: scoringResult,
        complianceStatus,
        dateRange: {
          start: startDate || (inspections[0]?.date || notes[0]?.date),
          end: endDate || (inspections[inspections.length - 1]?.date || notes[notes.length - 1]?.date),
        },
      });
    } catch (error) {
      logger.error('[GET] Error fetching school score:', error);
      res.status(500).json({ message: 'Failed to fetch school score' });
    }
  });

  // Photo upload endpoint for mobile photo capture
  app.post('/api/photos/upload', upload.single('photo'), async (req, res) => {
    logger.info('[POST] Photo upload started', {
      contentType: req.get('Content-Type'),
      hasFile: !!req.file,
      metadata: req.body.metadata,
      hasLocation: !!req.body.location,
      inspectionId: req.body.inspectionId
    });

    try {
      // Validate required file
      if (!req.file) {
        logger.warn('[POST] No photo file provided');
        return res.status(400).json({
          success: false,
          message: 'Photo file is required'
        });
      }

      // Validate metadata
      let metadata;
      try {
        metadata = JSON.parse(req.body.metadata || '{}');

        // Validate required metadata fields
        if (!metadata.width || !metadata.height || !metadata.fileSize) {
          logger.warn('[POST] Missing required metadata fields', { metadata });
          return res.status(400).json({
            success: false,
            message: 'Invalid metadata: missing required fields (width, height, fileSize)'
          });
        }

        // Validate metadata values
        if (metadata.width <= 0 || metadata.height <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid image dimensions'
          });
        }

        if (metadata.fileSize <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid file size'
          });
        }

      } catch (parseError) {
        logger.warn('[POST] Invalid metadata format', { error: parseError, metadata: req.body.metadata });
        return res.status(400).json({
          success: false,
          message: 'Invalid metadata format'
        });
      }

      // Validate location data if provided
      let locationData;
      try {
        locationData = req.body.location ? JSON.parse(req.body.location) : null;

        if (locationData) {
          // Validate location data structure
          if (typeof locationData.latitude !== 'number' ||
              typeof locationData.longitude !== 'number' ||
              locationData.latitude < -90 || locationData.latitude > 90 ||
              locationData.longitude < -180 || locationData.longitude > 180) {
            return res.status(400).json({
              success: false,
              message: 'Invalid location coordinates'
            });
          }

          if (locationData.accuracy && (typeof locationData.accuracy !== 'number' || locationData.accuracy < 0)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid location accuracy'
            });
          }
        }
      } catch (locationError) {
        logger.warn('[POST] Invalid location data format', { error: locationError, location: req.body.location });
        // Don't fail the request for invalid location data, just log it
        locationData = null;
      }

      // Validate inspection ID if provided
      let inspectionId;
      if (req.body.inspectionId) {
        try {
          inspectionId = parseInt(req.body.inspectionId, 10);
          if (isNaN(inspectionId) || inspectionId <= 0) {
            return res.status(400).json({
              success: false,
              message: 'Invalid inspection ID'
            });
          }

          // Verify inspection exists
          const inspection = await storage.getInspection(inspectionId);
          if (!inspection) {
            return res.status(404).json({
              success: false,
              message: 'Inspection not found'
            });
          }
        } catch (inspectionError) {
          return res.status(400).json({
            success: false,
            message: 'Invalid inspection ID format'
          });
        }
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.round(Math.random() * 1E9);
      const filename = `photos/${timestamp}-${randomId}-${req.file.originalname}`;

      logger.info('[POST] Uploading photo to object storage', {
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Upload to object storage
      const uploadResult = await objectStorageService.uploadLargeFile(
        req.file.buffer,
        filename,
        req.file.mimetype
      );

      if (!uploadResult.success) {
        logger.error('[POST] Failed to upload photo to object storage', {
          filename,
          error: uploadResult.error
        });
        return res.status(500).json({
          success: false,
          message: 'Failed to upload photo'
        });
      }

      const photoUrl = `/objects/${filename}`;

      // Save to database
      const photoData = {
        inspectionId: inspectionId || null,
        photoUrl: photoUrl,
        locationLat: locationData ? locationData.latitude.toString() : null,
        locationLng: locationData ? locationData.longitude.toString() : null,
        locationAccuracy: locationData && locationData.accuracy ? locationData.accuracy.toString() : null,
        locationSource: locationData ? locationData.source || 'gps' : null,
        buildingId: locationData?.buildingId || null,
        floor: locationData?.floor || null,
        room: locationData?.room || null,
        capturedAt: metadata.capturedAt ? new Date(metadata.capturedAt) : new Date(),
        notes: metadata.notes || null,
        syncStatus: 'synced' as const,
        fileSize: metadata.fileSize,
        imageWidth: metadata.width,
        imageHeight: metadata.height,
        compressionRatio: metadata.compressionRatio || null,
        deviceInfo: metadata.deviceInfo ? JSON.stringify(metadata.deviceInfo) : null
      };

      const savedPhoto = await storage.createInspectionPhoto(photoData);

      logger.info('[POST] Photo uploaded and saved successfully', {
        photoId: savedPhoto.id,
        photoUrl,
        inspectionId
      });

      res.status(201).json({
        success: true,
        message: 'Photo uploaded successfully',
        photo: {
          id: savedPhoto.id,
          url: photoUrl,
          metadata: {
            width: metadata.width,
            height: metadata.height,
            fileSize: metadata.fileSize,
            capturedAt: metadata.capturedAt
          },
          location: locationData ? {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            accuracy: locationData.accuracy,
            source: locationData.source
          } : null,
          inspectionId: inspectionId || null
        }
      });

    } catch (error) {
      logger.error('[POST] Error uploading photo:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during photo upload'
      });
    }
  });

  // Get photos for an inspection
  app.get('/api/photos/:inspectionId', async (req, res) => {
    try {
      const inspectionId = parseInt(req.params.inspectionId, 10);

      if (isNaN(inspectionId) || inspectionId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid inspection ID'
        });
      }

      // Verify inspection exists
      const inspection = await storage.getInspection(inspectionId);
      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
      }

      // Get photos for this inspection
      const photos = await storage.getInspectionPhotosByInspectionId(inspectionId);

      res.json({
        success: true,
        inspectionId,
        photos: photos.map(photo => ({
          id: photo.id,
          url: photo.photoUrl,
          thumbnailUrl: photo.thumbnailUrl,
          capturedAt: photo.capturedAt,
          location: photo.locationLat && photo.locationLng ? {
            latitude: parseFloat(photo.locationLat),
            longitude: parseFloat(photo.locationLng),
            accuracy: photo.locationAccuracy ? parseFloat(photo.locationAccuracy) : null,
            source: photo.locationSource
          } : null,
          buildingId: photo.buildingId,
          floor: photo.floor,
          room: photo.room,
          syncStatus: photo.syncStatus,
          fileSize: photo.fileSize,
          dimensions: photo.imageWidth && photo.imageHeight ? {
            width: photo.imageWidth,
            height: photo.imageHeight
          } : null
        }))
      });

    } catch (error) {
      logger.error('[GET] Error fetching photos:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch photos'
      });
    }
  });

  // Delete a photo
  app.delete('/api/photos/:photoId', async (req, res) => {
    try {
      const photoId = parseInt(req.params.photoId, 10);

      if (isNaN(photoId) || photoId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid photo ID'
        });
      }

      // Get photo details
      const photo = await storage.getInspectionPhoto(photoId);
      if (!photo) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found'
        });
      }

      // Delete from object storage if it's a valid URL
      if (photo.photoUrl && photo.photoUrl.startsWith('/objects/')) {
        const filename = photo.photoUrl.replace('/objects/', '');
        const deleteResult = await objectStorageService.deleteFile(filename);

        if (!deleteResult.success) {
          logger.warn('[DELETE] Failed to delete photo from object storage', {
            filename,
            error: deleteResult.error
          });
        }
      }

      // Delete from database
      await storage.deleteInspectionPhoto(photoId);

      logger.info('[DELETE] Photo deleted successfully', { photoId });

      res.json({
        success: true,
        message: 'Photo deleted successfully'
      });

    } catch (error) {
      logger.error('[DELETE] Error deleting photo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete photo'
      });
    }
  });

  // Get sync status for photos
  app.get('/api/photos/sync-status', async (req, res) => {
    try {
      // Get all photos with sync status
      const photos = await storage.getAllInspectionPhotos();

      const syncStats = {
        total: photos.length,
        pending: photos.filter(p => p.syncStatus === 'pending').length,
        synced: photos.filter(p => p.syncStatus === 'synced').length,
        failed: photos.filter(p => p.syncStatus === 'failed').length,
        lastSyncTime: photos.length > 0
          ? Math.max(...photos.map(p => new Date(p.updatedAt).getTime()))
          : null
      };

      res.json({
        success: true,
        stats: syncStats
      });

    } catch (error) {
      logger.error('[GET] Error fetching sync status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sync status'
      });
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
        'POST /api/room-inspections',
        'GET /api/scores',
        'GET /api/scores/:school',
        'POST /api/photos/upload',
        'GET /api/photos/:inspectionId',
        'DELETE /api/photos/:photoId',
        'GET /api/photos/sync-status'
      ]
    });
  });

  // Routes are now registered on the app
}