# Data Model: CSV Ledger Import and View

**Feature**: 001-csv-ledger-import  
**Phase**: 1 (Design & Contracts)

## Entities

### Transaction

A single normalized bank transaction stored in the ledger.

| Field       | Type     | Required | Description |
|------------|----------|----------|-------------|
| id         | string   | yes      | Stable unique id (e.g., UUID or hash of identity fields); used for storage and deduplication lookup. |
| date       | string   | yes      | ISO date (YYYY-MM-DD) of the transaction. |
| description| string   | yes      | Transaction description/memo from the bank. |
| amount     | number   | yes      | Signed amount: positive = inflow, negative = outflow. |
| account    | string   | yes      | Account label (set at import time; e.g., "Wells Fargo Checking"). |
| importedAt | string   | optional | ISO datetime when the row was imported (for auditing). |

**Validation**:
- `date` must be a valid date string (YYYY-MM-DD).
- `amount` must be a finite number.
- `description` and `account` must be non-empty after trim (or defaulted).

**Identity (for deduplication)**: Uniqueness is determined by the tuple `(date, amount, description, account)`. The same tuple must not appear twice in the ledger.

---

### Ledger

The user’s single collection of all transactions. Not a separate stored entity: it is the **set of all Transaction records** in local storage (IndexedDB). No separate “Ledger” table; “ledger” is the aggregate of transactions.

**Operations**:
- Append: add new transactions (after deduplication).
- Read: query/filter by date range, account, inflow/outflow, and full-text search on description/amount for display.
- Delete: remove transactions—either all (full wipe) or a selected subset (checkbox-selected). Persisted ledger must reflect removals immediately.

---

### Account

In this phase, **Account** is a string label only (e.g., "Wells Fargo Checking"). It has no separate table or entity; it is an attribute of each Transaction. Distinct values come from user input at import time and from past imports. Used for:
- Storing on each Transaction.
- Filtering the transaction list (filter by account).
- Display in the list.

No hierarchy or linking; no account balance or metadata in Phase 1.

---

## Derived / UI State (not persisted as entities)

- **Search query**: User-entered text for filtering by description or amount (ephemeral).
- **Active filters**: Date range, account(s), inflow vs outflow (ephemeral; can be persisted as user preference later if needed).
- **Import result**: Counts of added and skipped (duplicates); shown after each import, not stored.

---

## Storage Schema (IndexedDB)

- **Store name**: e.g. `transactions`.
- **Primary key**: `id` (Transaction.id).
- **Indexes**:
  - `date` (for date-range filters and ordering).
  - `account` (for account filter).
  - Composite or multi-entry index as needed for deduplication checks: e.g. index on `[date, amount, description, account]` or application-side check using date + account index and then filter by amount + description.

No separate stores for Ledger or Account; one store for transactions suffices.
