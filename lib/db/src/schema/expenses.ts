import { createInsertSchema } from "drizzle-zod";
import { date, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  paidBy: text("paid_by", { enum: ["me", "wife"] }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expensesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;