# Quickstart: Classified Transactions View

**Feature**: 003-classified-transactions-view  
**Branch**: `003-classified-transactions-view`

## Prerequisites

- 001 (CSV ledger import) and 002 (guided transaction classification) implemented: ledger with IndexedDB, transactions with classification fields, classification view (unclassified flow), and `getClassified()` on ledger storage.
- At least some **classified** transactions in the ledger (classify a few in 002’s classification view first).

## Run the App

From the repository root:

```bash
npm install
ng serve
```

Open http://localhost:4200. Navigate to the **classification** feature, then to the **edit classifications** (classified transactions) view (e.g. `/classification/edit` or link “Edit classifications” / “Classified transactions” from the classification page).

## Using the Classified Transactions View

1. **View**: The list shows only transactions that have a classification (type set). Each row shows date, description, amount, classification type, and for income/expense the category and optional notes.
2. **Filter**: Filter by classification type (e.g. expense) or by category to narrow the list.
3. **Sort**: Sort by date, amount, type, or category (ascending/descending).
4. **Edit**: Select a row, change type, category, or notes, then click **Save**. For income/expense, category is required; if you leave it empty, a validation message appears and Save does not persist.
5. **Clear classification**: Clear the type (and category) for a transaction and Save. The transaction becomes unclassified: it disappears from this list and appears in the **classification** view (002) as an unclassified transaction.
6. **Navigate away**: If you edit without saving and navigate to another view or another row, your edits are **discarded** (no “Unsaved changes?” prompt).

## Run Tests

```bash
ng test
```

Or with coverage:

```bash
ng test --code-coverage
```

Target: 80%+ coverage on edit-classifications container and table (filter, sort, save, clear, validation, discard on navigate).

## Feature Location

- **Routes**: `src/app/features/classification/classification.routes.ts` — ensure a route to the edit-classifications (classified transactions) view.
- **Containers**: `src/app/features/classification/containers/edit-classifications-page/` — loads classified list, filter/sort/pagination, selection, draft state, save and clear actions, discard on navigate.
- **Components**: `src/app/features/classification/components/edit-classifications-table/` — table of classified transactions, inline edit controls, Save and Clear buttons.
- **Core services**: `src/app/core/services/ledger-storage.service.ts` — `getClassified()`, update transaction (including clear classification).

## Design Artifacts

- **Spec**: [spec.md](../spec.md)
- **Plan**: [plan.md](../plan.md)
- **Research**: [research.md](../research.md)
- **Data model**: [data-model.md](../data-model.md)
- **Contracts**: [contracts/](../contracts/)
