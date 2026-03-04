# Data Model: Classified Transactions View

**Feature**: 003-classified-transactions-view  
**Phase**: 1 (Design & Contracts)  
**Extends**: 002-guided-transaction-classification (Transaction with classification); no new persistent entities.

## Entities

003 does **not** introduce new stored entities. It uses the same **Transaction (extended)** from 002 with classification fields. A **classified transaction** is a transaction where `classificationType` is set (income, expense, transfer, or ignore); for income/expense, `classificationCategory` is required and `classificationNotes` is optional.

### Transaction (from 002 – no change)

See 002 data-model.md and contracts. Relevant for 003:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Unique id. |
| date | string | yes | ISO date. |
| description | string | yes | Transaction description. |
| amount | number | yes | Signed amount. |
| account | string | yes | Account label. |
| classificationType | 'income' \| 'expense' \| 'transfer' \| 'ignore' | no | Set = classified; absent = unclassified. |
| classificationCategory | string | no | Required when classificationType is income or expense. |
| classificationNotes | string | no | Optional notes. |

**Validation (003)**:
- When saving with `classificationType` income or expense: `classificationCategory` must be non-empty (after trim).
- When saving with `classificationType` transfer or ignore: category and notes optional.
- When **clearing** classification: set `classificationType`, `classificationCategory`, `classificationNotes` to undefined (or remove). No category required.

**Classified list**: Query transactions where `classificationType` is present (002: `getClassified()`).  
**After clear**: Transaction no longer has classificationType; it appears in `getUnclassified()` and not in `getClassified()`.

---

## Derived / UI State (not persisted)

- **Classified transactions view**: Filter (by classification type, by category), sort (column, direction), pagination (page index, page size). Applied over the list returned from `getClassified()`.
- **Selection**: Which row is selected (e.g. `selectedTransactionId: string | null`).
- **Draft (in-memory only)**: For the selected row, draft type, category, notes before Save. Discarded on navigate or row change (FR-009); not persisted until user clicks Save.
- **Validation error**: When user attempts Save with income/expense and empty category, show message; do not persist.

---

## Storage Schema (IndexedDB)

No new stores or indexes. Uses existing transaction store and indexes from 001/002 (including `classificationType`, `classificationCategory` for filtering).  
**Operations**: Read classified list (`getClassified()`), update single transaction (edit or clear classification) via existing ledger storage update API.
