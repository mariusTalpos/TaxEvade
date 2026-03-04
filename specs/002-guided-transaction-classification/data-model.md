# Data Model: Guided Transaction Classification

**Feature**: 002-guided-transaction-classification  
**Phase**: 1 (Design & Contracts)  
**Extends**: 001-csv-ledger-import (Transaction, Ledger, IndexedDB store)

## Entities

### Transaction (extended)

Extends the Transaction entity from 001 with classification and suggestion fields. All 001 fields remain (id, date, description, amount, account, importedAt).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| classificationType | 'income' \| 'expense' \| 'transfer' \| 'ignore' | no | Set when the transaction is classified; absent = unclassified. |
| classificationCategory | string | no | Category for income/expense; required when type is income or expense. |
| classificationNotes | string | no | Optional notes. |
| suggestionType | 'income' \| 'expense' \| 'transfer' \| 'ignore' | no | Suggested type from built-in heuristics (when available). |
| suggestionCategory | string | no | Suggested category for income/expense. |
| suggestionConfidence | 'High' \| 'Medium' \| 'Low' | no | Ordinal confidence of the suggestion. |
| suggestionSourceId | string | no | Identifier of the heuristic/rule that produced the suggestion (e.g. "transfer-detection", "merchant:NETFLIX"). |

**Validation**:
- When classificationType is income or expense, classificationCategory must be non-empty.
- When classificationType is transfer or ignore, classificationCategory and classificationNotes are optional.
- suggestionConfidence, when present, must be one of High, Medium, Low.
- All 001 validations (date, amount, description, account) still apply.

**Unclassified**: A transaction is **unclassified** when `classificationType` is absent (undefined/null). The classification view lists transactions where classificationType is not set; suggestions (suggestionType, suggestionCategory, suggestionConfidence, suggestionSourceId) are shown when present.

---

### Classification Suggestion (ephemeral / output type)

Output of the heuristic pipeline for a single transaction. Not stored as a separate entity; it is persisted as the suggestion* fields on Transaction when generated at import.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | 'income' \| 'expense' \| 'transfer' \| 'ignore' | yes | Suggested classification type. |
| category | string | no | Required when type is income or expense. |
| confidence | 'High' \| 'Medium' \| 'Low' | yes | Ordinal confidence. |
| sourceId | string | yes | Identifier of the heuristic that produced this suggestion. |

---

### Built-in rule / heuristic (developer-maintained)

Not a stored entity. Implemented in code (e.g. ClassificationHeuristicsService). Types of heuristics: merchant matching, description matching, regex patterns, transfer-detection, recurrence. Each returns a Suggestion or null. Pipeline order and resolution (first match or highest confidence) are defined in code and documented in research.md.

---

### Category

Category is a string label. No separate table. The **fixed list of allowed categories** is defined in a classification config file (e.g. `src/assets/config/classification-config.json`) so it can be manually updated; heuristics may suggest categories from that list. Users select or confirm from suggestions or this list. Validation: non-empty when classification type is income or expense.

---

## Derived / UI State (not persisted)

- **Classification view**: Pagination (page index, page size), sort (column, direction), filter (e.g. by confidence, search text). Applied over the in-memory list of unclassified transactions with suggestions.
- **Edit classifications view**: Filter and sort over classified transactions; selection for editing.
- **Selected transaction id**: Which row is "currently displayed" for Submit (single selection).

---

## Storage Schema (IndexedDB)

**Store**: Same as 001 — e.g. `transactions`. Primary key remains `id`.

**New indexes** (add to existing store):
- **classificationType**: For filtering ledger by type (income/expense/transfer/ignore) and for "unclassified" query (transactions where classificationType is not set). Index on `classificationType` (sparse or include only when present; or query where classificationType === undefined).
- **classificationCategory**: For filter by category in ledger and edit view.

**Query patterns**:
- Unclassified list: Get all transactions where `classificationType` is absent (or not in ['income','expense','transfer','ignore']). Application-side filter if IndexedDB does not support "missing key" queries; alternatively store a boolean `isClassified` and index on that.
- Classified list (edit view): Get all where classificationType is present.
- Ledger list: Existing 001 queries; optionally filter by classificationType and classificationCategory.

**Recommendation**: Add index on `classificationType` so that "unclassified" can be implemented as a range or key query (e.g. getAll where index does not exist, or use a compound with a sentinel). If the DB layer does not support sparse indexes, maintain an "unclassified" query by loading and filtering in the service, or add an explicit `isClassified: boolean` field and index on that.
