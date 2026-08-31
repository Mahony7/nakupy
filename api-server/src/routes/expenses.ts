import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateExpenseBody,
  CreateExpenseResponse,
  DeleteExpenseParams,
  GetExpenseSummaryQueryParams,
  GetExpenseSummaryResponse,
  GetExpenseStatsResponse,
  ListExpensesQueryParams,
  ListExpensesResponse,
  UpdateExpenseBody,
  UpdateExpenseParams,
  UpdateExpenseResponse,
} from "@workspace/api-zod";
import { db, expensesTable } from "@workspace/db";

const router: IRouter = Router();

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function monthBounds(month: string): { start: string; end: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const endDate = new Date(Date.UTC(year, monthNumber, 1));
  return {
    start: `${month}-01`,
    end: endDate.toISOString().slice(0, 10),
  };
}

function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function responseExpense(expense: typeof expensesTable.$inferSelect) {
  return {
    ...expense,
    amount: Number(expense.amount),
    date: new Date(`${expense.date}T00:00:00.000Z`),
  };
}

async function expensesForMonth(month: string) {
  const bounds = monthBounds(month);
  return db
    .select()
    .from(expensesTable)
    .where(and(gte(expensesTable.date, bounds.start), lt(expensesTable.date, bounds.end)))
    .orderBy(desc(expensesTable.date), desc(expensesTable.id));
}

router.get("/expenses", async (req, res): Promise<void> => {
  const parsed = ListExpensesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid expense list query");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const month = parsed.data.month ?? currentMonth();
  const rows = await expensesForMonth(month);
  res.json(ListExpensesResponse.parse(rows.map(responseExpense)));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid expense body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [expense] = await db
    .insert(expensesTable)
    .values({
      amount: parsed.data.amount,
      paidBy: parsed.data.paidBy,
      date: toCalendarDate(parsed.data.date),
      note: parsed.data.note ?? null,
    })
    .returning();

  res.status(201).json(CreateExpenseResponse.parse(responseExpense(expense)));
});

router.get("/expenses/summary", async (req, res): Promise<void> => {
  const parsed = GetExpenseSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid expense summary query");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = await expensesForMonth(parsed.data.month);
  const paidByMe = rows
    .filter((expense) => expense.paidBy === "me")
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  const paidByWife = rows
    .filter((expense) => expense.paidBy === "wife")
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  const total = paidByMe + paidByWife;
  const halfTotal = total / 2;
  const balance = Math.round((paidByMe - halfTotal) * 100) / 100;
  const debtor = Math.abs(balance) < 0.01 ? null : balance > 0 ? "wife" : "me";

  res.json(
    GetExpenseSummaryResponse.parse({
      month: parsed.data.month,
      total,
      paidByMe,
      paidByWife,
      halfTotal,
      balance,
      debtor,
      expenseCount: rows.length,
    }),
  );
});

router.get("/expenses/stats", async (_req, res): Promise<void> => {
  const end = new Date();
  end.setDate(1);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 11);
  const endMonth = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`;
  const startMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
  const endDate = new Date(Date.UTC(end.getFullYear(), end.getMonth() + 1, 1)).toISOString().slice(0, 10);

  const rows = await db
    .select({
      month: sql<string>`to_char(${expensesTable.date}, 'YYYY-MM')`,
      total: sql<number>`coalesce(sum(${expensesTable.amount}), 0)`,
      paidByMe: sql<number>`coalesce(sum(case when ${expensesTable.paidBy} = 'me' then ${expensesTable.amount} else 0 end), 0)`,
      paidByWife: sql<number>`coalesce(sum(case when ${expensesTable.paidBy} = 'wife' then ${expensesTable.amount} else 0 end), 0)`,
      expenseCount: sql<number>`count(*)`,
    })
    .from(expensesTable)
    .where(and(gte(expensesTable.date, `${startMonth}-01`), lt(expensesTable.date, endDate)))
    .groupBy(sql`to_char(${expensesTable.date}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${expensesTable.date}, 'YYYY-MM')`);

  const byMonth = new Map(rows.map((row) => [row.month, row]));
  const result = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(start);
    date.setMonth(start.getMonth() + index);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const row = byMonth.get(month);
    return {
      month,
      total: Number(row?.total ?? 0),
      paidByMe: Number(row?.paidByMe ?? 0),
      paidByWife: Number(row?.paidByWife ?? 0),
      expenseCount: Number(row?.expenseCount ?? 0),
    };
  });

  res.json(GetExpenseStatsResponse.parse(result));
});

router.patch("/expenses/:id", async (req, res): Promise<void> => {
  const params = UpdateExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid expense update body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Partial<typeof expensesTable.$inferInsert> = {};
  if (parsed.data.amount !== undefined) update.amount = parsed.data.amount;
  if (parsed.data.paidBy !== undefined) update.paidBy = parsed.data.paidBy;
  if (parsed.data.date !== undefined) update.date = toCalendarDate(parsed.data.date);
  if (parsed.data.note !== undefined) update.note = parsed.data.note ?? null;

  const [expense] = await db
    .update(expensesTable)
    .set(update)
    .where(eq(expensesTable.id, params.data.id))
    .returning();

  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  res.json(UpdateExpenseResponse.parse(responseExpense(expense)));
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [expense] = await db
    .delete(expensesTable)
    .where(eq(expensesTable.id, params.data.id))
    .returning({ id: expensesTable.id });

  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;