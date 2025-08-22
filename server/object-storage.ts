
import { Client } from '@replit/object-storage';

export class MediaStorageService {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  async uploadMediaFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    const maxRetries = 5; // Increased retries for large files
    let retryCount = 0;
    const fileSizeMB = fileBuffer.length / (1024 * 1024);

    // For very large files (>100MB), use different strategy
    const isLargeFile = fileSizeMB > 100;

    while (retryCount < maxRetries) {
      try {
        console.log(`Uploading ${fileName} to Object Storage (${fileSizeMB.toFixed(2)}MB, attempt ${retryCount + 1}/${maxRetries})`);
        
        // Upload file to Object Storage with enhanced metadata
        await this.client.uploadFromBytes(fileName, fileBuffer, {
          contentType,
          resumable: isLargeFile, // Enable resumable uploads for large files
          metadata: {
            uploadedAt: new Date().toISOString(),
            fileSize: fileBuffer.length.toString(),
            fileSizeMB: fileSizeMB.toFixed(2),
            originalContentType: contentType,
            uploadVersion: '3.0',
            isLargeFile: isLargeFile.toString()
          }
        });
        
        console.log(`Successfully uploaded ${fileName} (${fileSizeMB.toFixed(2)}MB)`);
        return fileName;
      } catch (error) {
        retryCount++;
        console.error(`Upload attempt ${retryCount} failed for ${fileName}:`, error);
        
        if (retryCount >= maxRetries) {
          console.error(`Failed to upload ${fileName} after ${maxRetries} attempts`);
          throw new Error(`Media upload failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Longer wait times for large files
        const baseWaitTime = isLargeFile ? 5000 : 1000;
        const waitTime = Math.pow(2, retryCount) * baseWaitTime;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw new Error('Upload failed unexpectedly');
  }

  async getMediaFile(fileName: string): Promise<Buffer> {
    try {
      console.log(`Retrieving ${fileName} from Object Storage`);
      const buffer = await this.client.downloadAsBytes(fileName);
      console.log(`Successfully retrieved ${fileName} (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
      return buffer;
    } catch (error) {
      console.error(`Failed to retrieve media file ${fileName}:`, error);
      throw new Error(`Media retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileInfo(fileName: string): Promise<{size: number, contentType: string, uploadedAt: string} | null> {
    try {
      const files = await this.client.list();
      const fileInfo = files.find(file => file.name === fileName);
      
      if (!fileInfo) {
        return null;
      }

      return {
        size: fileInfo.size || 0,
        contentType: fileInfo.contentType || 'application/octet-stream',
        uploadedAt: fileInfo.timeCreated || new Date().toISOString()
      };
    } catch (error) {
      console.error(`Failed to get file info for ${fileName}:`, error);
      return null;
    }
  }

  async deleteMediaFile(fileName: string): Promise<boolean> {
    try {
      await this.client.delete(fileName);
      return true;
    } catch (error) {
      console.error('Failed to delete media file:', error);
      return false;
    }
  }

  async listMediaFiles(): Promise<string[]> {
    try {
      const files = await this.client.list();
      return files.map(file => file.name);
    } catch (error) {
      console.error('Failed to list media files:', error);
      return [];
    }
  }
}

export const mediaStorage = new MediaStorageService();
