import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
export const metadata: Metadata = {
  title: "Centsible - Bank Statement Analyzer",
  description:
    "Upload a bank statement PDF and let AI extract, categorize, and summarize your spending."
};

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap"
});
export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
          {children}
        </div>
      </body>
    </html>
  );
}

