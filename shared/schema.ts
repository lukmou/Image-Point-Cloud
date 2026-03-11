
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  originalUrl: text("original_url").notNull(),
  depthMapUrl: text("depth_map_url"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  fileName: text("file_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUploadSchema = createInsertSchema(uploads).omit({ 
  id: true, 
  createdAt: true,
  status: true,
  depthMapUrl: true 
});

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
