# Feature Specification: Classified Transactions View

**Feature Branch**: `003-classified-transactions-view`  
**Created**: 2026-03-04  
**Status**: Draft  
**Input**: User description: "Our app needs a view where classified transactions can be viewed and modified"

## Clarifications

### Session 2026-03-04

- Q: What exactly are "classified transactions" and where do they come from? → A: Classified transactions are transactions that have been given a type and (where applicable) category through the classification view from feature 002 (guided transaction classification).
- Q: What should happen when the user clears classification and category on a transaction? → A: The transaction is treated as unclassified: it is removed from this (003) view and then appears in the 002 classification view as unclassified.
- Q: Are multiple users or tabs editing the same data in scope? → A: No. This is a local app only; there are no multiple users editing the same tab, so concurrent-edit conflict resolution is out of scope.
- Q: When the user has unsaved edits and navigates away, what should the app do? → A: Discard. In-memory edits are dropped and the user is not prompted.
- Q: (Bug report) Type column shows "expense" for items submitted as "income"; editing to income saves as expense. Spec or code? → A: Code bug. The spec requires that classification type display and persist exactly as chosen (income, expense, transfer, ignore). The fix is in the implementation: the type (and category) control must reflect the current draft and persist the user’s selection exactly.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Classified Transactions in a List (Priority: P1)

The user opens the classified-transactions view and sees a list of all transactions that already have a classification (income, expense, transfer, or ignore). Each row shows the transaction details and its current classification: type, and for income/expense the category and optional notes. The user can scan the list to verify or find specific transactions. The list supports sorting and filtering so the user can narrow down by date, classification type, category, or other relevant criteria.

**Why this priority**: Core value; without viewing classified data the user cannot verify or correct it.

**Independent Test**: Load a ledger with at least some classified transactions, open the classified-transactions view, confirm all classified transactions appear with type and category/notes where applicable; apply sort and filter and verify results.

**Acceptance Scenarios**:

1. **Given** the ledger has one or more classified transactions, **When** the user opens the classified-transactions view, **Then** the app shows a list of all transactions that have a classification (type set), with type and for income/expense the category and optional notes visible.
2. **Given** the user is viewing the list, **When** the user applies a filter by classification type (e.g. expense) or by category, **Then** the list shows only transactions matching that type or category.
3. **Given** the user is viewing the list, **When** the user sorts by a column (e.g. date, amount, type), **Then** the list reorders according to that column in a consistent way (ascending/descending).
4. **Given** the ledger has no classified transactions, **When** the user opens the view, **Then** the app shows an empty state (e.g. empty list or clear message) and does not show an error.

---

### User Story 2 - Modify Classification for a Transaction (Priority: P1)

The user can change the classification of any transaction shown in the classified-transactions view. For a selected or focused transaction, the user can edit the classification type (income, expense, transfer, ignore) and, when type is income or expense, the category and optional notes. The user may also clear the classification entirely (remove type and category); in that case the transaction becomes unclassified, is removed from this view, and appears in the 002 classification view as unclassified. The user saves the change; the system persists the update and reflects it in the list (or removes the transaction from this list if classification was cleared). Changes do not create or modify any rules; only the transaction’s stored classification is updated.

**Why this priority**: Essential for correcting mistakes and keeping classifications accurate.

**Independent Test**: Open the view, change type and/or category and notes for one or more transactions, save, and confirm the list and persisted data show the updated values; confirm no new rules are created.

**Acceptance Scenarios**:

1. **Given** the user is viewing a classified transaction, **When** the user changes the classification type (e.g. from expense to transfer), **Then** the user can save and the system persists the new type; the list updates to show the new value.
2. **Given** the user sets type to income or expense, **When** the user saves, **Then** the system requires a category (non-empty) and allows optional notes; validation prevents saving without a category when type is income or expense.
3. **Given** the user sets type to transfer or ignore, **When** the user saves, **Then** the system persists without requiring a category or notes.
4. **Given** the user has edited and saved one or more transactions, **When** the user inspects the app or reopens the view, **Then** the updated classifications are still present; no user-defined rules were created from the edits.
5. **Given** the user clears the classification (and category) for a transaction and saves, **When** the save completes, **Then** the transaction is stored as unclassified, is removed from this (003) view, and appears in the 002 classification view as an unclassified transaction.

---

### User Story 3 - Find and Navigate Classified Transactions (Priority: P2)

The user can quickly find specific transactions in the classified-transactions view using filters and sort. The view supports filtering by at least classification type and category (and optionally by date range or other criteria). The user can sort by date, amount, type, category, or other columns so that bulk corrections or reviews are manageable. If the list is large, the view supports pagination or virtual scrolling so that the app remains responsive.

**Why this priority**: Makes the view usable at scale and supports efficient review and correction.

**Independent Test**: With a ledger containing many classified transactions, apply filters and sort, change page or scroll, and verify the correct subset of data is shown and performance remains acceptable.

**Acceptance Scenarios**:

1. **Given** the list has many rows, **When** the user filters by type and/or category, **Then** the list shows only matching transactions and the count or empty state reflects the filtered result.
2. **Given** the user has applied sort, **When** the user changes page or scrolls (if paginated/virtual), **Then** the sort order is preserved and the correct data is shown.
3. **Given** a large set of classified transactions, **When** the user opens the view and applies filters, **Then** the list loads and updates within a reasonable time (e.g. under 2 seconds for typical dataset sizes).

---

### Edge Cases

- What happens when the user clears the category for an income/expense transaction and tries to save (without clearing type)? The system prevents saving and shows a clear validation message (e.g. category required for income/expense).
- What happens when the user clears the classification entirely (removes type and category)? The transaction becomes unclassified; the system persists this, removes the transaction from this view, and it subsequently appears in the 002 classification view as unclassified.
- What happens when the user edits a transaction but navigates away without saving? The system discards in-memory edits and does not prompt; the user must save explicitly to persist changes.
- What happens when there are no classified transactions? The view shows an empty state with a clear message; the user can navigate to other parts of the app (e.g. classification flow or ledger).
- Concurrent edits: Not in scope. This is a local app only; no multiple users or tabs editing the same data, so no conflict resolution is required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a dedicated view that lists only transactions that have a classification (classification type is set). The list MUST show for each transaction at least: identification (e.g. date, description, amount), classification type, and for income/expense the category and optional notes.
- **FR-002**: The system MUST allow the user to change the classification type, and when type is income or expense the category and optional notes, for any transaction in this view, and MUST allow the user to clear the classification entirely (so the transaction becomes unclassified). When the user saves, the system MUST persist the change. When the user clears classification and saves, the transaction MUST be stored as unclassified, MUST be removed from this view, and MUST appear in the 002 classification view as unclassified. Saving MUST NOT create or update any user-defined rules.
- **FR-003**: For transactions classified as income or expense, the system MUST require a non-empty category before saving; for transfer or ignore, the system MUST NOT require category or notes.
- **FR-004**: The system MUST support filtering the list by classification type and by category so the user can narrow the set of transactions shown.
- **FR-005**: The system MUST support sorting the list by at least one of: date, amount, classification type, category, so the user can order transactions in a consistent way.
- **FR-006**: When the list is large, the system MUST support pagination or virtual scrolling (or equivalent) so the view remains usable and responsive; the exact mechanism is implementation-defined.
- **FR-007**: When there are no classified transactions, the view MUST show an empty state (clear message or empty list) and MUST NOT show a generic error.
- **FR-008**: The system MUST validate that category is present when classification type is income or expense before persisting, and MUST present a clear validation message if the user attempts to save without it.
- **FR-009**: When the user navigates away from the view or to another transaction without saving, the system MUST discard in-memory edits and MUST NOT prompt to save; only explicit save persists changes.

### Key Entities

- **Classified transaction**: A ledger transaction that has been given a classification type (and where applicable category) through the classification view from feature 002 (guided transaction classification). It has a classification type (income, expense, transfer, or ignore); for income/expense it has a category and optionally notes. This aligns with the extended transaction model from the guided transaction classification spec.
- **Classification type**: One of income, expense, transfer, ignore.
- **Category**: A label required for income and expense classifications; optional for transfer and ignore. The set of allowed categories is defined by the app (e.g. from configuration) and is the same as used in the classification flow.

## Assumptions

- The ledger and transaction model already support classification fields (type, category, notes) as defined by the guided transaction classification feature; this view consumes and updates that same data.
- The app is local only; there are no multiple users or tabs editing the same data, so concurrent-edit conflict resolution is out of scope.
- Allowed categories are defined elsewhere (e.g. config file); this view does not define new categories, only allows selecting or editing within the existing set.
- "Modified" means editing the stored classification (type, category, notes) for existing classified transactions; it does not include creating new rules or re-running suggestions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the classified-transactions view and see all classified transactions with type and category/notes visible, and can filter by type and category and sort by date, amount, type, or category with correct results.
- **SC-002**: Users can edit the classification (type, category, notes) of any transaction in the view and save, or clear the classification and save; edits persist (or the transaction becomes unclassified and moves to the 002 view); no user-defined rules are created from edits.
- **SC-003**: Validation prevents saving income/expense without a category and shows a clear message; transfer and ignore can be saved without category or notes.
- **SC-004**: With a typical dataset size (e.g. hundreds of classified transactions), the view loads and responds to filter/sort within a reasonable time (e.g. under 2 seconds) so users can work without noticeable delay.
- **SC-005**: When there are no classified transactions, the view shows an empty state that is clear and does not suggest an error.
