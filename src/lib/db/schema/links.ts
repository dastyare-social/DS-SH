import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const links = pgTable("links", {
  id: text("id").unique().primaryKey(),
  r_path: text("r_path").notNull().unique(),
  r_to: text("r_to").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  redirects: text("redirects").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
