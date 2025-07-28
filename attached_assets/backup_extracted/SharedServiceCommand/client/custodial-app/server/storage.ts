import { inspections, custodialNotes, type Inspection, type InsertInspection, type CustodialNote, type InsertCustodialNote } from "../shared/schema.js";
import { db } from "./db.js";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Inspection methods
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  getInspections(): Promise<Inspection[]>;
  getInspection(id: number): Promise<Inspection | undefined>;
  
  // Custodial notes methods
  createCustodialNote(note: InsertCustodialNote): Promise<CustodialNote>;
  getCustodialNotes(): Promise<CustodialNote[]>;
  getCustodialNote(id: number): Promise<CustodialNote | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createInspection(inspection: InsertInspection): Promise<Inspection> {
    const [newInspection] = await db
      .insert(inspections)
      .values(inspection)
      .returning();
    return newInspection;
  }

  async getInspections(): Promise<Inspection[]> {
    return await db
      .select()
      .from(inspections)
      .orderBy(desc(inspections.createdAt));
  }

  async getInspection(id: number): Promise<Inspection | undefined> {
    const [inspection] = await db
      .select()
      .from(inspections)
      .where(eq(inspections.id, id));
    return inspection || undefined;
  }

  async createCustodialNote(note: InsertCustodialNote): Promise<CustodialNote> {
    const [newNote] = await db
      .insert(custodialNotes)
      .values(note)
      .returning();
    return newNote;
  }

  async getCustodialNotes(): Promise<CustodialNote[]> {
    return await db
      .select()
      .from(custodialNotes)
      .orderBy(desc(custodialNotes.createdAt));
  }

  async getCustodialNote(id: number): Promise<CustodialNote | undefined> {
    const [note] = await db
      .select()
      .from(custodialNotes)
      .where(eq(custodialNotes.id, id));
    return note || undefined;
  }
}

export const storage = new DatabaseStorage();