// Railway-compatible persistent storage service
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class RailwayPersistentStorage {
  constructor() {
    // Use Railway's persistent volume if available, fallback to uploads directory
    this.storagePath = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'uploads');
    this.publicUrl = process.env.RAILWAY_PUBLIC_DOMAIN ? 
      `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 
      'http://localhost:5000';
    
    this.ensureStorageDirectory();
  }

  async ensureStorageDirectory() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      console.log(`✅ Storage directory ensured: ${this.storagePath}`);
    } catch (error) {
      console.error('❌ Failed to create storage directory:', error);
    }
  }

  async storeFile(fileBuffer, originalName, category = 'general') {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString('hex');
      const extension = path.extname(originalName);
      const filename = `${category}/${timestamp}-${randomId}${extension}`;
      
      const filePath = path.join(this.storagePath, filename);
      
      // Ensure category directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, fileBuffer);
      
      const publicUrl = `${this.publicUrl}/uploads/${filename}`;
      
      console.log(`✅ File stored: ${filename} (${fileBuffer.length} bytes)`);
      
      return {
        success: true,
        filename,
        filePath,
        publicUrl,
        size: fileBuffer.length,
        category
      };
    } catch (error) {
      console.error('❌ Failed to store file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getFile(filename) {
    try {
      const filePath = path.join(this.storagePath, filename);
      const buffer = await fs.readFile(filePath);
      return {
        success: true,
        buffer,
        size: buffer.length
      };
    } catch (error) {
      console.error('❌ Failed to get file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFile(filename) {
    try {
      const filePath = path.join(this.storagePath, filename);
      await fs.unlink(filePath);
      console.log(`✅ File deleted: ${filename}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listFiles(category = null) {
    try {
      const searchPath = category ? path.join(this.storagePath, category) : this.storagePath;
      const files = await fs.readdir(searchPath, { withFileTypes: true });
      
      const fileList = [];
      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(searchPath, file.name);
          const stats = await fs.stat(filePath);
          fileList.push({
            name: file.name,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            category: category || 'general'
          });
        }
      }
      
      return {
        success: true,
        files: fileList
      };
    } catch (error) {
      console.error('❌ Failed to list files:', error);
      return {
        success: false,
        error: error.message,
        files: []
      };
    }
  }

  // Generate presigned URL for direct uploads (Railway-compatible)
  async generatePresignedUrl(fileName, fileType, category = 'general') {
    try {
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString('hex');
      const extension = path.extname(fileName);
      const filename = `${category}/${timestamp}-${randomId}${extension}`;
      
      // For Railway, we'll use direct upload to our server
      const uploadUrl = `${this.publicUrl}/api/upload/direct/${filename}`;
      
      console.log(`✅ Presigned URL generated: ${filename}`);
      
      return {
        success: true,
        uploadUrl,
        filename,
        expiresIn: 3600, // 1 hour
        fields: {
          'Content-Type': fileType
        }
      };
    } catch (error) {
      console.error('❌ Failed to generate presigned URL:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get storage statistics
  async getStorageStats() {
    try {
      const stats = await this.listFiles();
      if (!stats.success) {
        return stats;
      }

      const totalSize = stats.files.reduce((sum, file) => sum + file.size, 0);
      const fileCount = stats.files.length;

      return {
        success: true,
        totalSize,
        fileCount,
        storagePath: this.storagePath,
        publicUrl: this.publicUrl
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = RailwayPersistentStorage;
