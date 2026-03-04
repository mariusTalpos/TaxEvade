# Contract: Normalized Transaction and Import Result

**Feature**: 001-csv-ledger-import  
**Consumers**: Ledger storage service, UI components, import pipeline

## Transaction (in-app shape)

Type/interface used in code and storage:

```ts
interface Transaction {
  id: string;
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;      // positive = inflow, negative = outflow
  account: string;
  importedAt?: string; // ISO datetime, optional
}
```

- **id**: Unique, stable (e.g. UUID or hash of date+amount+description+account). Used as primary key in IndexedDB.
- **date**, **description**, **amount**, **account**: Required; set by parser (date, description, amount) and import context (account).
- **importedAt**: Optional; set at insert time.

## Deduplication Key

A transaction is considered a duplicate if an existing record has the same `(date, amount, description, account)`. The `id` is not part of the duplicate key (it is assigned after deduplication).

## Import Result (returned after each import)

```ts
interface ImportResult {
  added: number;
  skippedAsDuplicate: number;
  skippedInvalid?: number;  // optional; rows that failed validation
  error?: string;            // set if whole-file error (e.g. unsupported format)
}
```

- **added**: Count of new transactions written to the ledger.
- **skippedAsDuplicate**: Count of rows that matched an existing transaction.
- **skippedInvalid**: Optional count of rows skipped due to parse/validation errors.
- **error**: If set, import did not add or skip incrementally; user should see this message (e.g. "Unsupported CSV format").

## List and Filter Contract

The ledger list view receives a **read-only stream or array** of `Transaction` (or a signal of the same). Filtering and search are applied in the container or service and return a subset of `Transaction[]`. No separate API contract for list beyond the Transaction shape; filters are optional query parameters (date range, account, inflow/outflow) and search is a string (match on description or amount).
