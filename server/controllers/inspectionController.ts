import { Request, Response } from "express";
import { storage } from "../storage";
import { insertInspectionSchema } from "../../shared/schema";
import { logger } from "../logger";
import { uploadFiles } from "../utils/fileUpload";
import {
  asyncHandler,
  errorResponse,
  handleValidationError,
} from "../utils/errorHandler";
import { z } from "zod";

/**
 * Create a new building inspection
 */
export async function createInspection(req: Request, res: Response) {
  logger.info("[POST] Building inspection submission started", {
    body: req.body,
    files: req.files ? (req.files as any[]).length : 0,
  });

  return asyncHandler(async (req, res) => {
    const { inspectorName, school, inspectionType } = req.body;
    const files = req.files as Express.Multer.File[];

    // Validate required fields
    if (!school || !inspectionType) {
      logger.warn("[POST] Missing required fields", { school, inspectionType });
      return errorResponse(res, 400, "Missing required fields", {
        school: !!school,
        inspectionType: !!inspectionType,
      });
    }

    // Upload files in parallel
    const imageUrls =
      files && files.length > 0 ? await uploadFiles(files, "inspections") : [];

    const inspectionData = {
      inspectorName: inspectorName || "",
      school,
      date: req.body.date || new Date().toISOString(),
      inspectionType,
      locationDescription: req.body.locationDescription || "",
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
      isCompleted: false,
    };

    logger.info("[POST] Creating building inspection", { inspectionData });

    const validatedData = insertInspectionSchema.parse(inspectionData);
    const newInspection = await storage.createInspection(validatedData);

    logger.info("[POST] Building inspection created successfully", {
      id: newInspection.id,
    });

    res.status(201).json({
      success: true,
      message: "Building inspection created successfully",
      id: newInspection.id,
      imageCount: imageUrls.length,
    });
  });
}
