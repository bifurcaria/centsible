"use client";

import { useCallback, useState } from "react";
import type { ChangeEvent } from "react";
import { Summary } from "@/components/Summary";
import { TransactionTable } from "@/components/TransactionTable";
import type { Transaction } from "@/types/transaction";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/process-statement", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to process statement.");
        }

        const data = (await response.json());
        setTransactions(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <main className="flex flex-1 flex-col gap-10">
      <section className="flex flex-col gap-4 justify-center items-center">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">
          Bank Statement Analyzer
        </h1>
        <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-300 text-center">
          Upload a bank statement PDF and we will extract and categorize every
          transaction using Google Gemini, the Vercel AI SDK, and Langsmith
          tracing. You can fine-tune the suggested categories before saving your
          results elsewhere.
        </p>
        <label className="flex w-full max-w-sm cursor-pointer flex-col items-center rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-4 py-6 text-center transition hover:border-neutral-400">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {isLoading ? "Processing..." : "Select a bank statement (PDF)"}
          </span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
        </label>
        {error ? (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </section>

      {transactions.length > 0 ? (
        <section className="flex flex-col gap-8">
          <TransactionTable
            transactions={transactions}
            setTransactions={setTransactions}
          />
          <Summary transactions={transactions} />
        </section>
      ) : (
        <section className="flex flex-1 flex-col items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 p-12 text-center text-neutral-500 dark:text-neutral-400">
          <p className="max-w-md text-sm leading-6">
            No transactions yet. Upload a statement above to begin.
          </p>
        </section>
      )}
    </main>
  );
}

