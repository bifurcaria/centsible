import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Centsible - Bank Statement Analyzer",
  description:
    "Upload a bank statement PDF and let AI extract, categorize, and summarize your spending."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
          {children}
        </div>
      </body>
    </html>
  );
}

