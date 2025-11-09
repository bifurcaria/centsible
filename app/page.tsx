"use client";

import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";
import { PdfPasswordPrompt } from "@/components/PdfPasswordPrompt";
import { Summary } from "@/components/Summary";
import { TransactionTable } from "@/components/TransactionTable";
import { usePdfPasswordFlow } from "@/hooks/usePdfPasswordFlow";
import type { Transaction } from "@/types/transaction";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/process-statement", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to process statement.");
      }

      const data = await response.json();
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
  }, []);

  const processEncryptedFileWithPassword = useCallback(async () => {
    setIsLoading(true);
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

      const formData = new FormData();
      formData.append("text", result.text);

      const response = await fetch("/api/process-statement", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to process statement.");
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [submitPassword]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

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
            Upload a bank statement PDF and we will extract and categorize every
            transaction using Google Gemini, the Vercel AI SDK, and Langsmith
            tracing. You can fine-tune the suggested categories before saving
            your results elsewhere.
          </p>
        </div>
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
