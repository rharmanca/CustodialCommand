import type { Express } from "express";
import { createServer, type Server } from "http";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { custodialCriteria } from "../shared/custodial-criteria";
import { mediaStorage } from "./object-storage";
import { z } from "zod";
import multer from 'multer';

// Add async wrapper for better error handling
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export async function registerRoutes(app: Express): Promise<void> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Inspection routes
  app.post("/api/inspections", asyncHandler(async (req: Request, res: Response) => {
    try {
      const validatedData = insertInspectionSchema.parse(req.body);
      const inspection = await storage.createInspection(validatedData);
      res.json(inspection);
    } catch (error) {
      console.error("Error creating inspection:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid inspection data", details: error.errors });
      } else {
        res.status(500).json({ 
          error: "Failed to create inspection",
          message: process.env.NODE_ENV === 'development' ? 
            (error instanceof Error ? error.message : 'Unknown error') : 
            undefined
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

  // Custodial Notes routes
  app.post("/api/custodial-notes", async (req: any, res: any) => {
    try {
      const validatedData = insertCustodialNoteSchema.parse(req.body);
      const custodialNote = await storage.createCustodialNote(validatedData);
      res.json(custodialNote);
    } catch (error) {
      console.error("Error creating custodial note:", error);
      res.status(400).json({ error: "Invalid custodial note data" });
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
      const validatedData = insertRoomInspectionSchema.parse(req.body);
      const roomInspection = await storage.createRoomInspection(validatedData);
      res.json(roomInspection);
    } catch (error) {
      console.error("Error creating room inspection:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid room inspection data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create room inspection" });
      }
    }
  });

  app.get("/api/room-inspections", async (req: any, res: any) => {
    try {
      const buildingInspectionId = req.query.buildingInspectionId;
      if (buildingInspectionId) {
        const id = parseInt(buildingInspectionId as string);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid building inspection ID" });
        }
        const roomInspections = await storage.getRoomInspectionsByBuildingId(id);
        res.json(roomInspections);
      } else {
        const roomInspections = await storage.getRoomInspections();
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

  // Get custodial criteria
  app.get("/api/custodial-criteria", (req, res) => {
    res.json(custodialCriteria);
  });

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit per file
    },
    fileFilter: (req, file, cb) => {
      // Allow images and videos
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image and video files are allowed'));
      }
    }
  });

  // Upload media files
  app.post("/api/media/upload", upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedFiles = [];

      for (const file of req.files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        await mediaStorage.uploadMediaFile(fileName, file.buffer, file.mimetype);
        uploadedFiles.push({
          fileName,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype
        });
      }

      res.json({ 
        message: "Files uploaded successfully",
        files: uploadedFiles
      });
    } catch (error) {
      console.error("Media upload error:", error);
      res.status(500).json({ error: "Failed to upload media files" });
    }
  });

  // Serve media files
  app.get("/api/media/:fileName", async (req, res) => {
    try {
      const { fileName } = req.params;
      const fileBuffer = await mediaStorage.getMediaFile(fileName);

      // Set appropriate headers
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      res.send(fileBuffer);
    } catch (error) {
      console.error("Media retrieval error:", error);
      res.status(404).json({ error: "Media file not found" });
    }
  });

  // Delete media file
  app.delete("/api/media/:fileName", async (req, res) => {
    try {
      const { fileName } = req.params;
      const deleted = await mediaStorage.deleteMediaFile(fileName);

      if (deleted) {
        res.json({ message: "File deleted successfully" });
      } else {
        res.status(404).json({ error: "File not found" });
      }
    } catch (error) {
      console.error("Media deletion error:", error);
      res.status(500).json({ error: "Failed to delete media file" });
    }
  });

  // Routes are now registered on the app
}