import type { Express } from "express";
import { createServer, type Server } from "http";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { custodialCriteria } from "../shared/custodial-criteria";
import { objectStorageService, ObjectNotFoundError } from "./objectStorage";
import { mediaStorage } from "./object-storage";
import { insertInspectionSchema, insertCustodialNoteSchema, insertRoomInspectionSchema } from "../shared/schema";
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

  // Configure multer for very large file uploads (up to 1GB per file)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 1024 * 1024 * 1024, // 1GB limit per file
      files: 5, // Allow up to 5 files for larger uploads
      fieldSize: 1024 * 1024 * 1024, // 1GB field size
      fieldNameSize: 200, // Field name size
      fields: 20, // Number of non-file fields
      parts: 1000 // Increase parts limit for larger files
    },
    fileFilter: (req, file, cb) => {
      // Allow images, videos, and documents
      const allowedTypes = [
        'image/',
        'video/',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream'
      ];
      
      const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
      
      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error('File type not allowed. Only images, videos, PDF documents, archives, and MS Office files are permitted.'));
      }
    }
  });

  // Get presigned URL for very large file uploads (direct to Object Storage)
  app.post("/api/large-upload/presigned", async (req: Request, res: Response) => {
    try {
      const { fileName, fileType } = req.body;
      
      if (!fileName || !fileType) {
        return res.status(400).json({ 
          error: "Missing required fields", 
          message: "fileName and fileType are required" 
        });
      }

      // Generate presigned URL for direct upload to Object Storage
      const fileExtension = fileName.split('.').pop() || '';
      const uploadURL = await objectStorageService.getLargeFileUploadURL(`.${fileExtension}`);
      
      res.json({ 
        uploadURL,
        message: "Presigned URL generated for large file upload"
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ 
        error: "Failed to generate upload URL",
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      });
    }
  });

  // Serve uploaded files from Object Storage
  app.get("/objects/:fileName", async (req: Request, res: Response) => {
    try {
      const { fileName } = req.params;
      const objectPath = `/objects/${fileName}`;
      
      const file = await objectStorageService.getObjectFile(objectPath);
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving file:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      res.status(500).json({ error: "Error serving file" });
    }
  });

  // Upload media files with enhanced handling for larger files
  app.post("/api/media/upload", upload.array('files', 5), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedFiles = [];
      const errors = [];

      // Process files with better error handling
      for (const file of req.files) {
        try {
          // Generate unique filename with timestamp and random suffix
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const fileName = `${timestamp}-${randomSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          console.log(`Uploading file: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          
          await mediaStorage.uploadMediaFile(fileName, file.buffer, file.mimetype);
          
          uploadedFiles.push({
            fileName,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`
          });
        } catch (fileError) {
          console.error(`Error uploading file ${file.originalname}:`, fileError);
          errors.push({
            fileName: file.originalname,
            error: fileError instanceof Error ? fileError.message : 'Upload failed'
          });
        }
      }

      // Return results with both successes and errors
      const response: any = {
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        files: uploadedFiles
      };

      if (errors.length > 0) {
        response.errors = errors;
        response.message += `, ${errors.length} file(s) failed`;
      }

      res.json(response);
    } catch (error) {
      console.error("Media upload error:", error);
      
      // Handle specific multer errors
      if (error instanceof Error) {
        if (error.message.includes('File too large')) {
          return res.status(413).json({ 
            error: "File too large", 
            message: "Maximum file size is 1GB per file",
            maxSizeBytes: 1024 * 1024 * 1024
          });
        }
        if (error.message.includes('Too many files')) {
          return res.status(413).json({ 
            error: "Too many files", 
            message: "Maximum 5 files allowed per upload for large file handling"
          });
        }
        if (error.message.includes('too many parts')) {
          return res.status(413).json({ 
            error: "Request too complex", 
            message: "File upload request has too many parts"
          });
        }
      }
      
      res.status(500).json({ 
        error: "Failed to upload media files",
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          undefined
      });
    }
  });

  // Get file information
  app.get("/api/media/:fileName/info", async (req, res) => {
    try {
      const { fileName } = req.params;
      const fileInfo = await mediaStorage.getFileInfo(fileName);

      if (!fileInfo) {
        return res.status(404).json({ error: "File not found" });
      }

      res.json({
        fileName,
        size: fileInfo.size,
        sizeFormatted: `${(fileInfo.size / 1024 / 1024).toFixed(2)}MB`,
        contentType: fileInfo.contentType,
        uploadedAt: fileInfo.uploadedAt
      });
    } catch (error) {
      console.error("File info retrieval error:", error);
      res.status(500).json({ error: "Failed to get file information" });
    }
  });

  // Serve media files with enhanced headers and error handling
  app.get("/api/media/:fileName", async (req, res) => {
    try {
      const { fileName } = req.params;
      
      // Get file info first to set proper headers
      const fileInfo = await mediaStorage.getFileInfo(fileName);
      if (fileInfo) {
        res.setHeader('Content-Type', fileInfo.contentType);
        res.setHeader('Content-Length', fileInfo.size);
      }
      
      const fileBuffer = await mediaStorage.getMediaFile(fileName);

      // Set appropriate cache and security headers
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Accept-Ranges', 'bytes');
      
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