# Contract: Transaction with Classification and Suggestion

**Feature**: 002-guided-transaction-classification  
**Consumers**: Ledger storage service, classification heuristics service, classification view, edit-classifications view  
**Extends**: 001-csv-ledger-import Transaction contract

## Classification types and confidence

```ts
type ClassificationType = 'income' | 'expense' | 'transfer' | 'ignore';

type Confidence = 'High' | 'Medium' | 'Low';

interface ClassificationSuggestion {
  type: ClassificationType;
  category?: string;   // required when type is income or expense
  confidence: Confidence;
  sourceId: string;   // heuristic/rule identifier
}
```

- **Confidence** ordering for "at or above": High > Medium > Low. Helper: `confidenceAtOrAbove(c: Confidence, threshold: Confidence): boolean`.
- **Categories**: The list of allowed categories is supplied from the classification config file (e.g. `classification-config.json`); heuristics and UI use this list for suggestions and validation.

## Transaction (extended)

In-app and storage shape; extends Transaction from 001:

```ts
interface TransactionWithClassification extends Transaction {
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
```

- **Unclassified**: `classificationType` is undefined (or null). Classification view lists such transactions.
- **With suggestion**: When `suggestionType` (and optionally suggestionCategory, suggestionConfidence, suggestionSourceId) is set, the UI shows the pre-populated suggestion; user may edit before Submit.
- **Category**: When classificationType or suggestionType is income/expense, the corresponding category must be non-empty when persisting.

## Classification view contract

- **Input**: List of `TransactionWithClassification[]` where `classificationType` is absent (unclassified). Optional pagination/sort/filter state.
- **Output**: User actions: Submit (current), Submit All, Submit by confidence (High only / Medium or higher / Low or higher). Each action produces updates: set `classificationType`, `classificationCategory`, `classificationNotes` from the current suggestion (or user edit) for the selected transaction(s). Transactions with no suggestion are skipped in bulk actions.
- **Submit (current)**: Updates exactly the transaction that is currently selected (by id). If no transaction is selected, Submit is a no-op.
- **Submit All**: Updates every unclassified transaction that has a suggestion (or user-edited values) **across all pages**. Use this when you trust the auto categorization; all such transactions are classified in one action.
- **Submit by confidence**: Updates every unclassified transaction whose `suggestionConfidence` is at or above the chosen threshold; transactions with no suggestion are skipped.
- **After submit**: View refreshes with remaining unclassified list (or empty).

## Edit classifications view contract

- **Input**: List of `TransactionWithClassification[]` where `classificationType` is set (classified). Filter and sort state.
- **Output**: User can change `classificationType`, `classificationCategory`, `classificationNotes` for any row and save; persistence updates the transaction. No user-defined rules are created.

## Heuristic service contract

- **Input**: `Transaction` (or TransactionWithClassification) from the ledger.
- **Output**: `ClassificationSuggestion | null`. First non-null suggestion from the pipeline (or highest-confidence among matches, per research). Pipeline order and resolution are implementation-defined and documented.
