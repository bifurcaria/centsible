"use client";

import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";
import { PdfPasswordPrompt } from "@/components/PdfPasswordPrompt";
import { Analytics } from "@/components/Analytics";
import { TransactionTable } from "@/components/TransactionTable";
import { usePdfPasswordFlow } from "@/hooks/usePdfPasswordFlow";
import type { Transaction } from "@/types/transaction";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    isOpen,
    password,
    passwordError,
    setPassword,
    checkNeedsPassword,
    submitPassword,
    cancel,
  } = usePdfPasswordFlow();

  const processUnencryptedFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setIsCategorizing(false);
    setError(null);
    setTransactions([]);

    try {
      // First LLM call: parse
      const parseForm = new FormData();
      parseForm.append("file", file);
      const parseResponse = await fetch("/api/process-statement/parse", {
        method: "POST",
        body: parseForm,
      });

      if (!parseResponse.ok) {
        const message = await parseResponse.text();
        throw new Error(message || "Failed to parse statement.");
      }

      const parsed = (await parseResponse.json()) as Array<
        Omit<Transaction, "category">
      >;

      // Show parsed transactions immediately; income labeled, expenses pending
      const initial: Transaction[] = parsed.map((t) => ({
        ...t,
        category: t.amount >= 0 ? "Income" : "",
      }));
      setTransactions(initial);

      // Second LLM call: categorize expenses
      setIsCategorizing(true);
      const expenses = initial
        .filter((t) => t.amount < 0)
        .map((t) => ({ id: t.id, description: t.description, amount: t.amount }));

      const catResponse = await fetch("/api/process-statement/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenses }),
      });

      if (!catResponse.ok) {
        const message = await catResponse.text();
        throw new Error(message || "Failed to categorize expenses.");
      }

      const categorized = (await catResponse.json()) as Array<{
        id: string;
        category: string;
      }>;

      const catById = new Map(categorized.map((e) => [e.id, e.category]));
      setTransactions((prev) =>
        prev.map((t) =>
          t.amount >= 0 ? t : { ...t, category: catById.get(t.id) ?? "Other" },
        ),
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setError(message);
    } finally {
      setIsCategorizing(false);
      setIsLoading(false);
    }
  }, []);

  const processEncryptedFileWithPassword = useCallback(async () => {
    setIsLoading(true);
    setIsCategorizing(false);
    setHasSubmitted(true);
    setError(null);

    try {
      const result = await submitPassword();
      if (!result.ok) {
        // password errors are handled inside the hook; generic errors surface here
        if (result.reason === "generic" && result.message) {
          throw new Error(result.message);
        }
        return;
      }

      // First LLM call: parse (with text)
      const parseForm = new FormData();
      parseForm.append("text", result.text);
      const parseResponse = await fetch("/api/process-statement/parse", {
        method: "POST",
        body: parseForm,
      });

      if (!parseResponse.ok) {
        const message = await parseResponse.text();
        throw new Error(message || "Failed to parse statement.");
      }

      const parsed = (await parseResponse.json()) as Array<
        Omit<Transaction, "category">
      >;
      const initial: Transaction[] = parsed.map((t) => ({
        ...t,
        category: t.amount >= 0 ? "Income" : "",
      }));
      setTransactions(initial);

      // Second LLM call: categorize expenses
      setIsCategorizing(true);
      const expenses = initial
        .filter((t) => t.amount < 0)
        .map((t) => ({ id: t.id, description: t.description, amount: t.amount }));

      const catResponse = await fetch("/api/process-statement/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenses }),
      });

      if (!catResponse.ok) {
        const message = await catResponse.text();
        throw new Error(message || "Failed to categorize expenses.");
      }

      const categorized = (await catResponse.json()) as Array<{
        id: string;
        category: string;
      }>;
      const catById = new Map(categorized.map((e) => [e.id, e.category]));
      setTransactions((prev) =>
        prev.map((t) =>
          t.amount >= 0 ? t : { ...t, category: catById.get(t.id) ?? "Other" },
        ),
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setError(message);
    } finally {
      setIsCategorizing(false);
      setIsLoading(false);
    }
  }, [submitPassword]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      setHasSubmitted(true);
      try {
        setError(null);

        const status = await checkNeedsPassword(file);
        if (status === "needsPassword") {
          return;
        }

        // Not password-protected; proceed with existing flow
        await processUnencryptedFile(file);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.";
        setError(message);
      }
    },
    [checkNeedsPassword, processUnencryptedFile],
  );

  return (
    <main className="flex flex-1 flex-col gap-10">
      <section className="flex flex-col gap-12 justify-center items-center">
        <div className="flex flex-col gap-8 items-center">
          <h1 className="text-xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-center">
            Bank Statement Analyzer
          </h1>
          <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-300 text-center">
            Upload a bank statement PDF and let AI extract, categorize, and summarize your spending.
          </p>
        </div>
        {!hasSubmitted ? (
          <label className="flex w-full max-w-sm cursor-pointer flex-col items-center rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-4 py-6 text-center transition hover:border-neutral-400">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Select a bank statement (PDF)
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        ) : null}
        {error ? (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
        <PdfPasswordPrompt
          open={isOpen}
          password={password}
          error={passwordError}
          disabled={isLoading}
          onPasswordChange={setPassword}
          onSubmit={() => processEncryptedFileWithPassword()}
          onCancel={() => {
            cancel();
          }}
        />
      </section>

      {isLoading || transactions.length > 0 ? (
        <section className="flex flex-col gap-8">
          <Analytics
            transactions={transactions}
            isCategorizing={isCategorizing}
          />
          <TransactionTable
            transactions={transactions}
            setTransactions={setTransactions}
            skeletonRowCount={isLoading && transactions.length === 0 ? 12 : 0}
            isCategorizing={isCategorizing}
          />
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
