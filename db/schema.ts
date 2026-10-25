import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  about: text("about").notNull(),
  favorites: text("favorites").notNull(),
  updatedAt: text("updated_at").notNull(),
});
