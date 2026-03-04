/**
 * Normalized transaction stored in the ledger.
 * @see specs/001-csv-ledger-import/contracts/normalized-transaction.md
 */
export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive = inflow, negative = outflow
  account: string;
  importedAt?: string; // ISO datetime, optional
}

/**
 * Result of an import operation.
 * @see specs/001-csv-ledger-import/contracts/normalized-transaction.md
 */
export interface ImportResult {
  added: number;
  skippedAsDuplicate: number;
  skippedInvalid?: number;
  error?: string;
}

/**
 * Parsed row from CSV before id and account are assigned (parser output).
 */
export interface TransactionRow {
  date: string;
  description: string;
  amount: number;
}
