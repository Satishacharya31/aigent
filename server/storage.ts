import { type User, type InsertUser, type ContentItem, type InsertContent, type ApiKey, type InsertApiKey } from "@shared/schema";
import { users, contentItems, apiKeys } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;

  // API Keys
  getApiKeys(userId: number): Promise<ApiKey[]>;
  getApiKey(userId: number, provider: string): Promise<ApiKey | undefined>;
  createApiKey(userId: number, apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, apiKey: Partial<ApiKey>): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<void>;

  // Content
  createContent(userId: number, content: InsertContent): Promise<ContentItem>;
  getUserContent(userId: number): Promise<ContentItem[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(user: Partial<User>): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getApiKeys(userId: number): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  }

  async getApiKey(userId: number, provider: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .where(eq(apiKeys.provider, provider));
    return apiKey;
  }

  async createApiKey(userId: number, apiKey: InsertApiKey): Promise<ApiKey> {
    const [newApiKey] = await db
      .insert(apiKeys)
      .values({ ...apiKey, userId })
      .returning();
    return newApiKey;
  }

  async updateApiKey(id: number, apiKey: Partial<ApiKey>): Promise<ApiKey> {
    const [updatedApiKey] = await db
      .update(apiKeys)
      .set(apiKey)
      .where(eq(apiKeys.id, id))
      .returning();
    return updatedApiKey;
  }

  async deleteApiKey(id: number): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async createContent(userId: number, content: InsertContent): Promise<ContentItem> {
    const [item] = await db
      .insert(contentItems)
      .values({ ...content, userId })
      .returning();
    return item;
  }

  async getUserContent(userId: number): Promise<ContentItem[]> {
    return await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.userId, userId));
  }
}

export const storage = new DatabaseStorage();