import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import mime from 'mime-types';
import { logger } from './logger';

export class ObjectStorageService {
  private storagePath: string;

  constructor() {
    // Use uploads directory for local storage
    this.storagePath = path.join(process.cwd(), 'uploads');
    this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      logger.info(`Storage directory ensured: ${this.storagePath}`);
    } catch (error) {
      logger.error('Failed to create storage directory:', error);
    }
  }

  /**
   * Validate that the requested file path is within the storage directory
   * Prevents path traversal attacks
   */
  private validateFilePath(filename: string): { valid: boolean; resolvedPath?: string; error?: string } {
    // Check for obvious path traversal attempts
    if (filename.includes('..') || filename.startsWith('/') || filename.includes('\0')) {
      logger.warn('Path traversal attempt detected', { filename });
      return { valid: false, error: 'Invalid filename: path traversal detected' };
    }

    // Resolve the full path and normalize it
    const requestedPath = path.resolve(this.storagePath, filename);
    const normalizedStoragePath = path.resolve(this.storagePath);

    // Ensure the resolved path is within the storage directory
    if (!requestedPath.startsWith(normalizedStoragePath + path.sep) && requestedPath !== normalizedStoragePath) {
      logger.warn('File access outside storage directory attempted', {
        filename,
        requestedPath,
        storagePath: normalizedStoragePath
      });
      return { valid: false, error: 'Access denied: file outside storage directory' };
    }

    return { valid: true, resolvedPath: requestedPath };
  }

  async uploadLargeFile(fileBuffer: Buffer, filename: string, _mimetype?: string) {
    try {
      // Parse the filename to extract category/directory structure
      // The filename is expected to include the directory path (e.g., 'inspections/timestamp-file.jpg')
      const parsedPath = path.parse(filename);
      const categoryPath = parsedPath.dir || 'general';

      // Sanitize the category path to prevent traversal
      const safeCategoryPath = categoryPath.split(path.sep)
        .map(segment => segment.replace(/[^a-zA-Z0-9_-]/g, '-'))
        .join(path.sep);

      // Ensure category directory exists
      const categoryDir = path.join(this.storagePath, safeCategoryPath);
      await fs.mkdir(categoryDir, { recursive: true });

      // Use the provided filename or generate a unique one
      const finalFilename = parsedPath.base || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${parsedPath.ext || '.bin'}`;
      const filePath = path.join(categoryDir, finalFilename);

      // Write file
      await fs.writeFile(filePath, fileBuffer);

      // Generate public URL
      const publicUrl = `/uploads/${safeCategoryPath}/${finalFilename}`;

      logger.info(`File uploaded: ${finalFilename} (${fileBuffer.length} bytes)`);

      return {
        success: true,
        filename: `${safeCategoryPath}/${finalFilename}`,
        filePath,
        publicUrl,
        size: fileBuffer.length,
        originalName: filename
      };
    } catch (error) {
      logger.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getObjectFile(filename: string) {
    try {
      // Validate file path to prevent path traversal
      const validation = this.validateFilePath(filename);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid file path'
        };
      }

      const fileBuffer = await fs.readFile(validation.resolvedPath!);

      // Detect content type from filename
      const contentType = mime.lookup(filename) || 'application/octet-stream';

      // Generate ETag from file content
      const hash = createHash('md5').update(fileBuffer).digest('hex');

      logger.info(`File retrieved: ${filename}`);

      return {
        success: true,
        buffer: fileBuffer,
        filename,
        httpMetadata: {
          contentType
        },
        httpEtag: hash
      };
    } catch (error) {
      logger.error('Error retrieving file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File not found'
      };
    }
  }

  async downloadObject(filename: string) {
    try {
      // Validate file path to prevent path traversal
      const validation = this.validateFilePath(filename);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid file path',
          data: null
        };
      }

      const fileBuffer = await fs.readFile(validation.resolvedPath!);

      logger.info(`File downloaded: ${filename}`);

      return {
        success: true,
        data: fileBuffer
      };
    } catch (error) {
      logger.error('Error downloading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File not found',
        data: null
      };
    }
  }

  async deleteFile(filename: string) {
    try {
      // Validate file path to prevent path traversal
      const validation = this.validateFilePath(filename);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid file path'
        };
      }

      await fs.unlink(validation.resolvedPath!);

      logger.info(`File deleted: ${filename}`);

      return {
        success: true
      };
    } catch (error) {
      logger.error('Error deleting file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File not found'
      };
    }
  }
}
