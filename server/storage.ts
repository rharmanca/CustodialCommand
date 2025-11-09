import { db, pool } from './db';
import { inspections, custodialNotes, roomInspections, monthlyFeedback, inspectionPhotos, syncQueue } from '../shared/schema';
import type { InsertInspection, InsertCustodialNote, InsertRoomInspection, InsertMonthlyFeedback, InsertInspectionPhoto, InsertSyncQueue } from '../shared/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { logger } from './logger';

// Performance monitoring for storage operations
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  slowQueries: 0,
  totalQueries: 0
};

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    performanceMetrics.cacheHits++;
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // Remove expired entry
  }
  performanceMetrics.cacheMisses++;
  return null;
}

function setCache(key: string, data: any, ttl: number = DEFAULT_TTL): void {
  // Implement LRU eviction if cache gets too large
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

// Query performance wrapper
async function executeQuery<T>(
  operation: string,
  queryFn: () => Promise<T>,
  cacheKey?: string,
  ttl?: number
): Promise<T> {
  const startTime = Date.now();
  performanceMetrics.totalQueries++;

  try {
    // Check cache first if cache key provided
    if (cacheKey) {
      const cached = getFromCache(cacheKey);
      if (cached !== null) {
        logger.debug('Cache hit for operation', { operation, cacheKey });
        return cached;
      }
    }

    const result = await queryFn();
    const duration = Date.now() - startTime;

    // Log slow queries
    if (duration > 1000) {
      performanceMetrics.slowQueries++;
      logger.warn('Slow query detected', {
        operation,
        duration,
        cacheKey
      });
    }

    // Cache result if cache key provided
    if (cacheKey && result) {
      setCache(cacheKey, result, ttl);
    }

    logger.debug('Query completed', {
      operation,
      duration,
      cacheHit: !!cacheKey && cache.has(cacheKey)
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Query failed', {
      operation,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export const storage = {
  // Inspection methods
  async createInspection(data: InsertInspection) {
    return executeQuery('createInspection', async () => {
      const [result] = await db.insert(inspections).values(data).returning();
      logger.info('Created inspection:', { id: result.id });

      // Invalidate relevant cache entries
      cache.delete('inspections:all');

      return result;
    });
  },

  async getInspections(options?: { limit?: number; offset?: number; startDate?: string; endDate?: string }) {
    const cacheKey = `inspections:all:${JSON.stringify(options || {})}`;
    return executeQuery('getInspections', async () => {
      let query = db.select().from(inspections);

      if (options?.startDate || options?.endDate) {
        const conditions = [];
        if (options.startDate) {
          conditions.push(gte(inspections.date, options.startDate));
        }
        if (options.endDate) {
          conditions.push(lte(inspections.date, options.endDate));
        }
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const result = await query;
      logger.info(`Retrieved ${result.length} inspections`, { options });
      return result;
    }, cacheKey, 60000); // 1 minute cache for list queries
  },

  async getInspection(id: number) {
    const cacheKey = `inspection:${id}`;
    return executeQuery('getInspection', async () => {
      const [result] = await db.select().from(inspections).where(eq(inspections.id, id));
      logger.info('Retrieved inspection:', { id });
      return result;
    }, cacheKey, 300000); // 5 minutes cache for single items
  },

  async updateInspection(id: number, data: Partial<InsertInspection>) {
    return executeQuery('updateInspection', async () => {
      const [result] = await db.update(inspections).set(data).where(eq(inspections.id, id)).returning();
      logger.info('Updated inspection:', { id });

      // Invalidate relevant cache entries
      cache.delete(`inspection:${id}`);
      cache.delete('inspections:all');

      return result;
    });
  },

  async deleteInspection(id: number) {
    return executeQuery('deleteInspection', async () => {
      await db.delete(inspections).where(eq(inspections.id, id));
      logger.info('Deleted inspection:', { id });

      // Invalidate relevant cache entries
      cache.delete(`inspection:${id}`);
      cache.delete('inspections:all');

      return true;
    });
  },

  // Custodial Notes methods
  async createCustodialNote(data: InsertCustodialNote) {
    return executeQuery('createCustodialNote', async () => {
      const [result] = await db.insert(custodialNotes).values(data).returning();
      logger.info('Created custodial note:', { id: result.id });

      // Invalidate relevant cache entries
      cache.delete('custodialNotes:all');

      return result;
    });
  },

  async getCustodialNotes(options?: { limit?: number; offset?: number; school?: string }) {
    const cacheKey = `custodialNotes:all:${JSON.stringify(options || {})}`;
    return executeQuery('getCustodialNotes', async () => {
      let query = db.select().from(custodialNotes);

      if (options?.school) {
        query = query.where(eq(custodialNotes.school, options.school));
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const result = await query;
      logger.info(`Retrieved ${result.length} custodial notes`, { options });
      return result;
    }, cacheKey, 60000); // 1 minute cache for list queries
  },

  async getCustodialNote(id: number) {
    const cacheKey = `custodialNote:${id}`;
    return executeQuery('getCustodialNote', async () => {
      const [result] = await db.select().from(custodialNotes).where(eq(custodialNotes.id, id));
      logger.info('Retrieved custodial note:', { id });
      return result;
    }, cacheKey, 300000); // 5 minutes cache for single items
  },

  async deleteCustodialNote(id: number) {
    return executeQuery('deleteCustodialNote', async () => {
      await db.delete(custodialNotes).where(eq(custodialNotes.id, id));
      logger.info('Deleted custodial note:', { id });

      // Invalidate relevant cache entries
      cache.delete(`custodialNote:${id}`);
      cache.delete('custodialNotes:all');

      return true;
    });
  },

  // Room Inspections methods
  async createRoomInspection(data: InsertRoomInspection) {
    return executeQuery('createRoomInspection', async () => {
      const [result] = await db.insert(roomInspections).values(data).returning();
      logger.info('Created room inspection:', { id: result.id });

      // Invalidate relevant cache entries
      cache.delete('roomInspections:all');

      return result;
    });
  },

  async getRoomInspections(buildingInspectionId?: number) {
    const cacheKey = `roomInspections:all:${buildingInspectionId || 'all'}`;
    return executeQuery('getRoomInspections', async () => {
      if (buildingInspectionId) {
        const result = await db.select()
          .from(roomInspections)
          .where(eq(roomInspections.buildingInspectionId, buildingInspectionId));
        logger.info(`Retrieved ${result.length} room inspections for building:`, { buildingInspectionId });
        return result;
      } else {
        const result = await db.select().from(roomInspections);
        logger.info(`Retrieved ${result.length} room inspections`);
        return result;
      }
    }, cacheKey, 60000); // 1 minute cache for list queries
  },

  async getRoomInspection(id: number) {
    const cacheKey = `roomInspection:${id}`;
    return executeQuery('getRoomInspection', async () => {
      const [result] = await db.select().from(roomInspections).where(eq(roomInspections.id, id));
      logger.info('Retrieved room inspection:', { id });
      return result;
    }, cacheKey, 300000); // 5 minutes cache for single items
  },

  async getRoomInspectionsByBuildingId(buildingInspectionId: number) {
    return this.getRoomInspections(buildingInspectionId);
  },

  async updateRoomInspection(roomId: number, buildingInspectionId: number, data: Partial<InsertRoomInspection>) {
    return executeQuery('updateRoomInspection', async () => {
      const [result] = await db.update(roomInspections)
        .set(data)
        .where(
          and(
            eq(roomInspections.id, roomId),
            eq(roomInspections.buildingInspectionId, buildingInspectionId)
          )
        )
        .returning();

      if (!result) {
        logger.warn('Room inspection not found for update:', { roomId, buildingInspectionId });
        return null;
      }

      logger.info('Updated room inspection:', { roomId, buildingInspectionId });

      // Invalidate relevant cache entries
      cache.delete(`roomInspection:${roomId}`);
      cache.delete(`roomInspections:all:${buildingInspectionId}`);
      cache.delete('roomInspections:all:all');

      return result;
    });
  },

  // Monthly Feedback methods
  async createMonthlyFeedback(data: InsertMonthlyFeedback) {
    return executeQuery('createMonthlyFeedback', async () => {
      const [result] = await db.insert(monthlyFeedback).values(data).returning();
      logger.info('Created monthly feedback:', { id: result.id, school: result.school });

      // Invalidate relevant cache entries
      cache.delete('monthlyFeedback:all');

      return result;
    });
  },

  async getMonthlyFeedback(options?: { school?: string; year?: number; month?: string }) {
    const cacheKey = `monthlyFeedback:all:${JSON.stringify(options || {})}`;
    return executeQuery('getMonthlyFeedback', async () => {
      let query = db.select().from(monthlyFeedback).orderBy(desc(monthlyFeedback.createdAt));

      if (options?.school) {
        query = query.where(eq(monthlyFeedback.school, options.school));
      }

      if (options?.year) {
        query = query.where(eq(monthlyFeedback.year, options.year));
      }

      if (options?.month) {
        query = query.where(eq(monthlyFeedback.month, options.month));
      }

      const result = await query;
      logger.info(`Retrieved ${result.length} monthly feedback documents`, { options });
      return result;
    }, cacheKey, 120000); // 2 minutes cache for feedback queries
  },

  async getMonthlyFeedbackById(id: number) {
    const cacheKey = `monthlyFeedback:${id}`;
    return executeQuery('getMonthlyFeedbackById', async () => {
      const [result] = await db.select().from(monthlyFeedback)
        .where(eq(monthlyFeedback.id, id));
      logger.info('Retrieved monthly feedback:', { id });
      return result;
    }, cacheKey, 300000); // 5 minutes cache for single items
  },

  async deleteMonthlyFeedback(id: number) {
    return executeQuery('deleteMonthlyFeedback', async () => {
      await db.delete(monthlyFeedback).where(eq(monthlyFeedback.id, id));
      logger.info('Deleted monthly feedback:', { id });

      // Invalidate relevant cache entries
      cache.delete(`monthlyFeedback:${id}`);
      cache.delete('monthlyFeedback:all');

      return true;
    });
  },

  async updateMonthlyFeedbackNotes(id: number, notes: string) {
    return executeQuery('updateMonthlyFeedbackNotes', async () => {
      const [result] = await db.update(monthlyFeedback)
        .set({ notes })
        .where(eq(monthlyFeedback.id, id))
        .returning();
      logger.info('Updated monthly feedback notes:', { id });

      // Invalidate relevant cache entries
      cache.delete(`monthlyFeedback:${id}`);
      cache.delete('monthlyFeedback:all');

      return result;
    });
  },

  // Performance metrics and cache management
  getPerformanceMetrics() {
    return {
      ...performanceMetrics,
      cacheHitRate: performanceMetrics.totalQueries > 0
        ? (performanceMetrics.cacheHits / performanceMetrics.totalQueries * 100).toFixed(2) + '%'
        : '0%',
      slowQueryRate: performanceMetrics.totalQueries > 0
        ? (performanceMetrics.slowQueries / performanceMetrics.totalQueries * 100).toFixed(2) + '%'
        : '0%',
      cacheSize: cache.size,
      poolStatus: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  },

  clearCache(pattern?: string) {
    if (pattern) {
      const keysToDelete = Array.from(cache.keys()).filter(key => key.includes(pattern));
      keysToDelete.forEach(key => cache.delete(key));
      logger.info('Cleared cache entries matching pattern', { pattern, deletedCount: keysToDelete.length });
    } else {
      const size = cache.size;
      cache.clear();
      logger.info('Cleared entire cache', { deletedCount: size });
    }
  },

  // Cache warming for frequently accessed data
  async warmCache() {
    logger.info('Warming cache...');
    try {
      // Pre-load recent inspections and notes
      await this.getInspections({ limit: 50 });
      await this.getCustodialNotes({ limit: 50 });
      await this.getMonthlyFeedback();
      logger.info('Cache warming completed');
    } catch (error) {
      logger.error('Cache warming failed', { error });
    }
  },

  // Photo storage methods
  async createInspectionPhoto(photoData: InsertInspectionPhoto) {
    return executeQuery(
      'createInspectionPhoto',
      async () => {
        const [photo] = await db.insert(inspectionPhotos)
          .values(photoData)
          .returning();
        return photo;
      },
      `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
  },

  async getInspectionPhoto(photoId: number) {
    return executeQuery(
      'getInspectionPhoto',
      async () => {
        const [photo] = await db.select()
          .from(inspectionPhotos)
          .where(eq(inspectionPhotos.id, photoId))
          .limit(1);
        return photo;
      },
      `inspection_photo_${photoId}`
    );
  },

  async getInspectionPhotosByInspectionId(inspectionId: number) {
    return executeQuery(
      'getInspectionPhotosByInspectionId',
      async () => {
        const photos = await db.select()
          .from(inspectionPhotos)
          .where(eq(inspectionPhotos.inspectionId, inspectionId))
          .orderBy(desc(inspectionPhotos.createdAt));
        return photos;
      },
      `photos_inspection_${inspectionId}`,
      10 * 60 * 1000 // 10 minute cache
    );
  },

  async getAllInspectionPhotos() {
    return executeQuery(
      'getAllInspectionPhotos',
      async () => {
        const photos = await db.select()
          .from(inspectionPhotos)
          .orderBy(desc(inspectionPhotos.createdAt));
        return photos;
      },
      'all_photos',
      5 * 60 * 1000 // 5 minute cache
    );
  },

  async updateInspectionPhoto(photoId: number, updateData: Partial<InsertInspectionPhoto>) {
    return executeQuery(
      'updateInspectionPhoto',
      async () => {
        const [photo] = await db.update(inspectionPhotos)
          .set(updateData)
          .where(eq(inspectionPhotos.id, photoId))
          .returning();
        return photo;
      },
      `update_photo_${photoId}`
    );
  },

  async deleteInspectionPhoto(photoId: number) {
    return executeQuery(
      'deleteInspectionPhoto',
      async () => {
        await db.delete(inspectionPhotos)
          .where(eq(inspectionPhotos.id, photoId));
      },
      `delete_photo_${photoId}`
    );
  },

  // Sync queue methods
  async createSyncQueue(queueData: InsertSyncQueue) {
    return executeQuery(
      'createSyncQueue',
      async () => {
        const [queueItem] = await db.insert(syncQueue)
          .values(queueData)
          .returning();
        return queueItem;
      },
      `sync_queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
  },

  async getSyncQueueItems(status?: string) {
    return executeQuery(
      'getSyncQueueItems',
      async () => {
        let query = db.select()
          .from(syncQueue)
          .orderBy(desc(syncQueue.createdAt));

        if (status) {
          query = query.where(eq(syncQueue.type, status));
        }

        const items = await query;
        return items;
      },
      `sync_queue_${status || 'all'}`,
      5 * 60 * 1000 // 5 minute cache
    );
  },

  async updateSyncQueue(queueId: number, updateData: Partial<InsertSyncQueue>) {
    return executeQuery(
      'updateSyncQueue',
      async () => {
        const [queueItem] = await db.update(syncQueue)
          .set(updateData)
          .where(eq(syncQueue.id, queueId))
          .returning();
        return queueItem;
      },
      `update_sync_queue_${queueId}`
    );
  },

  async deleteSyncQueue(queueId: number) {
    return executeQuery(
      'deleteSyncQueue',
      async () => {
        await db.delete(syncQueue)
          .where(eq(syncQueue.id, queueId));
      },
      `delete_sync_queue_${queueId}`
    );
  }
};

