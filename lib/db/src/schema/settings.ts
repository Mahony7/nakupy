import { boolean, pgTable, serial, text } from "drizzle-orm/pg-core";

export const householdSettingsTable = pgTable("household_settings", {
  id: serial("id").primaryKey(),
  configured: boolean("configured").notNull().default(false),
  myName: text("my_name").notNull(),
  partnerName: text("partner_name").notNull(),
  togetherSince: text("together_since").notNull(),
  headline: text("headline").notNull(),
  description: text("description").notNull(),
});