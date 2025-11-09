import { EXPENSE_CATEGORIES } from "@/lib/categories";
import type { Transaction } from "@/types/transaction";

type SummaryProps = {
  transactions: Transaction[];
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const formatPercent = (value: number) =>
  `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`;

export const Summary = ({ transactions }: SummaryProps) => {
  const expenses = transactions.filter((transaction) => transaction.amount < 0);
  const totalExpenses = expenses.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0
  );

  const totalsByCategory = EXPENSE_CATEGORIES.map((category) => {
    const total = expenses
      .filter((transaction) => transaction.category === category)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return {
      category,
      total,
      percent: totalExpenses === 0 ? 0 : (total / totalExpenses) * 100
    };
  }).filter((entry) => entry.total > 0);

  return (
    <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Spending Summary
          </h2>
          <p className="text-sm text-slate-400">
            Totals reflect expenses only and exclude income transactions.
          </p>
        </div>
        <div className="rounded-lg bg-red-500/10 px-4 py-2 text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-red-300">
            Total Spent
          </p>
          <p className="text-lg font-semibold text-red-400">
            {currency.format(-totalExpenses || 0)}
          </p>
        </div>
      </header>

      {totalsByCategory.length === 0 ? (
        <p className="text-sm text-slate-400">
          No expenses detected yet. Upload a statement to see your spending
          breakdown.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {totalsByCategory.map((entry) => (
            <li
              key={entry.category}
              className="flex flex-col gap-1 rounded-md border border-slate-800 bg-slate-950/60 px-4 py-3"
            >
              <span className="text-sm font-semibold text-slate-200">
                {entry.category}
              </span>
              <span className="text-base font-medium text-slate-100">
                {currency.format(-entry.total)}
              </span>
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {formatPercent(entry.percent)} of expenses
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};


