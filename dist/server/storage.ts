import { db } from "./db";
import { inspections, custodialNotes, roomInspections } from "../shared/schema";
import { eq } from "drizzle-orm";
import type { InsertInspection, InsertCustodialNote, InsertRoomInspection } from "../shared/schema";

export class DatabaseStorage {
  // Inspection methods
  async createInspection(data: InsertInspection) {
    const [inspection] = await db.insert(inspections).values([data]).returning();
    return inspection;
  }

  async getInspections() {
    return await db.select().from(inspections).orderBy(inspections.createdAt);
  }

  async getInspection(id: number) {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
    return inspection;
  }

  async updateInspection(id: number, data: Partial<InsertInspection>) {
    const [inspection] = await db.update(inspections)
      .set(data as any)
      .where(eq(inspections.id, id))
      .returning();
    return inspection;
  }

  async deleteInspection(id: number) {
    const result = await db.delete(inspections).where(eq(inspections.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Custodial Note methods
  async createCustodialNote(data: InsertCustodialNote) {
    const [note] = await db.insert(custodialNotes).values(data).returning();
    return note;
  }

  async getCustodialNotes() {
    return await db.select().from(custodialNotes).orderBy(custodialNotes.createdAt);
  }

  async getCustodialNote(id: number) {
    const [note] = await db.select().from(custodialNotes).where(eq(custodialNotes.id, id));
    return note;
  }

  // Room Inspection methods
  async createRoomInspection(data: InsertRoomInspection) {
    const [roomInspection] = await db.insert(roomInspections).values(data).returning();
    return roomInspection;
  }

  async getRoomInspections() {
    return await db.select().from(roomInspections).orderBy(roomInspections.createdAt);
  }

  async getRoomInspection(id: number) {
    const [roomInspection] = await db.select().from(roomInspections).where(eq(roomInspections.id, id));
    return roomInspection;
  }

  async getRoomInspectionsByBuildingId(buildingInspectionId: number) {
    return await db.select().from(roomInspections)
      .where(eq(roomInspections.buildingInspectionId, buildingInspectionId))
      .orderBy(roomInspections.createdAt);
  }
}

export const storage = new DatabaseStorage();