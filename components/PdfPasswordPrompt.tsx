import type { FC } from "react";

type Props = {
  open: boolean;
  password: string;
  error: string | null;
  disabled?: boolean;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export const PdfPasswordPrompt: FC<Props> = ({
  open,
  password,
  error,
  disabled,
  onPasswordChange,
  onSubmit,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="w-full max-w-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 p-4">
      <p className="mb-3 text-sm text-neutral-700 dark:text-neutral-200">
        This PDF is password protected. Enter the password to continue.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="password"
          className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none"
          placeholder="Password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          className="rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
          onClick={onSubmit}
          disabled={disabled || password.length === 0}
        >
          {disabled ? "Processing..." : "Submit"}
        </button>
        <button
          type="button"
          className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60"
          onClick={onCancel}
          disabled={disabled}
        >
          Cancel
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
};


