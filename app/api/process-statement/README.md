# `/api/process-statement`

This server action accepts a bank statement PDF via `FormData`, forwards it to Google Gemini through the Vercel AI SDK, and returns structured transaction data.

1. **Parsing:** Creates a Langsmith `Client`, wraps the Gemini model with `wrapAISDKModel` for tracing, calls `generateObject` with the raw PDF, and validates the response against the Zod parsing schema.
2. **Categorization:** Runs a second `generateObject` call that assigns categories to each expense, again traced and schema-validated.
3. **Response:** Merges the predicted categories back into the complete transaction list, flushes traces with `client.awaitPendingTraceBatches()`, and returns the enriched `Transaction[]` as JSON.


