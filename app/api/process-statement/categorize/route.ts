import { google } from "@ai-sdk/google";
import * as ai from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Client } from "langsmith";
import {
  wrapAISDK,
  createLangSmithProviderOptions,
} from "langsmith/experimental/vercel";

import { EXPENSE_CATEGORIES } from "@/lib/categories";

export const runtime = "nodejs";

const categorizationSchema = z.array(
  z.object({
    id: z.string(),
    category: z.string(),
  }),
);

const expenseInputSchema = z.array(
  z.object({
    id: z.string(),
    description: z.string(),
    amount: z.number(),
  }),
);

export async function POST(request: Request) {
  const client = new Client();
  const { generateObject } = wrapAISDK(ai);
  const langsmithOptions =
    createLangSmithProviderOptions<typeof ai.generateObject>();

  try {
    const body = await request.json();
    const parseResult = expenseInputSchema.safeParse(body?.expenses);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid expenses payload." },
        { status: 400 },
      );
    }

    const expenses = parseResult.data;
    if (expenses.length === 0) {
      return NextResponse.json([]);
    }

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

    return NextResponse.json(categorizationResult.object);
  } catch (error) {
    console.error("Failed to categorize expenses:", error);
    return NextResponse.json(
      { error: "Unable to categorize expenses. Please try again." },
      { status: 500 },
    );
  } finally {
    await client.awaitPendingTraceBatches();
  }
}


