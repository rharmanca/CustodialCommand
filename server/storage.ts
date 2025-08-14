import {
  users,
  inspections,
  custodialNotes,
  roomInspections,
  type User,
  type InsertUser,
  type Inspection,
  type InsertInspection,
  type CustodialNote,
  type InsertCustodialNote,
  type RoomInspection,
  type InsertRoomInspection,
} from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  getInspections(): Promise<Inspection[]>;
  getInspection(id: number): Promise<Inspection | undefined>;
  updateInspection(id: number, updates: Partial<Inspection>): Promise<Inspection | undefined>;
  createCustodialNote(custodialNote: InsertCustodialNote): Promise<CustodialNote>;
  getCustodialNotes(): Promise<CustodialNote[]>;
  getCustodialNote(id: number): Promise<CustodialNote | undefined>;
  createRoomInspection(roomInspection: InsertRoomInspection): Promise<RoomInspection>;
  getRoomInspections(): Promise<RoomInspection[]>;
  getRoomInspection(id: number): Promise<RoomInspection | undefined>;
  getRoomInspectionsByBuildingId(buildingInspectionId: number): Promise<RoomInspection[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createInspection(insertInspection: InsertInspection): Promise<Inspection> {
    const [inspection] = await db
      .insert(inspections)
      .values(insertInspection)
      .returning();
    return inspection;
  }

  async getInspections(): Promise<Inspection[]> {
    return await db.select().from(inspections);
  }

  async getInspection(id: number): Promise<Inspection | undefined> {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
    return inspection || undefined;
  }

  async createCustodialNote(insertCustodialNote: InsertCustodialNote): Promise<CustodialNote> {
    const [custodialNote] = await db
      .insert(custodialNotes)
      .values(insertCustodialNote)
      .returning();
    return custodialNote;
  }

  async getCustodialNotes(): Promise<CustodialNote[]> {
    return await db.select().from(custodialNotes);
  }

  async getCustodialNote(id: number): Promise<CustodialNote | undefined> {
    const [custodialNote] = await db.select().from(custodialNotes).where(eq(custodialNotes.id, id));
    return custodialNote || undefined;
  }

  async updateInspection(id: number, updates: Partial<Inspection>): Promise<Inspection | undefined> {
    const [inspection] = await db
      .update(inspections)
      .set(updates)
      .where(eq(inspections.id, id))
      .returning();
    return inspection || undefined;
  }

  async createRoomInspection(insertRoomInspection: InsertRoomInspection): Promise<RoomInspection> {
    const [roomInspection] = await db
      .insert(roomInspections)
      .values(insertRoomInspection)
      .returning();
    return roomInspection;
  }

  async getRoomInspections(): Promise<RoomInspection[]> {
    return await db.select().from(roomInspections);
  }

  async getRoomInspection(id: number): Promise<RoomInspection | undefined> {
    const [roomInspection] = await db.select().from(roomInspections).where(eq(roomInspections.id, id));
    return roomInspection || undefined;
  }

  async getRoomInspectionsByBuildingId(buildingInspectionId: number): Promise<RoomInspection[]> {
    return await db.select().from(roomInspections).where(eq(roomInspections.buildingInspectionId, buildingInspectionId));
  }

  async deleteInspection(id: number): Promise<boolean> {
    const result = await db
      .delete(inspections)
      .where(eq(inspections.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();