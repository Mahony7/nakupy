import { z } from "zod/v4";
export declare const expensesTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "expenses";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "expenses";
            dataType: "number";
            columnType: "PgSerial";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        amount: import("drizzle-orm/pg-core").PgColumn<{
            name: "amount";
            tableName: "expenses";
            dataType: "number";
            columnType: "PgNumericNumber";
            data: number;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        paidBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "paid_by";
            tableName: "expenses";
            dataType: "string";
            columnType: "PgText";
            data: "me" | "wife";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["me", "wife"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        date: import("drizzle-orm/pg-core").PgColumn<{
            name: "date";
            tableName: "expenses";
            dataType: "string";
            columnType: "PgDateString";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        note: import("drizzle-orm/pg-core").PgColumn<{
            name: "note";
            tableName: "expenses";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "expenses";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const insertExpenseSchema: z.ZodObject<{
    date: z.ZodString;
    amount: z.ZodNumber;
    paidBy: z.ZodEnum<{
        me: "me";
        wife: "wife";
    }>;
    note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, {
    out: {};
    in: {};
}>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;
//# sourceMappingURL=expenses.d.ts.map