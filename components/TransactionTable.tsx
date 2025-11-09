import type { Dispatch, SetStateAction } from "react";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import type { Transaction } from "@/types/transaction";

type TransactionTableProps = {
  transactions: Transaction[];
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export const TransactionTable = ({
  transactions,
  setTransactions
}: TransactionTableProps) => {
  const handleCategoryChange = (id: string, category: string) => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id ? { ...transaction, category } : transaction
      )
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60 shadow-sm">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Description
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Category
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {transactions.map((transaction) => {
            const isExpense = transaction.amount < 0;
            const isIncome = transaction.amount > 0;
            const amountClass = isExpense
              ? "text-red-400"
              : isIncome
                ? "text-emerald-400"
                : "text-slate-200";

            return (
              <tr key={transaction.id} className="hover:bg-slate-800/40">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-100">
                  {transaction.date}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {transaction.description}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold">
                  <span className={amountClass}>
                    {formatter.format(transaction.amount)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {isIncome ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                      Income
                    </span>
                  ) : (
                    <select
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/40"
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

