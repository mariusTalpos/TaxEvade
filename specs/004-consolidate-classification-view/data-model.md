# Data Model: Consolidated Classification View

**Feature**: 004-consolidate-classification-view  
**Phase**: 1 (Design & Contracts)  
**Extends**: 002-guided-transaction-classification, 003-classified-transactions-view (Transaction with classification and suggestion); no new persistent entities.

## Entities

004 does **not** introduce new stored entities. It uses the same **Transaction (extended)** from 002 with classification and suggestion fields. The only behavioral change is **when** classification is set: in 002/003, classification was set only when the user submitted in the classification view or edited in the edit view; in 004, classification is **also** set at **import time** when auto-classification (rules + AI) produces a result. So a transaction may have classificationType/classificationCategory set immediately after CSV import, and the single view shows both those and any still-unclassified transactions.

### Transaction (from 002 – no change to schema)

See 002 data-model.md and contracts. Relevant for 004:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Unique id. |
| date | string | yes | ISO date. |
| description | string | yes | Transaction description. |
| amount | number | yes | Signed amount. |
| account | string | yes | Account label. |
| classificationType | 'income' \| 'expense' \| 'transfer' \| 'ignore' | no | Set = classified; absent = unclassified. **In 004, may be set at import by auto-classification.** |
| classificationCategory | string | no | Required when classificationType is income or expense. |
| classificationNotes | string | no | Optional notes. |
| suggestionType, suggestionCategory, suggestionConfidence, suggestionSourceId | (002) | no | When auto-classification ran at import, these mirror the applied classification and record source (e.g. "heuristics", "ollama") and confidence for display. |

**Validation (004)**:
- Same as 003: when saving with classificationType income or expense, classificationCategory must be non-empty; when clearing classification, all classification fields are cleared.
- When **applying** auto-classification at import: same validation (if type is income/expense, category must be non-empty from rule or AI result).

**Single view list**: Query **all** transactions (e.g. storage.getAll()) and filter in the app by classificationFilter: "all", "unclassified", or by type/category. No separate getUnclassified() vs getClassified() for the view—one list, filtered.

---

## Derived / UI State (not persisted)

- **Single classification view**: Filter (all | unclassified | by type | by category), sort (column, direction), pagination (page index, page size). Applied over the full transaction list (or a cached slice). Selection (selected row id), draft (type, category, notes) for the selected row, in-memory until Save. Discard draft on navigate or selection change (no prompt).
- **Bulk actions** (optional): e.g. "Accept all high confidence" over the current filtered list; implementation-defined.
- **Auto-classification at import**: No separate UI state; runs in the import path (ledger-page or AutoClassificationService) after addTransactions; persists classification and suggestion fields per transaction.

---

## Storage Schema (IndexedDB)

No new stores or indexes. Uses existing transaction store and indexes from 001/002 (including classificationType, classificationCategory).  
**Operations**: getAll() for the single view (then filter in-memory or via existing indexes); updateTransaction() for edit, save, clear, and for applying auto-classification after import.
