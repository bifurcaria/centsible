"use client";

import { EXPENSE_CATEGORIES } from "@/lib/categories";
import type { Transaction } from "@/types/transaction";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

type SummaryProps = {
  transactions: Transaction[];
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatPercent = (value: number) =>
  `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`;

export const Summary = ({ transactions }: SummaryProps) => {
  const expenses = transactions.filter((transaction) => transaction.amount < 0);
  const totalExpenses = expenses.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0,
  );

  const totalsByCategory = EXPENSE_CATEGORIES.map((category) => {
    const total = expenses
      .filter((transaction) => transaction.category === category)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return {
      category,
      total,
      percent: totalExpenses === 0 ? 0 : (total / totalExpenses) * 100,
    };
  }).filter((entry) => entry.total > 0);

  return (
    <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm">
      <header className="flex flex-col gap-4 items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">
            Spending Summary
          </h2>
          <p className="text-sm text-zinc-400">
            Totals reflect expenses only and exclude income transactions.
          </p>
        </div>
        <div className="w-full rounded-lg bg-red-500/10 px-4 py-2 text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-red-300">
            Total Spent
          </p>
          <p className="text-lg font-semibold text-red-400">
            {currency.format(totalExpenses || 0)}
          </p>
        </div>
      </header>

      {totalsByCategory.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No expenses detected yet. Upload a statement to see your spending
          breakdown.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-64 w-full">
            <Doughnut
              data={{
                labels: totalsByCategory.map((t) => t.category),
                datasets: [
                  {
                    label: "Expenses",
                    data: totalsByCategory.map((t) => t.total),
                    backgroundColor: [
                      "#ef4444",
                      "#f97316",
                      "#f59e0b",
                      "#eab308",
                      "#84cc16",
                      "#22c55e",
                      "#14b8a6",
                      "#06b6d4",
                      "#3b82f6",
                      "#8b5cf6",
                      "#a855f7",
                      "#d946ef",
                    ],
                    borderColor: "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    hoverOffset: 6,
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                cutout: "64%",
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
          <ul className="grid w-full gap-3 sm:grid-cols-2">
            {totalsByCategory.map((entry) => (
              <li
                key={entry.category}
                className="flex flex-col gap-1 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2"
              >
                <span className="text-sm font-semibold text-zinc-200">
                  {entry.category}
                </span>
                <span className="text-sm font-medium text-zinc-100">
                  {currency.format(-entry.total)}{" "}
                  <span className="text-xs uppercase tracking-wide text-zinc-400">
                    ({formatPercent(entry.percent)})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
