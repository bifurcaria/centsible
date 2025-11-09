import { google } from "@ai-sdk/google";
import * as ai from "ai";
import { Client } from "langsmith";
import {
  createLangSmithProviderOptions,
  wrapAISDK,
} from "langsmith/experimental/vercel";
import { NextResponse } from "next/server";
import { z } from "zod";

import { EXPENSE_CATEGORIES } from "@/lib/categories";
import type { Transaction } from "@/types/transaction";

export const runtime = "nodejs";

const parsingSchema = z.array(
  z.object({
    date: z.string(),
    description: z.string(),
    amount: z.number(),
  }),
);

type ParsedTransaction = z.infer<typeof parsingSchema>[number];

const categorizationSchema = z.array(
  z.object({
    id: z.string(),
    category: z.string(),
  }),
);

export async function POST(request: Request) {
  const client = new Client();
  const { generateObject } = wrapAISDK(ai);
  const langsmithOptions =
    createLangSmithProviderOptions<typeof ai.generateObject>();

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const text = formData.get("text");

    if (
      (!file || !(file instanceof File)) &&
      !(typeof text === "string" && text.trim().length > 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Provide either a PDF under `file` or plain text under `text`.",
        },
        { status: 400 },
      );
    }

    const parsingPrompt =
      "Extract all financial transactions from this bank statement. Incomes must be positive numbers, and expenses must be negative numbers.";

    // Prepare parsing messages depending on input type (text vs file)
    let messages:
      | [
          {
            role: "user";
            content:
              | { type: "text"; text: string }[]
              | (
                  | {
                      type: "file";
                      data: Uint8Array;
                      mediaType: "application/pdf";
                    }
                  | { type: "text"; text: string }
                )[];
          },
        ]
      | undefined;

    if (typeof text === "string" && text.trim().length > 0) {
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                parsingPrompt,
                "Here is the statement text to extract transactions from:",
                text,
              ].join("\n\n"),
            },
          ],
        },
      ];
    } else {
      const pdfBytes = await (file as File).arrayBuffer();
      messages = [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: new Uint8Array(pdfBytes),
              mediaType: "application/pdf",
            },
            {
              type: "text",
              text: parsingPrompt,
            },
          ],
        },
      ];
    }

    const parsingResult = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: parsingSchema,
      mode: "json",
      providerOptions: { langsmith: langsmithOptions },
      messages,
    });

    const parsedTransactions = parsingResult.object.map(
      (transaction: ParsedTransaction) => ({
        ...transaction,
        id: crypto.randomUUID(),
      }),
    );

    const expenses = parsedTransactions.filter(
      (transaction) => transaction.amount < 0,
    );

    let categorizedExpenses: z.infer<typeof categorizationSchema> = [];

    if (expenses.length > 0) {
      const categorizationPrompt = [
        "You are categorizing expense transactions from a bank statement.",
        "Select the best matching category for each expense from this list:",
        EXPENSE_CATEGORIES.join(", "),
        "Respond strictly with the JSON array matching the schema provided.",
        "Here are the expenses to categorize:",
        JSON.stringify(
          expenses.map((expense) => ({
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
          })),
        ),
      ].join("\n\n");

      const categorizationResult = await generateObject({
        model: google("gemini-2.5-flash-lite"),
        schema: categorizationSchema,
        mode: "json",
        providerOptions: { langsmith: langsmithOptions },
        prompt: categorizationPrompt,
      });

      categorizedExpenses = categorizationResult.object;
    }

    const categoriesById = new Map(
      categorizedExpenses.map((entry) => [entry.id, entry.category]),
    );

    const transactions: Transaction[] = parsedTransactions.map(
      (transaction) => {
        if (transaction.amount >= 0) {
          return {
            ...transaction,
            category: "Income",
          };
        }

        const category = categoriesById.get(transaction.id) ?? "Other";

        return {
          ...transaction,
          category,
        };
      },
    );

    return NextResponse.json(transactions satisfies Transaction[]);
  } catch (error) {
    console.error("Failed to process statement:", error);
    return NextResponse.json(
      { error: "Unable to process the provided statement. Please try again." },
      { status: 500 },
    );
  } finally {
    await client.awaitPendingTraceBatches();
  }
}
