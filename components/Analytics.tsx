"use client";

import type { Transaction } from "@/types/transaction";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
);

// Ensure charts use Instrument Sans to match the app typography
ChartJS.defaults.font.family =
  "'Instrument Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

type AnalyticsProps = {
  transactions: Transaction[];
  isCategorizing?: boolean;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function Analytics({
  transactions,
  isCategorizing = false,
}: AnalyticsProps) {
  if (transactions.length === 0 || isCategorizing) return null;

  const expenses = transactions.filter((t) => t.amount < 0);

  const totalsByCategory = EXPENSE_CATEGORIES.map((category) => {
    const total = expenses
      .filter((t) => t.category === category)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { category, total };
  }).filter((e) => e.total > 0);

  const donutData = {
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
  };

  // Aggregate by date (net total per day)
  const dailyTotals = transactions.reduce<Record<string, number>>(
    (acc, t) => {
      acc[t.date] = (acc[t.date] ?? 0) + t.amount;
      return acc;
    },
    {},
  );
  const sortedDates = Object.keys(dailyTotals).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );
  const lineData = {
    labels: sortedDates,
    datasets: [
      {
        label: "Net per day",
        data: sortedDates.map((d) => dailyTotals[d]),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.15)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <section className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 shadow-sm p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Spending Analytics
        </h2>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Total spent:{" "}
          <span className="font-semibold text-red-600 dark:text-red-400">
            {currency.format(
              expenses.reduce((s, t) => s + Math.abs(t.amount), 0),
            )}
          </span>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="relative h-64 w-full">
          <Doughnut
            data={donutData}
            options={{
              plugins: { legend: { display: false } },
              cutout: "64%",
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
        <div className="relative h-64 w-full">
          <Line
            data={lineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  grid: { color: "rgba(255,255,255,0.06)" },
                },
                y: {
                  grid: { color: "rgba(255,255,255,0.06)" },
                },
              },
            }}
          />
        </div>
      </div>
    </section>
  );
}


