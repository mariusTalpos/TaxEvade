import type { ClassificationType, Confidence } from './classification.model';

/**
 * Normalized transaction stored in the ledger.
 * @see specs/001-csv-ledger-import/contracts/normalized-transaction.md
 * Extended with optional classification and suggestion fields (002).
 */
export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive = inflow, negative = outflow
  account: string;
  importedAt?: string; // ISO datetime, optional
  // Classification (set when user or bulk submit applies)
  classificationType?: ClassificationType;
  classificationCategory?: string;
  classificationNotes?: string;
  // Suggestion (set when heuristics run, e.g. at import)
  suggestionType?: ClassificationType;
  suggestionCategory?: string;
  suggestionConfidence?: Confidence;
  suggestionSourceId?: string;
}

/**
 * Result of an import operation.
 * @see specs/001-csv-ledger-import/contracts/normalized-transaction.md
 * addedTransactions: optional list of newly added transactions (002) for running heuristics.
 */
export interface ImportResult {
  added: number;
  skippedAsDuplicate: number;
  skippedInvalid?: number;
  error?: string;
  addedTransactions?: Transaction[];
}

/**
 * Parsed row from CSV before id and account are assigned (parser output).
 */
export interface TransactionRow {
  date: string;
  description: string;
  amount: number;
}
