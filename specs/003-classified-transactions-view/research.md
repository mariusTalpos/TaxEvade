# Research: Classified Transactions View

**Feature**: 003-classified-transactions-view  
**Phase**: 0 (Outline & Research)

## 1. Relationship to 002 Edit Classifications View

**Decision**: Implement 003 as the **same** “edit classifications” view already scoped in 002 (edit-classifications-page, edit-classifications-table). 003’s spec fully defines that view: list only classified transactions, filter/sort/pagination, edit and save, **clear classification** (transaction becomes unclassified and leaves this list), category validation for income/expense, and **discard on navigate** (no unsaved-edit prompt). No separate “003 feature” route; the edit-classifications route under the classification feature satisfies 003.

**Rationale**: 002’s spec and plan already call for “a separate table view for editing existing classifications.” 003 adds the detailed requirements (clear → unclassified, validation, discard behavior). One view avoids duplicate UI and keeps navigation simple (e.g. “Classification” → “Edit classifications” or “Classified transactions”).

**Alternatives considered**:
- New route `/classified-transactions`: Possible but redundant; same data and behavior as edit-classifications.
- Separate feature folder for 003: Rejected; 003 is the full spec for the edit-classifications view, not a different product surface.

---

## 2. Persisting “Clear Classification” (Transaction Becomes Unclassified)

**Decision**: “Clear classification” is implemented by **clearing** the classification fields on the transaction: set `classificationType`, `classificationCategory`, and `classificationNotes` to `undefined` (or remove keys). Persist the updated transaction via the existing ledger storage `updateTransaction()` (or equivalent). After persistence, the transaction no longer has `classificationType` set, so it is returned by `getUnclassified()` and no longer by `getClassified()`. The 003 view refreshes its list (e.g. from `getClassified()`) so the cleared transaction disappears from the list and will appear in 002’s classification view when the user navigates there.

**Rationale**: Spec: “When the user clears classification and saves, the transaction MUST be stored as unclassified, MUST be removed from this view, and MUST appear in the 002 classification view as unclassified.” Unclassified is defined in 002 as `classificationType` absent; clearing those fields is the single source of truth.

**Alternatives considered**:
- Separate “unclassified” flag: Redundant; absence of classificationType already defines unclassified in 002.
- Soft delete / status field: Unnecessary; clearing fields is sufficient and matches 002 data model.

---

## 3. List UX: Pagination vs Virtual Scrolling for Classified List

**Decision**: Use **client-side pagination** (e.g. Angular Material `MatPaginator`) with a configurable page size (e.g. 25–50), same pattern as 002’s classification view. Optionally support **virtual scrolling** (CDK `ScrollingModule`) for very large lists; the spec allows “pagination or virtual scrolling (or equivalent).” Implement pagination first; add virtual scrolling in the same view if needed for performance with thousands of rows.

**Rationale**: 002 already uses client-side pagination for the unclassified list; consistency and reuse of patterns. Spec: “When the list is large, the system MUST support pagination or virtual scrolling.” Pagination is sufficient for “hundreds” (SC-004); virtual scroll can be added later if needed.

**Alternatives considered**:
- Virtual scroll only: Spec explicitly allows pagination; pagination is simpler and matches 002.
- Server-side pagination: N/A; no server; IndexedDB only.

---

## 4. Discard on Navigate (No Unsaved-Edit Prompt)

**Decision**: Do **not** show a prompt when the user navigates away (or switches to another row) with unsaved edits. The container holds edit state (e.g. current row being edited, draft type/category/notes) in signals or local state. On **route leave** (e.g. `ngOnDestroy`, or when navigating to another route), do not persist; simply destroy the component so in-memory edits are discarded. When the user **switches selection** to another row without saving, discard the previous row’s in-memory edits (overwrite draft with the newly selected row’s data or clear draft). No “Unsaved changes?” dialog; behavior is documented in spec (FR-009).

**Rationale**: Spec: “When the user navigates away from the view or to another transaction without saving, the system MUST discard in-memory edits and MUST NOT prompt to save.” User chose Option A (Discard) in clarification.

**Implementation note**: Edit state lives in the container (e.g. `editingTransactionId`, `draftType`, `draftCategory`, `draftNotes`). Save button persists draft to storage and refreshes list. Navigation or row change drops draft without writing. No `CanDeactivate` guard that prompts.

---

## 5. Category Validation and Clear Validation Message

**Decision**: Before calling persistence on save, **validate** that when `classificationType` is `income` or `expense`, `classificationCategory` is non-empty (after trim). If invalid, do not persist; show a **clear validation message** in the UI (e.g. inline under the category field or a small banner: “Category is required for income and expense”). Use the same allowed-category list as 002 (from classification config); user can select from dropdown or type from that list. For “clear classification,” no category is needed (type and category are both cleared).

**Rationale**: Spec FR-008: “The system MUST validate that category is present when classification type is income or expense before persisting, and MUST present a clear validation message if the user attempts to save without it.”

**Alternatives considered**:
- Disable Save when category empty: Good UX addition; still show message so user knows why.
- Server-side validation: N/A; local app, validation in frontend only.
