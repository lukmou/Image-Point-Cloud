
import { uploads, type Upload, type InsertUpload } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createUpload(upload: InsertUpload): Promise<Upload>;
  getUpload(id: number): Promise<Upload | undefined>;
  getUploads(): Promise<Upload[]>;
  updateUpload(id: number, updates: Partial<Upload>): Promise<Upload>;
}

export class DatabaseStorage implements IStorage {
  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const [upload] = await db
      .insert(uploads)
      .values(insertUpload)
      .returning();
    return upload;
  }

  async getUpload(id: number): Promise<Upload | undefined> {
    const [upload] = await db
      .select()
      .from(uploads)
      .where(eq(uploads.id, id));
    return upload;
  }

  async getUploads(): Promise<Upload[]> {
    return await db.select().from(uploads).orderBy(uploads.id);
  }

  async updateUpload(id: number, updates: Partial<Upload>): Promise<Upload> {
    const [upload] = await db
      .update(uploads)
      .set(updates)
      .where(eq(uploads.id, id))
      .returning();
    return upload;
  }
}

export const storage = new DatabaseStorage();
