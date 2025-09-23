import { db } from './db';
import { inspections, custodialNotes, roomInspections } from '../shared/schema';
import type { InsertInspection, InsertCustodialNote, InsertRoomInspection } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from './logger';

export const storage = {
  // Inspection methods
  async createInspection(data: InsertInspection) {
    try {
      const [result] = await db.insert(inspections).values(data).returning();
      logger.info('Created inspection:', { id: result.id });
      return result;
    } catch (error) {
      logger.error('Error creating inspection:', error);
      throw error;
    }
  },

  async getInspections() {
    try {
      const result = await db.select().from(inspections);
      logger.info(`Retrieved ${result.length} inspections`);
      return result;
    } catch (error) {
      logger.error('Error getting inspections:', error);
      throw error;
    }
  },

  async getInspection(id: number) {
    try {
      const [result] = await db.select().from(inspections).where(eq(inspections.id, id));
      logger.info('Retrieved inspection:', { id });
      return result;
    } catch (error) {
      logger.error('Error getting inspection:', error);
      throw error;
    }
  },

  async updateInspection(id: number, data: Partial<InsertInspection>) {
    try {
      const [result] = await db.update(inspections).set(data).where(eq(inspections.id, id)).returning();
      logger.info('Updated inspection:', { id });
      return result;
    } catch (error) {
      logger.error('Error updating inspection:', error);
      throw error;
    }
  },

  async deleteInspection(id: number) {
    try {
      await db.delete(inspections).where(eq(inspections.id, id));
      logger.info('Deleted inspection:', { id });
      return true;
    } catch (error) {
      logger.error('Error deleting inspection:', error);
      return false;
    }
  },

  // Custodial Notes methods
  async createCustodialNote(data: InsertCustodialNote) {
    try {
      const [result] = await db.insert(custodialNotes).values(data).returning();
      logger.info('Created custodial note:', { id: result.id });
      return result;
    } catch (error) {
      logger.error('Error creating custodial note:', error);
      throw error;
    }
  },

  async getCustodialNotes() {
    try {
      const result = await db.select().from(custodialNotes);
      logger.info(`Retrieved ${result.length} custodial notes`);
      return result;
    } catch (error) {
      logger.error('Error getting custodial notes:', error);
      throw error;
    }
  },

  async getCustodialNote(id: number) {
    try {
      const [result] = await db.select().from(custodialNotes).where(eq(custodialNotes.id, id));
      logger.info('Retrieved custodial note:', { id });
      return result;
    } catch (error) {
      logger.error('Error getting custodial note:', error);
      throw error;
    }
  },

  async deleteCustodialNote(id: number) {
    try {
      await db.delete(custodialNotes).where(eq(custodialNotes.id, id));
      logger.info('Deleted custodial note:', { id });
      return true;
    } catch (error) {
      logger.error('Error deleting custodial note:', error);
      return false;
    }
  },

  // Room Inspections methods
  async createRoomInspection(data: InsertRoomInspection) {
    try {
      const [result] = await db.insert(roomInspections).values(data).returning();
      logger.info('Created room inspection:', { id: result.id });
      return result;
    } catch (error) {
      logger.error('Error creating room inspection:', error);
      throw error;
    }
  },

  async getRoomInspections() {
    try {
      const result = await db.select().from(roomInspections);
      logger.info(`Retrieved ${result.length} room inspections`);
      return result;
    } catch (error) {
      logger.error('Error getting room inspections:', error);
      throw error;
    }
  },

  async getRoomInspection(id: number) {
    try {
      const [result] = await db.select().from(roomInspections).where(eq(roomInspections.id, id));
      logger.info('Retrieved room inspection:', { id });
      return result;
    } catch (error) {
      logger.error('Error getting room inspection:', error);
      throw error;
    }
  }
};

