import fs from 'fs/promises';
import path from 'path';
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

  async uploadLargeFile(fileBuffer: Buffer, originalName: string, category: string = 'general') {
    try {
      // Sanitize category to avoid accidental folder traversal like "image/png"
      const safeCategory = (category || 'general').replace(/[^a-zA-Z0-9_-]/g, '-');

      // Ensure category directory exists
      const categoryDir = path.join(this.storagePath, safeCategory);
      await fs.mkdir(categoryDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(originalName) || '.bin';
      const filename = `${timestamp}-${randomId}${extension}`;

      const filePath = path.join(categoryDir, filename);

      // Write file
      await fs.writeFile(filePath, fileBuffer);

      // Generate public URL
      const publicUrl = `/uploads/${safeCategory}/${filename}`;
      
      logger.info(`File uploaded: ${filename} (${fileBuffer.length} bytes)`);
      
      return {
        success: true,
        filename: `${safeCategory}/${filename}`,
        filePath,
        publicUrl,
        size: fileBuffer.length,
        originalName
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
      const filePath = path.join(this.storagePath, filename);
      const fileBuffer = await fs.readFile(filePath);
      
      logger.info(`File retrieved: ${filename}`);
      
      return {
        success: true,
        buffer: fileBuffer,
        filename
      };
    } catch (error) {
      logger.error('Error retrieving file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File not found'
      };
    }
  }

  async deleteFile(filename: string) {
    try {
      const filePath = path.join(this.storagePath, filename);
      await fs.unlink(filePath);
      
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
