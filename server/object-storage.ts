
import { Client } from '@replit/object-storage';

export class MediaStorageService {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  async uploadMediaFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    try {
      // Upload file to Object Storage
      await this.client.uploadFromBytes(fileName, fileBuffer, {
        contentType,
        metadata: {
          uploadedAt: new Date().toISOString()
        }
      });
      
      // Return the file URL/path
      return fileName;
    } catch (error) {
      console.error('Failed to upload media file:', error);
      throw new Error('Media upload failed');
    }
  }

  async getMediaFile(fileName: string): Promise<Buffer> {
    try {
      return await this.client.downloadAsBytes(fileName);
    } catch (error) {
      console.error('Failed to retrieve media file:', error);
      throw new Error('Media retrieval failed');
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
