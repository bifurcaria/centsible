import { useState, useCallback } from "react";
import { usePdfPassword, PasswordResponses } from "@/hooks/usePdfPassword";

type SubmitResult =
  | { ok: true; text: string }
  | { ok: false; reason: "password" | "generic"; message?: string };

export function usePdfPasswordFlow() {
  const { detectIfPasswordProtected, extractTextFromPdf } = usePdfPassword();

  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const checkNeedsPassword = useCallback(
    async (incomingFile: File): Promise<"unencrypted" | "needsPassword"> => {
      setPasswordError(null);
      const status = await detectIfPasswordProtected(incomingFile);
      if (status === "needsPassword") {
        setFile(incomingFile);
        setIsOpen(true);
      } else {
        setFile(null);
        setIsOpen(false);
      }
      return status;
    },
    [detectIfPasswordProtected],
  );

  const submitPassword = useCallback(async (): Promise<SubmitResult> => {
    if (!file) {
      return { ok: false, reason: "generic", message: "No file selected." };
    }
    setPasswordError(null);
    try {
      const text = await extractTextFromPdf(file, password);
      // Hide form and clear state on success
      setIsOpen(false);
      setPassword("");
      setFile(null);
      return { ok: true, text };
    } catch (err: unknown) {
      const e = err as { name?: string; code?: number } | undefined;
      if (e?.name === "PasswordException" || typeof e?.code === "number") {
        if (e.code === PasswordResponses.INCORRECT_PASSWORD) {
          setPasswordError("Incorrect password. Please try again.");
        } else if (e.code === PasswordResponses.NEED_PASSWORD) {
          setPasswordError("A password is required to open this PDF.");
        } else {
          setPasswordError("Unable to open the PDF with the provided password.");
        }
        return { ok: false, reason: "password" };
      }
      return {
        ok: false,
        reason: "generic",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.",
      };
    }
  }, [extractTextFromPdf, file, password]);

  const cancel = useCallback(() => {
    setIsOpen(false);
    setPassword("");
    setPasswordError(null);
    setFile(null);
  }, []);

  return {
    // state
    isOpen,
    password,
    passwordError,
    // actions
    setPassword,
    checkNeedsPassword,
    submitPassword,
    cancel,
  };
}


