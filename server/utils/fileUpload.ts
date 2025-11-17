import { ObjectStorageService } from "../objectStorage";
import { logger } from "../logger";
import { FILE_UPLOAD } from "../config/constants";
import type { Express } from "express";
import type { Request, Response, NextFunction } from "express";
import fileType from "file-type";

/**
 * Upload files in parallel with validation
 */
export async function uploadFiles(
  files: Express.Multer.File[],
  prefix: string,
): Promise<string[]> {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadPromises = files.map(async (file) => {
    // Validate file type with magic number check
    const type = await fileType.fromBuffer(file.buffer);
    const allowedTypes = FILE_UPLOAD.ALLOWED_TYPES as readonly string[];
    if (!type || !allowedTypes.includes(type.mime)) {
      throw new Error(
        `Invalid file type: ${file.originalname} (${type?.mime || "unknown"})`,
      );
    }

    const filename = `${prefix}/${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    const storageService = new ObjectStorageService();
    const uploadResult = await storageService.uploadLargeFile(
      file.buffer,
      filename,
      file.mimetype,
    );

    if (uploadResult.success) {
      logger.info("[UPLOAD] File uploaded to object storage", {
        filename,
        url: `/objects/${filename}`,
        size: file.size,
        type: type?.mime,
      });
      return `/objects/${filename}`;
    } else {
      logger.error("[UPLOAD] Failed to upload file", {
        filename,
        error: uploadResult.error,
      });
      throw new Error(
        `Upload failed for ${file.originalname}: ${uploadResult.error}`,
      );
    }
  });

  try {
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  } catch (error) {
    logger.error("[UPLOAD] Batch upload failed", { error });
    throw error;
  }
}

/**
 * Middleware to validate image files
 */
export async function validateImageFiles(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return next();
  }

  for (const file of files) {
    const type = await fileType.fromBuffer(file.buffer);
    const allowedTypes = FILE_UPLOAD.ALLOWED_TYPES as readonly string[];
    if (!type || !allowedTypes.includes(type.mime)) {
      res.status(400).json({
        success: false,
        message: "Invalid file type detected",
        details: `File ${file.originalname} is not a valid image (${type?.mime || "unknown"})`,
      });
      return;
    }
  }

  next();
}
