# Feature Specification: CSV Ledger Import and View

**Feature Branch**: `001-csv-ledger-import`  
**Created**: 2025-03-04  
**Status**: Draft  
**Input**: User description: "Build a single-user app that imports bank transaction CSV files (starting with Wells Fargo exports) and turns them into a clean local ledger. The user can select a CSV file, the app parses and normalizes transactions into a standard format (date, description, amount, inflow/outflow, account). The app deduplicates transactions on re-import and shows a searchable, filterable list. This phase is only about import + viewing transactions; no tax calculations yet."

## Clarifications

### Session 2026-03-04

- Q: What important capabilities are missing from the current implementation? → A: (1) The ability to clear the ledger—both a full wipe and checkbox-select delete. (2) The ability to declare the account name—the app must ask for user input at import time instead of populating a fixed value (e.g. "Wells Fargo").
- Q: Should the app require explicit confirmation before destructive actions (full wipe and/or delete selected)? → A: Require confirmation for both full wipe and delete selected.
- Q: Should we help users avoid typos when entering account names? → A: Yes; keep a list of account names used and prepopulate the input with old inputs to prevent typos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import CSV into Ledger (Priority: P1)

The user selects a bank transaction CSV file (Wells Fargo format initially). The app prompts the user for an account name (e.g. "Wells Fargo Checking" or "Checking") and does not use a fixed default. The app keeps a list of previously used account names and prepopulates or suggests them when prompting (e.g. dropdown or autocomplete) so the user can pick an existing name or type a new one, reducing typos. The app parses the file, normalizes each row into a standard transaction format (date, description, amount, inflow/outflow, account), assigns the user-provided account name to all transactions from that import, and adds the transactions to a single local ledger. The user sees confirmation that the import completed and how many transactions were added.

**Why this priority**: Import is the foundation; without it there is no ledger to view or search.

**Independent Test**: Can be fully tested by selecting a valid Wells Fargo CSV, triggering import, and verifying that the expected number of transactions appear in the ledger with correct normalized fields.

**Acceptance Scenarios**:

1. **Given** the app is open with an empty ledger, **When** the user is prompted for an account name, provides it, selects a valid Wells Fargo CSV file, and confirms import, **Then** all transactions from the file appear in the ledger with normalized date, description, amount, inflow/outflow, and the user-provided account name.
2. **Given** the app has an existing ledger, **When** the user imports another CSV file (and provides an account name when prompted), **Then** the new transactions are appended to the ledger with that account name and the user is informed how many were added.
3. **Given** the ledger has transactions with one or more account names, **When** the user starts an import and is prompted for an account name, **Then** the app offers previously used account names (e.g. as suggestions or in a dropdown) so the user can select one or type a new name.
4. **Given** the user has chosen a file, **When** the file is in an unsupported or invalid format, **Then** the user sees a clear error message and no partial or incorrect data is added to the ledger.

---

### User Story 2 - View Searchable, Filterable Transaction List (Priority: P2)

The user can view the full list of transactions in the ledger. The list supports search (e.g., by description or amount) and filters (e.g., by date range, account, inflow vs outflow) so the user can quickly find specific transactions.

**Why this priority**: Viewing and finding transactions is the primary use after import; search and filters make the ledger usable at scale.

**Independent Test**: Can be tested by loading a ledger with multiple transactions and verifying that search and filters correctly narrow the visible list and that results update as criteria change.

**Acceptance Scenarios**:

1. **Given** the ledger has transactions, **When** the user opens or navigates to the transaction list, **Then** all transactions are shown in a clear list with date, description, amount, inflow/outflow, and account visible.
2. **Given** the user is viewing the list, **When** they enter search text (e.g., description or amount), **Then** only transactions matching the search are shown.
3. **Given** the user is viewing the list, **When** they apply filters (e.g., date range, account, inflow/outflow), **Then** only transactions matching all active filters are shown.
4. **Given** search or filters are active, **When** the user clears search or filters, **Then** the full list is shown again.

---

### User Story 3 - Clear Ledger (Priority: P3)

The user can remove transactions from the ledger in two ways: (1) **Full wipe**—clear all transactions in the ledger at once. (2) **Checkbox select**—select one or more transactions via checkboxes and delete only the selected transactions. The system MUST require explicit user confirmation before performing either action (e.g. “Clear all transactions? This cannot be undone.” / “Delete N selected transaction(s)?”). After the user confirms and the action completes, the list updates immediately and the removed transactions are no longer in the ledger.

**Why this priority**: Allows users to correct mistakes, remove test data, or start over without re-installing the app.

**Independent Test**: Can be tested by importing transactions, then performing a full wipe and verifying the ledger is empty; and by importing again, selecting a subset via checkboxes, deleting selected, and verifying only those are removed.

**Acceptance Scenarios**:

1. **Given** the ledger has transactions, **When** the user triggers a full wipe (clear all) and confirms in the confirmation dialog, **Then** all transactions are removed and the ledger is empty; the list view reflects this.
2. **Given** the ledger has transactions, **When** the user selects one or more transactions via checkboxes, triggers delete selected, and confirms in the confirmation dialog, **Then** only the selected transactions are removed; all others remain.
3. **Given** the user has selected transactions for deletion (or triggered full wipe), **When** the action completes, **Then** the UI updates immediately and no removed transaction appears in the list or in persisted storage.

---

### User Story 4 - Deduplicate on Re-import (Priority: P4)

When the user imports a CSV file that contains transactions already present in the ledger (e.g., re-importing the same file or a file with overlapping data), the app detects duplicates and does not add them again. The user is informed how many transactions were new vs skipped as duplicates.

**Why this priority**: Prevents a bloated ledger and gives the user confidence to re-import or combine multiple exports.

**Independent Test**: Can be tested by importing the same CSV twice and verifying that the second import adds zero new transactions and the user is told that duplicates were skipped.

**Acceptance Scenarios**:

1. **Given** the ledger already contains transactions from a prior import, **When** the user imports the same CSV again, **Then** no duplicate transactions are added and the user is informed that existing transactions were skipped.
2. **Given** the user imports a CSV that partially overlaps with existing ledger data, **When** the import completes, **Then** only new transactions are added; duplicates are skipped and the user sees a summary (e.g., X added, Y duplicates skipped).

---

### Edge Cases

- What happens when the selected file is empty? The app should report that no transactions were found and not add any entries.
- What happens when the CSV has malformed rows (e.g., missing required columns or invalid dates)? The app should either skip invalid rows with a clear summary (e.g., "X rows imported, Y rows skipped due to errors") or reject the file with an actionable error, depending on severity.
- What happens when the user selects a non-CSV file or a CSV from a bank other than Wells Fargo? The app should detect unsupported format and show a clear message (e.g., only Wells Fargo format is supported in this phase).
- How does the system handle very large files (e.g., thousands of rows)? The app should complete the import without hanging and the list view should remain usable. The list MUST support pagination with a user-selectable number of rows per page (e.g., 25, 50, 100) so the user can control how many transactions are shown at once.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow the user to select a CSV file from their device for import.
- **FR-002**: The system MUST parse Wells Fargo export CSV format and map fields to a standard transaction format (date, description, amount, inflow/outflow, account).
- **FR-003**: The system MUST normalize and store each transaction with at least: date, description, amount, inflow/outflow indicator, and account identifier.
- **FR-004**: The system MUST persist the ledger locally so that imported transactions remain available across sessions.
- **FR-005**: The system MUST deduplicate transactions on import by identifying already-present transactions (e.g., same date, amount, description, account) and not inserting duplicates.
- **FR-006**: The system MUST inform the user after each import how many transactions were added and how many were skipped as duplicates (if any).
- **FR-007**: The system MUST display the ledger as a list of transactions showing date, description, amount, inflow/outflow, and account.
- **FR-008**: The system MUST provide search over the transaction list (e.g., by description and/or amount) so the user can narrow the visible set.
- **FR-009**: The system MUST provide filters (e.g., by date range, account, inflow vs outflow) so the user can narrow the visible set.
- **FR-010**: The system MUST provide pagination for the transaction list with a user-selectable number of rows per page (e.g., 25, 50, 100) so the list remains usable for large ledgers.
- **FR-011**: The system MUST show clear, user-friendly error messages when the selected file is invalid, unsupported, or unreadable.
- **FR-012**: The system MUST prompt the user for an account name at import time and MUST use that value for all transactions from that import; the system MUST NOT default to a fixed label (e.g. "Wells Fargo") without user input.
- **FR-017**: The system MUST keep a list of account names that have been used (e.g. derived from distinct account values in the ledger) and MUST prepopulate or suggest these when prompting for account name at import (e.g. dropdown, datalist, or autocomplete) so the user can select a previous name or enter a new one, to reduce typos.
- **FR-013**: The system MUST allow the user to clear the entire ledger (full wipe) so that all transactions are permanently removed.
- **FR-014**: The system MUST allow the user to select one or more transactions via checkboxes and delete only the selected transactions, leaving the rest of the ledger intact.
- **FR-015**: The system MUST require explicit user confirmation before executing a full wipe or before deleting selected transactions (e.g. a dialog that the user must accept or cancel). The confirmation dialog (or equivalent UI component) MUST have a dedicated spec file with smoke and key behavior tests per project standards.
- **FR-016**: The system MUST not perform any tax calculations or tax-specific logic in this phase; scope is limited to import, viewing, and clearing/deleting transactions.

### Key Entities

- **Transaction**: A single bank transaction. Key attributes: date, description, amount, direction (inflow/outflow), and account. Represents one row of normalized data from an import.
- **Ledger**: The user’s single local collection of all imported transactions. Persisted across sessions; grows by appending new transactions from imports (after deduplication).
- **Account**: The source account for a transaction. The CSV does not contain account information; the account name MUST be supplied by the user when importing (e.g., a label such as "Checking" or "Wells Fargo Checking"). The app must prompt for this value and must not substitute a fixed default. The app keeps a list of previously used account names (e.g. derived from existing transactions) and offers them when prompting so the user can pick or type; this reduces typos. Used for display and filtering; no multi-account hierarchy or linking required in this phase.

## Assumptions

- Wells Fargo CSV export format is used as the only supported format in this phase; column names and layout are assumed from typical Wells Fargo export structure.
- Deduplication is based on a combination of date, amount, description, and account (or equivalent identity) so that the same transaction from the same file or a re-export is not stored twice.
- The app is single-user and local-only; no cloud sync, multi-device, or authentication.
- Search, filter, and pagination (with user-selectable rows per page) are required for list usability; the list remains usable for typical and larger export sizes.
- Invalid or malformed rows can be skipped with a summary to the user, unless the whole file is deemed unsupported.
- The list of account names offered when prompting at import can be derived from distinct account values already stored in the ledger (no separate persisted list required unless the implementation prefers one).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can import a Wells Fargo CSV and see all transactions in the ledger with correct date, description, amount, inflow/outflow, and account within one minute for files up to 1,000 rows.
- **SC-002**: A user can find a specific transaction using search or filters and see the result set update immediately (no perceptible delay for typical ledger sizes).
- **SC-003**: Re-importing the same CSV does not create duplicate transactions; the user receives a clear summary of how many were added vs skipped.
- **SC-004**: When the user selects an invalid or unsupported file, they see an actionable error message and no incorrect or partial data is added to the ledger.
- **SC-005**: The ledger persists across app restarts; the user sees their previously imported transactions without re-importing.
