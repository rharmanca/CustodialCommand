import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from './logger';

const execAsync = promisify(exec);

export class DoclingService {
  async extractTextFromPDF(pdfBuffer: Buffer, originalFilename: string): Promise<string | null> {
    const tempDir = path.join(process.cwd(), 'temp');
    const tempPdfPath = path.join(tempDir, `temp-${Date.now()}-${originalFilename}`);
    const tempMdPath = tempPdfPath.replace('.pdf', '.md');
    
    try {
      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true });
      
      // Write PDF to temp file
      await fs.writeFile(tempPdfPath, pdfBuffer);
      
      // Run Docling to extract text as Markdown
      // Adjust command based on how Docling is installed
      const { stdout, stderr } = await execAsync(
        `docling "${tempPdfPath}" --output "${tempDir}"`,
        { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
      );
      
      if (stderr && !stderr.includes('WARNING')) {
        logger.warn('Docling stderr:', stderr);
      }
      
      // Read extracted markdown
      const markdownContent = await fs.readFile(tempMdPath, 'utf-8');
      
      // Cleanup temp files
      await fs.unlink(tempPdfPath).catch(e => logger.warn('Cleanup error:', e));
      await fs.unlink(tempMdPath).catch(e => logger.warn('Cleanup error:', e));
      
      // Validate extracted text
      if (!markdownContent || markdownContent.trim().length === 0) {
        logger.warn('Docling extracted empty content');
        return null;
      }
      
      logger.info('Docling extraction successful', { 
        filename: originalFilename,
        extractedLength: markdownContent.length 
      });
      
      return markdownContent;
    } catch (error) {
      logger.error('Docling extraction error:', error);
      
      // Cleanup on error
      await fs.unlink(tempPdfPath).catch(() => {});
      await fs.unlink(tempMdPath).catch(() => {});
      
      return null;
    }
  }
}

export const doclingService = new DoclingService();
