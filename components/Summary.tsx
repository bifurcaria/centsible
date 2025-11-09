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
                      "#ef4444", // red-500
                      "#f97316", // orange-500
                      "#f59e0b", // amber-500
                      "#eab308", // yellow-500
                      "#84cc16", // lime-500
                      "#22c55e", // green-500
                      "#10b981", // emerald-500
                      "#14b8a6", // teal-500
                      "#06b6d4", // cyan-500
                      "#0ea5e9", // sky-500
                      "#3b82f6", // blue-500
                      "#6366f1", // indigo-500
                      "#8b5cf6", // violet-500
                      "#a855f7", // purple-500
                      "#d946ef", // fuchsia-500
                      "#ec4899", // pink-500
                      "#f43f5e", // rose-500
                      "#94a3b8", // slate-400
                      "#a8a29e", // stone-400
                      "#a3a3a3", // neutral-400
                      "#71717a", // zinc-500
                      "#737373", // gray-500
                      "#fb923c", // orange-400
                      "#22d3ee", // cyan-400
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
