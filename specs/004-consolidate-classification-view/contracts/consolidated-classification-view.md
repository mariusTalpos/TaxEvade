# Contract: Consolidated Classification View and Auto-Classification

**Feature**: 004-consolidate-classification-view  
**Consumers**: Classification container, classification table, ledger-page (import), auto-classification pipeline  
**Extends**: 002 classification-transaction contract; 003 classified-transactions-view contract (edit/save/clear). This document defines the consolidated view and import-time auto-classification.

## Auto-Classification at Import (001 CSV Import)

- **Trigger**: When the user completes a CSV import via feature 001 (ledger-page: parse CSV → addTransactions(rows, account)), **after** new transactions are written to the ledger, the system runs **auto-classification** for each newly added transaction.
- **Pipeline**: (1) Run built-in rules (ClassificationHeuristicsService.suggest(tx)). If non-null, use that result. (2) Optionally, if no rule result (or per product: always), call AI (e.g. ClassificationAiService → Ollama). If AI returns a result, use it. (3) **Apply** the chosen result: persist classificationType, classificationCategory, classificationNotes, and store the same values and source/confidence in suggestion* fields for display. If no result from rules or AI, leave transaction unclassified (no classificationType); it will appear in the single view for manual classification.
- **Parallelism**: The pipeline MAY run with **bounded parallelism** (e.g. a limited number of concurrent classification tasks) so that large batches complete in less wall-clock time (FR-014). Order of persistence is unspecified; the consumer (ledger-page) refreshes the list after the full run completes.
- **Failure handling**: If AI is unavailable (Ollama not running, CORS, timeout), treat as no AI result; use rule result if any, else leave unclassified. Import MUST complete; do not block or fail the import (FR-011).
- **Contract**: Input = addedTransactions (Transaction[]). Output = side-effect only: updateTransaction(id, { classificationType?, classificationCategory?, classificationNotes?, suggestionType?, suggestionCategory?, suggestionConfidence?, suggestionSourceId? }) for each transaction that received a classification.

## Single Classification View (UI)

- **Input**: All transactions from the ledger (e.g. getAll()). Filter state: "all" | "unclassified" | by classificationType | by classificationCategory. Sort state (column, direction). Pagination (page index, page size). Selection (selectedTransactionId: string | null). Draft (type, category, notes) for the selected row, in-memory only until Save.
- **Output (user actions)**:
  - **Edit and Save**: Persist draft for the selected transaction (classificationType, classificationCategory, classificationNotes). Validation: if type is income or expense, category must be non-empty; else show message and do not persist. After save, refresh list (or update signal).
  - **Clear classification**: User clears type (and category/notes). On Save, persist by clearing classification fields; transaction becomes unclassified. It remains in the same view (filterable as "unclassified").
  - **Bulk actions** (optional): e.g. "Accept all high confidence" over filtered list; apply current suggestion or stored classification for matching rows; implementation-defined. MUST NOT create user-defined rules.
  - **Navigate away or change selection without Save**: Discard draft; do not persist; do not prompt.
- **Display**: For each row show: transaction id, date, description, amount, account; classificationType, classificationCategory, classificationNotes; when present, suggestionSourceId and suggestionConfidence (e.g. "Rule: transfer-detection", "AI", "Manual"). Filter control includes "Unclassified" so the user can focus on transactions that still need classification.

## Types (reuse from 002)

Same ClassificationType, Confidence, TransactionWithClassification as in 002. Allowed categories from classification config (e.g. classification-config.json).

## Heuristic and AI Service Contracts

- **ClassificationHeuristicsService.suggest(tx)**: (002) Returns ClassificationSuggestion | null. Used first in the auto-classification pipeline.
- **ClassificationAiService** (new, optional): `suggest(tx: Transaction): Promise<ClassificationSuggestion | null>`. Calls local Ollama (or equivalent); returns suggestion or null on failure/timeout. Used when rules return null (or per product: always) in the auto-classification pipeline.
