import sharp from 'sharp';
import { logger } from '../logger';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Thumbnail generation configuration
 */
const THUMBNAIL_CONFIG = {
  width: 200,
  height: 200,
  fit: 'cover' as const,
  position: 'center' as const,
  quality: 70,
  progressive: true,
};

/**
 * Generate thumbnail from image buffer
 * @param imageBuffer - Source image buffer
 * @returns Resized thumbnail buffer (200x200 JPEG, 70% quality)
 * @throws Error if image processing fails
 */
export async function generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const startTime = Date.now();

    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
        fit: THUMBNAIL_CONFIG.fit,
        position: THUMBNAIL_CONFIG.position,
      })
      .jpeg({
        quality: THUMBNAIL_CONFIG.quality,
        progressive: THUMBNAIL_CONFIG.progressive,
      })
      .toBuffer();

    const duration = Date.now() - startTime;
    logger.info('Thumbnail generated successfully', {
      inputSize: imageBuffer.length,
      outputSize: thumbnailBuffer.length,
      dimensions: `${THUMBNAIL_CONFIG.width}x${THUMBNAIL_CONFIG.height}`,
      durationMs: duration,
      compressionRatio: (thumbnailBuffer.length / imageBuffer.length).toFixed(2),
    });

    return thumbnailBuffer;
  } catch (error) {
    logger.error('Thumbnail generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      inputSize: imageBuffer.length,
    });
    throw new Error('Failed to generate thumbnail: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Generate thumbnail asynchronously, returning both thumbnail and original
 * Useful for parallel processing where both buffers are needed
 * @param imageBuffer - Source image buffer
 * @returns Object containing both thumbnail and original buffers
 * @throws Error if image processing fails
 */
export async function generateThumbnailAsync(imageBuffer: Buffer): Promise<{ thumbnail: Buffer; original: Buffer }> {
  try {
    const thumbnail = await generateThumbnail(imageBuffer);
    return {
      thumbnail,
      original: imageBuffer,
    };
  } catch (error) {
    logger.error('Async thumbnail generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Generate thumbnail from file system path
 * @param imagePath - Path to source image file
 * @returns Resized thumbnail buffer
 * @throws Error if file not found or image processing fails
 */
export async function generateThumbnailFromPath(imagePath: string): Promise<Buffer> {
  try {
    // Validate path to prevent directory traversal
    const resolvedPath = path.resolve(imagePath);
    const uploadDir = path.resolve(process.cwd(), 'uploads');

    // Ensure the path is within the uploads directory
    if (!resolvedPath.startsWith(uploadDir)) {
      throw new Error('Invalid image path: path must be within uploads directory');
    }

    // Read file from disk
    let imageBuffer: Buffer;
    try {
      imageBuffer = await fs.readFile(resolvedPath);
    } catch (readError) {
      if ((readError as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Image file not found: ${imagePath}`);
      }
      throw readError;
    }

    logger.info('Image loaded from path for thumbnail generation', {
      path: imagePath,
      size: imageBuffer.length,
    });

    return await generateThumbnail(imageBuffer);
  } catch (error) {
    if (error instanceof Error && error.message.includes('file not found')) {
      throw error;
    }
    logger.error('Thumbnail generation from path failed', {
      path: imagePath,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Failed to generate thumbnail from path: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Get image metadata without generating thumbnail
 * Useful for validation before processing
 * @param imageBuffer - Source image buffer
 * @returns Image metadata (width, height, format, etc.)
 */
export async function getImageMetadata(imageBuffer: Buffer): Promise<sharp.Metadata> {
  try {
    return await sharp(imageBuffer).metadata();
  } catch (error) {
    logger.error('Failed to get image metadata', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Invalid image format or corrupted file');
  }
}

/**
 * Validate if buffer is a valid image
 * @param buffer - Buffer to validate
 * @returns Boolean indicating if buffer is a valid image
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    await sharp(buffer).metadata();
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate thumbnail with performance tracking
 * Internal use for monitoring generation times
 * @param imageBuffer - Source image buffer
 * @returns Object with thumbnail buffer and performance metrics
 */
export async function generateThumbnailWithMetrics(imageBuffer: Buffer): Promise<{
  thumbnail: Buffer;
  metrics: {
    durationMs: number;
    inputSize: number;
    outputSize: number;
    compressionRatio: number;
  };
}> {
  const startTime = Date.now();
  const thumbnail = await generateThumbnail(imageBuffer);
  const duration = Date.now() - startTime;

  return {
    thumbnail,
    metrics: {
      durationMs: duration,
      inputSize: imageBuffer.length,
      outputSize: thumbnail.length,
      compressionRatio: thumbnail.length / imageBuffer.length,
    },
  };
}
