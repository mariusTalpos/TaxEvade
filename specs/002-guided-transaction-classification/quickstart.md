# Quickstart: Guided Transaction Classification

**Feature**: 002-guided-transaction-classification  
**Branch**: `002-guided-transaction-classification`

## Prerequisites

- Same as 001: Node.js 18+, Angular CLI 18+, ledger (001) implemented with IndexedDB and import flow.
- Ledger has transactions (import at least one CSV so some unclassified transactions exist).

## Run the App

From the repository root:

```bash
npm install
ng serve
```

Open http://localhost:4200. Navigate to the **classification** feature (e.g. `/classification`) and optionally the **edit classifications** view (e.g. `/classification/edit` or a tab/link from the classification page).

## Run Tests

```bash
ng test
```

Or with coverage:

```bash
ng test --code-coverage
```

Target: 80%+ coverage on classification heuristics service and classification containers/components.

## Feature Location

- **Routes**: `src/app/features/classification/classification.routes.ts` (lazy-loaded).
- **Containers**: `src/app/features/classification/containers/classification-page/` (paginated unclassified, Submit / Submit All / Submit by confidence), `edit-classifications-page/` (table of classified, filter/sort, edit).
- **Components**: `classification-table/` (paginated table, sort, filter, inline edit, Submit actions), `edit-classifications-table/`, suggestion badges (confidence + source).
- **Core services**: `src/app/core/services/classification-heuristics.service.ts` (run heuristics; called after import). Extend `ledger-storage.service.ts` for classification fields and unclassified/classified queries.
- **Models**: `src/app/core/models/` — extend Transaction with classification and suggestion types; add Confidence, ClassificationSuggestion (see contracts).

## Classification View (Unclassified)

1. Open the classification page. You see a **paginated** list of all **unclassified** transactions (no classificationType set).
2. Each row shows transaction details and a **pre-populated suggestion** (type, category if income/expense, confidence) when the system produced one at import. You can edit any suggestion before submitting.
3. **Submit**: Select one row (click to select). Click "Submit" to classify **only that transaction** with its current suggestion (or your edit). Selection is required; otherwise Submit is disabled or no-op.
4. **Submit All**: Classify all unclassified transactions that have a suggestion (or your edits) across all pages. Transactions with no suggestion stay unclassified.
5. **Submit by confidence**: Use "High only", "Medium or higher", or "Low or higher" to classify only those unclassified transactions whose suggestion confidence is at or above the chosen level. No-suggestion rows are skipped.
6. After any submit, the list **repopulates** with remaining unclassified transactions or shows empty.

## Edit Classifications View

1. Open the separate **edit classifications** table (link or route from the app).
2. The table shows **classified** transactions with filter and sort. Change type, category, or notes for any row and save. Changes persist; no user-defined rules are created.

## When Suggestions Are Generated

Suggestions are produced **only when new transactions are added** (e.g. during CSV import). The heuristics run in the component or service that performs import (e.g. ledger-page container or the service that calls addTransactions after CSV parse). After import, each new transaction is run through the built-in heuristics and suggestion fields are stored. There is no "Refresh suggestions" button in this phase.

## Design Artifacts

- **Spec**: [spec.md](../spec.md)
- **Plan**: [plan.md](../plan.md)
- **Research**: [research.md](../research.md)
- **Data model**: [data-model.md](../data-model.md)
- **Contracts**: [contracts/](../contracts/)
