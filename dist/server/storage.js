import { db } from "./db";
import { inspections, custodialNotes, roomInspections } from "../shared/schema";
import { eq } from "drizzle-orm";
export class DatabaseStorage {
    // Inspection methods
    async createInspection(data) {
        const [inspection] = await db.insert(inspections).values([data]).returning();
        return inspection;
    }
    async getInspections() {
        return await db.select().from(inspections).orderBy(inspections.createdAt);
    }
    async getInspection(id) {
        const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
        return inspection;
    }
    async updateInspection(id, data) {
        const [inspection] = await db.update(inspections)
            .set(data)
            .where(eq(inspections.id, id))
            .returning();
        return inspection;
    }
    async deleteInspection(id) {
        const result = await db.delete(inspections).where(eq(inspections.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // Custodial Note methods
    async createCustodialNote(data) {
        const [note] = await db.insert(custodialNotes).values(data).returning();
        return note;
    }
    async getCustodialNotes() {
        return await db.select().from(custodialNotes).orderBy(custodialNotes.createdAt);
    }
    async getCustodialNote(id) {
        const [note] = await db.select().from(custodialNotes).where(eq(custodialNotes.id, id));
        return note;
    }
    // Room Inspection methods
    async createRoomInspection(data) {
        const [roomInspection] = await db.insert(roomInspections).values(data).returning();
        return roomInspection;
    }
    async getRoomInspections() {
        return await db.select().from(roomInspections).orderBy(roomInspections.createdAt);
    }
    async getRoomInspection(id) {
        const [roomInspection] = await db.select().from(roomInspections).where(eq(roomInspections.id, id));
        return roomInspection;
    }
    async getRoomInspectionsByBuildingId(buildingInspectionId) {
        return await db.select().from(roomInspections)
            .where(eq(roomInspections.buildingInspectionId, buildingInspectionId))
            .orderBy(roomInspections.createdAt);
    }
}
export const storage = new DatabaseStorage();
