import { useCallback, useEffect } from "react";
import {
  GlobalWorkerOptions,
  getDocument,
  PasswordResponses,
  version as pdfjsVersion,
} from "pdfjs-dist";
import type {
  TextContent,
  TextItem,
  TextMarkedContent,
} from "pdfjs-dist/types/src/display/api";

export type PasswordStatus = "unencrypted" | "needsPassword";

export function usePdfPassword() {
  // Configure pdf.js worker once on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`;
    }
  }, []);

  const detectIfPasswordProtected = useCallback(
    async (file: File): Promise<PasswordStatus> => {
      const data = new Uint8Array(await file.arrayBuffer());
      try {
        const loadingTask = getDocument({ data });
        await loadingTask.promise; // success: not password-protected
        return "unencrypted";
      } catch (err: unknown) {
        const e = err as { name?: string; code?: number } | undefined;
        if (e?.name === "PasswordException" || typeof e?.code === "number") {
          if (e.code === PasswordResponses.NEED_PASSWORD) {
            return "needsPassword";
          }
        }
        throw new Error("Unable to read the PDF. It may be corrupted or unsupported.");
      }
    },
    [],
  );

  const extractTextFromPdf = useCallback(
    async (file: File, password?: string): Promise<string> => {
      const data = new Uint8Array(await file.arrayBuffer());
      const loadingTask = getDocument({ data, password });
      const pdf = await loadingTask.promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const content = (await page.getTextContent()) as TextContent;
        const pageText = content.items
          .filter(
            (item: TextItem | TextMarkedContent): item is TextItem =>
              (item as TextItem).str !== undefined,
          )
          .map((item: TextItem) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }
      return fullText.trim();
    },
    [],
  );

  return {
    detectIfPasswordProtected,
    extractTextFromPdf,
  };
}

export { PasswordResponses };


