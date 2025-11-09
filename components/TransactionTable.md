# TransactionTable

`TransactionTable.tsx` renders the parsed transactions in a responsive table, highlighting incomes and expenses while exposing the suggested expense categories from the AI service.

The component accepts the transaction list and the parent `setTransactions` dispatcher so updates made through the category dropdown are immediately reflected in React state. Expense rows display a `<select>` pre-populated with the known categories, whereas income rows render a static “Income” pill for clarity.


