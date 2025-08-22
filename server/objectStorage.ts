import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Object storage client for Replit App Storage
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  // Get private object directory for large file storage
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error("PRIVATE_OBJECT_DIR not set. Object Storage not configured.");
    }
    return dir;
  }

  // Generate upload URL for large files (up to 5GB)
  async getLargeFileUploadURL(fileExtension: string = ""): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fileName = `large-upload-${objectId}${fileExtension}`;
    const fullPath = `${privateObjectDir}/uploads/${fileName}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Sign URL for PUT method with 1 hour TTL for large uploads
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 3600, // 1 hour for large file uploads
    });
  }

  // Upload large file directly to object storage
  async uploadLargeFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fileExtension = fileName.split('.').pop() || '';
    const storedFileName = `${objectId}.${fileExtension}`;
    const fullPath = `${privateObjectDir}/uploads/${storedFileName}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    // Upload with resumable upload for large files
    const stream = file.createWriteStream({
      metadata: {
        contentType: mimeType,
        metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
        },
      },
      resumable: true, // Important for large files
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        resolve(`/objects/${storedFileName}`);
      });
      stream.end(buffer);
    });
  }

  // Get file from object storage
  async getObjectFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const fileName = objectPath.replace("/objects/", "");
    const privateObjectDir = this.getPrivateObjectDir();
    const fullPath = `${privateObjectDir}/uploads/${fileName}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    
    return objectFile;
  }

  // Download object file
  async downloadObject(file: File, res: Response) {
    try {
      const [metadata] = await file.getMetadata();
      
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": "private, max-age=3600",
      });

      const stream = file.createReadStream();
      
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
}

// Helper functions
function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return { bucketName, objectName };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to sign object URL: ${response.status}`);
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

export const objectStorageService = new ObjectStorageService();