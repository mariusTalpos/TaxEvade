# Contract: Classified Transactions View (Edit Classifications)

**Feature**: 003-classified-transactions-view  
**Consumers**: Edit-classifications container, edit-classifications-table component, ledger storage service  
**Extends**: 002-guided-transaction-classification “Edit classifications view contract”; this document adds 003-specific behavior.

## Input

- **Data**: List of `TransactionWithClassification[]` where `classificationType` is set (classified). Obtained via ledger storage `getClassified()`.
- **UI state**: Filter (by classification type, by category), sort (e.g. date, amount, type, category), pagination (page index, page size). Selection (selected row id) and optional draft (type, category, notes) for the selected row, **in-memory only** until Save.

## Output (user actions)

- **Save**: Persist the current draft (type, category, notes) for the selected transaction. If type is income or expense, category must be non-empty; otherwise show validation message and do not persist. After save, refresh list from `getClassified()`.
- **Clear classification**: User clears type (and category/notes). On Save, persist by setting `classificationType`, `classificationCategory`, `classificationNotes` to undefined (or remove). Transaction becomes unclassified; refresh list so it disappears from this view and will appear in 002’s classification view.
- **Navigate away or change selection without Save**: Discard in-memory draft; do not persist; do not prompt (FR-009).

## Validation

- Before persisting on Save: if `classificationType` is `income` or `expense`, `classificationCategory` must be non-empty (after trim). If not, show a clear validation message and do not call persistence.
- For transfer or ignore, category and notes are optional.
- For “clear classification,” no category required (all classification fields are cleared).

## Types (reuse from 002)

Same `ClassificationType`, `TransactionWithClassification` as in 002 contracts. Allowed categories from classification config (e.g. `classification-config.json`).
