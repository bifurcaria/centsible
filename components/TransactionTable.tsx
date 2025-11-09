import type { Dispatch, SetStateAction } from "react";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import type { Transaction } from "@/types/transaction";

type TransactionTableProps = {
  transactions: Transaction[];
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
  skeletonRowCount?: number;
  isCategorizing?: boolean;
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const TransactionTable = ({
  transactions,
  setTransactions,
  skeletonRowCount = 0,
  isCategorizing = false,
}: TransactionTableProps) => {
  const handleCategoryChange = (id: string, category: string) => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id ? { ...transaction, category } : transaction,
      ),
    );
  };

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm h-[60vh] flex flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
        <thead className="bg-neutral-100 dark:bg-neutral-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Description
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Category
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {transactions.length === 0 && skeletonRowCount > 0
            ? Array.from({ length: skeletonRowCount }).map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="h-4 w-20 rounded skeleton-shimmer" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-3/5 rounded skeleton-shimmer" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="ml-auto h-4 w-16 rounded skeleton-shimmer" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-7 w-28 rounded skeleton-shimmer" />
                  </td>
                </tr>
              ))
            : null}
          {transactions.map((transaction) => {
            const isExpense = transaction.amount < 0;
            const isIncome = transaction.amount > 0;
            const amountClass = isExpense
              ? "text-red-600 dark:text-red-400"
              : isIncome
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-neutral-900 dark:text-neutral-200";

            return (
              <tr
                key={transaction.id}
                className="hover:bg-neutral-100 dark:hover:bg-neutral-800/40"
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {transaction.date}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                  {transaction.description}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold">
                  <span className={amountClass}>
                    {formatter.format(transaction.amount)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200">
                  {isIncome ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                      Income
                    </span>
                  ) : (
                    <>
                      {isCategorizing ? (
                        <div className="h-9 w-36 rounded-md skeleton-shimmer" />
                      ) : (
                        <select
                          className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/40"
                          value={transaction.category}
                          onChange={(event) =>
                            handleCategoryChange(transaction.id, event.target.value)
                          }
                        >
                          {EXPENSE_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
};
