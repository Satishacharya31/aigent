import { pgTable, text, serial, timestamp, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email"),  // Made nullable
  password: text("password"),
  googleId: text("google_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  provider: varchar("provider", { length: 50 }).notNull(), // openai, gemini, claude, deepseek
  apiKey: text("api_key").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentItems = pgTable("content_items", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // blog, facebook, script
  model: varchar("model", { length: 100 }), // Made nullable, which AI model generated this
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for user registration
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    email: true,
    password: true,
  })
  .extend({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

// Schema for API keys
export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  provider: true,
  apiKey: true,
});

// Schema for content items
export const insertContentSchema = createInsertSchema(contentItems).pick({
  title: true,
  content: true,
  type: true,
  model: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;