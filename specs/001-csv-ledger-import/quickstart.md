# Quickstart: CSV Ledger Import and View

**Feature**: 001-csv-ledger-import  
**Branch**: `001-csv-ledger-import`

## Prerequisites

- Node.js 18+ and npm (or yarn/pnpm).
- Angular CLI 18+ (`npm i -g @angular/cli@18` or use npx).

## Run the App

From the repository root:

```bash
npm install
ng serve
```

Open http://localhost:4200. Navigate to the ledger feature (e.g. `/ledger` or the route configured for the ledger module).

## Run Tests

```bash
ng test
```

Or with coverage:

```bash
ng test --code-coverage
```

Target: 80%+ coverage on logic-heavy code (parser, storage, deduplication).

## Feature Location

- **Routes**: `src/app/features/ledger/ledger.routes.ts` (lazy-loaded).
- **Containers**: `src/app/features/ledger/containers/ledger-page/` (smart component: load ledger, trigger import).
- **Presentational**: `src/app/features/ledger/components/transaction-list/`, `transaction-filters/`, `import-file-picker/`, account-name input (with autocomplete/suggestions).
- **Core services**: `src/app/core/services/ledger-storage.service.ts`, `csv-parser.service.ts`.
- **Models**: `src/app/core/models/` (Transaction and related types).

## First-Time Import

1. Open the ledger page.
2. Use “Import CSV” (or equivalent) and select a Wells Fargo export CSV.
3. You will be prompted for an **account name** (e.g. "Checking", "Wells Fargo Checking"). Previously used account names are offered as suggestions (dropdown or autocomplete); pick one or type a new name. The app does not use a fixed default.
4. Confirm import; view “X added, Y duplicates skipped” and the updated list.
5. Use search and filters to narrow the list.

## Clear Ledger

- **Full wipe**: Use "Clear all" (or "Clear ledger") to remove every transaction. A confirmation dialog appears; confirm to proceed (cannot be undone).
- **Delete selected**: Check one or more transactions in the list, then use "Delete selected". A confirmation dialog shows how many will be removed; confirm to delete only those, or cancel to keep them.

## Design Artifacts

- **Spec**: [spec.md](../spec.md)
- **Plan**: [plan.md](../plan.md)
- **Research**: [research.md](../research.md)
- **Data model**: [data-model.md](../data-model.md)
- **Contracts**: [contracts/](../contracts/)
