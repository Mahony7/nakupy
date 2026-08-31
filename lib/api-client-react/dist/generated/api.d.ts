import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { Expense, ExpenseInput, ExpenseSummary, ExpenseUpdate, GetExpenseSummaryParams, HealthStatus, HouseholdSettings, HouseholdSettingsInput, ListExpensesParams, MonthlyExpenseStats } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListExpensesUrl: (params?: ListExpensesParams) => string;
/**
 * @summary List shared expenses
 */
export declare const listExpenses: (params?: ListExpensesParams, options?: Parameters<typeof customFetch>[1]) => Promise<Expense[]>;
export declare const getListExpensesQueryKey: (params?: ListExpensesParams) => readonly ["/api/expenses", ...ListExpensesParams[]];
export declare const getListExpensesQueryOptions: <TData = Awaited<ReturnType<typeof listExpenses>>, TError = ErrorType<unknown>>(params?: ListExpensesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listExpenses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listExpenses>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListExpensesQueryResult = NonNullable<Awaited<ReturnType<typeof listExpenses>>>;
export type ListExpensesQueryError = ErrorType<unknown>;
/**
 * @summary List shared expenses
 */
export declare function useListExpenses<TData = Awaited<ReturnType<typeof listExpenses>>, TError = ErrorType<unknown>>(params?: ListExpensesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listExpenses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateExpenseUrl: () => string;
/**
 * @summary Add a shared expense
 */
export declare const createExpense: (expenseInput: ExpenseInput, options?: Parameters<typeof customFetch>[1]) => Promise<Expense>;
export declare const getCreateExpenseMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createExpense>>, TError, {
        data: BodyType<ExpenseInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createExpense>>, TError, {
    data: BodyType<ExpenseInput>;
}, TContext>;
export type CreateExpenseMutationResult = NonNullable<Awaited<ReturnType<typeof createExpense>>>;
export type CreateExpenseMutationBody = BodyType<ExpenseInput>;
export type CreateExpenseMutationError = ErrorType<void>;
/**
* @summary Add a shared expense
*/
export declare const useCreateExpense: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createExpense>>, TError, {
        data: BodyType<ExpenseInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createExpense>>, TError, {
    data: BodyType<ExpenseInput>;
}, TContext>;
export declare const getGetExpenseSummaryUrl: (params: GetExpenseSummaryParams) => string;
/**
 * @summary Calculate monthly settlement
 */
export declare const getExpenseSummary: (params: GetExpenseSummaryParams, options?: Parameters<typeof customFetch>[1]) => Promise<ExpenseSummary>;
export declare const getGetExpenseSummaryQueryKey: (params?: GetExpenseSummaryParams) => readonly ["/api/expenses/summary", ...GetExpenseSummaryParams[]];
export declare const getGetExpenseSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getExpenseSummary>>, TError = ErrorType<unknown>>(params: GetExpenseSummaryParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExpenseSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getExpenseSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetExpenseSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getExpenseSummary>>>;
export type GetExpenseSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Calculate monthly settlement
 */
export declare function useGetExpenseSummary<TData = Awaited<ReturnType<typeof getExpenseSummary>>, TError = ErrorType<unknown>>(params: GetExpenseSummaryParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExpenseSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetExpenseStatsUrl: () => string;
/**
 * @summary Get expense statistics for the last twelve months
 */
export declare const getExpenseStats: (options?: Parameters<typeof customFetch>[1]) => Promise<MonthlyExpenseStats[]>;
export declare const getGetExpenseStatsQueryKey: () => readonly ["/api/expenses/stats"];
export declare const getGetExpenseStatsQueryOptions: <TData = Awaited<ReturnType<typeof getExpenseStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExpenseStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getExpenseStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetExpenseStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getExpenseStats>>>;
export type GetExpenseStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get expense statistics for the last twelve months
 */
export declare function useGetExpenseStats<TData = Awaited<ReturnType<typeof getExpenseStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExpenseStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateExpenseUrl: (id: number) => string;
/**
 * @summary Update an expense
 */
export declare const updateExpense: (id: number, expenseUpdate: ExpenseUpdate, options?: Parameters<typeof customFetch>[1]) => Promise<Expense>;
export declare const getUpdateExpenseMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateExpense>>, TError, {
        id: number;
        data: BodyType<ExpenseUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateExpense>>, TError, {
    id: number;
    data: BodyType<ExpenseUpdate>;
}, TContext>;
export type UpdateExpenseMutationResult = NonNullable<Awaited<ReturnType<typeof updateExpense>>>;
export type UpdateExpenseMutationBody = BodyType<ExpenseUpdate>;
export type UpdateExpenseMutationError = ErrorType<void>;
/**
* @summary Update an expense
*/
export declare const useUpdateExpense: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateExpense>>, TError, {
        id: number;
        data: BodyType<ExpenseUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateExpense>>, TError, {
    id: number;
    data: BodyType<ExpenseUpdate>;
}, TContext>;
export declare const getDeleteExpenseUrl: (id: number) => string;
/**
 * @summary Delete an expense
 */
export declare const deleteExpense: (id: number, options?: Parameters<typeof customFetch>[1]) => Promise<void>;
export declare const getDeleteExpenseMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteExpense>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteExpense>>, TError, {
    id: number;
}, TContext>;
export type DeleteExpenseMutationResult = NonNullable<Awaited<ReturnType<typeof deleteExpense>>>;
export type DeleteExpenseMutationError = ErrorType<void>;
/**
* @summary Delete an expense
*/
export declare const useDeleteExpense: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteExpense>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteExpense>>, TError, {
    id: number;
}, TContext>;
export declare const getGetHouseholdSettingsUrl: () => string;
/**
 * @summary Get shared household settings
 */
export declare const getHouseholdSettings: (options?: Parameters<typeof customFetch>[1]) => Promise<HouseholdSettings>;
export declare const getGetHouseholdSettingsQueryKey: () => readonly ["/api/settings"];
export declare const getGetHouseholdSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getHouseholdSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getHouseholdSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getHouseholdSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetHouseholdSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getHouseholdSettings>>>;
export type GetHouseholdSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get shared household settings
 */
export declare function useGetHouseholdSettings<TData = Awaited<ReturnType<typeof getHouseholdSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getHouseholdSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateHouseholdSettingsUrl: () => string;
/**
 * @summary Update shared household settings
 */
export declare const updateHouseholdSettings: (householdSettingsInput: HouseholdSettingsInput, options?: Parameters<typeof customFetch>[1]) => Promise<HouseholdSettings>;
export declare const getUpdateHouseholdSettingsMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateHouseholdSettings>>, TError, {
        data: BodyType<HouseholdSettingsInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateHouseholdSettings>>, TError, {
    data: BodyType<HouseholdSettingsInput>;
}, TContext>;
export type UpdateHouseholdSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateHouseholdSettings>>>;
export type UpdateHouseholdSettingsMutationBody = BodyType<HouseholdSettingsInput>;
export type UpdateHouseholdSettingsMutationError = ErrorType<void>;
/**
* @summary Update shared household settings
*/
export declare const useUpdateHouseholdSettings: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateHouseholdSettings>>, TError, {
        data: BodyType<HouseholdSettingsInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateHouseholdSettings>>, TError, {
    data: BodyType<HouseholdSettingsInput>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map