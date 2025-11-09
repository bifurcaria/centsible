import { google } from "@ai-sdk/google";
import * as ai from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Client } from "langsmith";
import {
  wrapAISDK,
  createLangSmithProviderOptions,
} from "langsmith/experimental/vercel";

export const runtime = "nodejs";

const parsingSchema = z.array(
  z.object({
    date: z.string().describe("The date of the transaction in the format YYYY-MM-DD"),
    description: z.string(),
    amount: z.number(),
  }),
);

type ParsedTransaction = z.infer<typeof parsingSchema>[number];

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
      "Extract all financial transactions from this statement (bank or credit card). Normalize amounts regardless of how they appear in the document: expenses/purchases/charges must be negative numbers, and income/credits/refunds/payments must be positive numbers. If the statement is a credit card statement, purchases should be negative and payments/refunds should be positive. Infer the correct sign when it is missing or ambiguous.";

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

    return NextResponse.json(parsedTransactions);
  } catch (error) {
    console.error("Failed to parse statement:", error);
    return NextResponse.json(
      { error: "Unable to parse the provided statement. Please try again." },
      { status: 500 },
    );
  } finally {
    await client.awaitPendingTraceBatches();
  }
}


