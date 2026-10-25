import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  about: text("about").notNull(),
  favorites: text("favorites").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const githubSnapshot = sqliteTable("github_snapshot", {
  id: text("id").primaryKey(),
  payload: text("payload"),
  checkedAt: integer("checked_at"),
  nextRefreshAt: integer("next_refresh_at").notNull().default(0),
  leaseUntil: integer("lease_until").notNull().default(0),
});
