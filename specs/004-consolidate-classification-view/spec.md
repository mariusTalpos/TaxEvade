# Feature Specification: Consolidated Classification View

**Feature Branch**: `004-consolidate-classification-view`  
**Created**: 2026-03-04  
**Status**: Draft  
**Input**: User description: "Consolidate the Classification screen and the Edit Classification screen into a single view. Once a CSV is imported into the ledger we want to already start using our existing rules and then Ollama to classify the transaction. Then the Classification view can just be used by the user to review or edit what was automatically imported. Current workflow is slow and requires a lot of manual user input: Ingest CSV, Classify Transactions mostly manually, then Review and Edit. Goal: make classifying the Type and Category of transaction automatic without user input, then expect the user to verify that it was correct."

## Clarifications

### Session 2026-03-04

- Q: Is the "import" the CSV import from feature 001? → A: Yes. The import referred to throughout this spec is the CSV import into the ledger from feature 001 (csv-ledger-import). Auto-classification runs when that import completes (or as part of it).
- Q: When should the ledger list update after CSV import? → A: The ledger list MUST refresh immediately after import completes (without requiring a browser refresh). The UI must reload transactions from storage and update the list so newly added rows are visible right away.
- Q: Where are classification type and category stored? → A: They are persisted on the same Transaction in IndexedDB: classificationType, classificationCategory, and suggestion metadata (suggestionType, suggestionCategory, suggestionConfidence, suggestionSourceId). Auto-classification writes these via updateTransaction after each import; the Classification view reads them. If auto-classification fails for some rows, those remain without type/category until the user sets them in the Classification view.
- Q: Should the Ledger view show the same classification columns as the Classification view? → A: Yes. The Ledger table MUST display Type and Category (and optionally other classification-related columns) so the user can see classification at a glance without switching views. Column set should align with the Classification view (e.g. Date, Description, Amount, Account, Type, Category).
- Q: Should auto-classification run in parallel to speed up large imports? → A: Yes. The system SHOULD run auto-classification with bounded parallelism (e.g. a limited number of concurrent classification tasks per batch) so that importing many transactions (e.g. 300+) does not take proportionally longer than a small batch. Each transaction still receives at most one classification; correctness and persistence semantics are unchanged. Exact concurrency limit is implementation-defined.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Classification on Import (Priority: P1)

When the user imports a CSV into the ledger (using the CSV import from feature 001), the system automatically assigns a classification (type and, where applicable, category) to each imported transaction using built-in rules and AI-assisted classification. The user does not need to perform a separate classification step before reviewing. After import, every transaction has an initial classification that the user can later verify or change in the single classification view.

**Why this priority**: Core value; without auto-classification on import the workflow remains manual and the consolidation delivers little benefit.

**Independent Test**: Import a CSV into the ledger, then open the classification view; confirm all imported transactions already have a suggested or assigned type (and category for income/expense) so the user can proceed directly to review or edit.

**Acceptance Scenarios**:

1. **Given** the user has just imported a CSV into the ledger, **When** the import completes, **Then** each imported transaction has been assigned a classification type (income, expense, transfer, or ignore) by the system using built-in rules and AI-assisted classification where available.
2. **Given** a transaction is classified as income or expense by the system, **When** the import completes, **Then** the transaction has an assigned category (and optionally notes) so the user can verify or edit rather than entering from scratch.
3. **Given** the system cannot determine a classification for a transaction (e.g. no rule or AI match), **When** the import completes, **Then** the transaction is marked as unclassified or given a safe default (e.g. "ignore" or "unclassified") and appears in the single view for the user to classify manually.
4. **Given** import has finished and auto-classification has run, **When** the user opens the classification view, **Then** the user sees all transactions (classified and any remaining unclassified) in one place for review or edit.

---

### User Story 2 - Single View to Review and Edit Classifications (Priority: P1)

The user opens one classification view that shows all ledger transactions (or all that are relevant to classification). For each transaction the user sees the current classification (type, category for income/expense, optional notes) and, when it was auto-classified, an indication of how it was derived (e.g. rule or AI suggestion with confidence). The user can review the list, filter and sort to find specific transactions, and edit any transaction’s classification (type, category, notes) or clear it to mark as unclassified. The user saves changes explicitly; the system persists updates. There is no separate "classification" screen for unclassified only and "edit classification" screen for classified only—one unified view supports both reviewing auto-classified results and editing any transaction.

**Why this priority**: Defines the consolidated experience; one screen replaces the previous split between classifying unclassified and editing classified transactions.

**Independent Test**: After an import with auto-classification, open the single classification view; confirm all transactions appear with current classification; filter by type or category, sort, edit one or more transactions (including clearing classification), save, and verify persisted state and that the view still shows a single list.

**Acceptance Scenarios**:

1. **Given** the ledger has transactions (some auto-classified, some unclassified), **When** the user opens the classification view, **Then** the app shows one list containing all such transactions with current classification (type, category, notes) and, when applicable, how it was derived (e.g. rule name or AI suggestion and confidence).
2. **Given** the user is in the classification view, **When** the user edits the type, category, or notes for a transaction and saves, **Then** the system persists the change and the list reflects the update; no separate "edit" screen is required.
3. **Given** the user clears the classification (and category) for a transaction and saves, **When** the save completes, **Then** the transaction is stored as unclassified and remains visible in the same view (e.g. filterable as unclassified) so the user can re-classify later in the same place.
4. **Given** the user wants to classify a transaction that was left unclassified by the system, **When** the user is in the same classification view, **Then** the user can set type and category (and notes) for that transaction and save, and it is persisted without requiring a different screen or flow.
5. **Given** the list is large, **When** the user applies filter by type or category and sort by date, amount, or other columns, **Then** the list updates to show the filtered and sorted set; pagination or equivalent keeps the view responsive.

---

### User Story 3 - Reduced Manual Input and Verification-First Workflow (Priority: P2)

The primary workflow becomes: ingest CSV → system auto-classifies → user opens the single view to verify and correct. The majority of transactions are classified by the system so the user spends time only on verification and corrections, not on initial classification of every row. The system supports bulk actions where appropriate (e.g. accept all high-confidence suggestions, or filter to unclassified and work through them) so that remaining manual work is minimal.

**Why this priority**: Captures the business goal of reducing manual classification effort and making verification the default task.

**Independent Test**: Import a CSV, confirm auto-classification runs; open the single view and measure or observe that most transactions already have type and category filled; perform only verification and a few corrections; confirm no separate "classify unclassified" and "edit classified" flows are required.

**Acceptance Scenarios**:

1. **Given** a typical CSV import, **When** auto-classification has run, **Then** a high proportion of transactions have type and category assigned so the user can focus on verification rather than data entry.
2. **Given** the user is in the single classification view, **When** the user wishes to accept all suggestions above a certain confidence (e.g. high only), **Then** the system provides a way to apply those in bulk so the user can confirm many at once and then focus on the remainder.
3. **Given** some transactions remain unclassified after auto-classification, **When** the user is in the same view, **Then** the user can filter to unclassified and complete classification for those only, without leaving the view.

---

### Edge Cases

- What happens when auto-classification fails or is unavailable (e.g. AI service down)? The system still imports transactions; they are left unclassified or marked with a clear state (e.g. "pending classification") and appear in the single view for manual classification. The user is not blocked from importing or reviewing.
- What happens when the user clears classification and saves? The transaction becomes unclassified and stays in the same view (e.g. visible when filtering for unclassified) so the user can re-classify in place.
- What happens when the user edits a transaction but navigates away without saving? The system discards in-memory edits and does not prompt; only explicit save persists changes.
- What happens when there are no transactions (or none in the current filter)? The view shows an empty state with a clear message; the user can change filters or navigate elsewhere.
- How are conflicts or duplicates handled on import? Out of scope for this spec; existing ledger/import behavior already removes duplicates.
- When auto-classification runs in parallel, the order in which results are persisted is unspecified; the user sees the final state when the ledger list is refreshed after the import (and classification run) completes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the user imports a CSV into the ledger (the same CSV import as in feature 001, csv-ledger-import), the system MUST run automatic classification (using built-in rules and AI-assisted classification where available) so that each imported transaction receives an initial classification type and, for income/expense, a category, before or as part of the import completion. The user MUST NOT be required to run a separate "classify" step before reviewing.
- **FR-002**: The system MUST provide a single classification view that shows all transactions relevant to classification (both those already classified and those unclassified). This view MUST replace the need for a separate "classification" screen (for unclassified only) and "edit classification" screen (for classified only).
- **FR-003**: In the single classification view, the system MUST display for each transaction at least: identification (e.g. date, description, amount), current classification type, and for income/expense the category and optional notes. When a transaction was auto-classified, the system MUST indicate the source (e.g. rule or AI suggestion) and confidence level where available.
- **FR-004**: The system MUST allow the user to edit the classification (type, category, notes) of any transaction in this view and to save changes; the system MUST persist updates. The system MUST allow the user to clear the classification entirely; in that case the transaction MUST be stored as unclassified and MUST remain visible in the same view (e.g. filterable as unclassified). Saving MUST NOT create or update user-defined rules.
- **FR-005**: The system MUST allow the user to classify transactions that are currently unclassified from within the same view (set type, and for income/expense category and notes, then save) so that no separate screen or flow is required for "unclassified only" vs "classified only."
- **FR-006**: For transactions classified as income or expense, the system MUST require a non-empty category before saving; for transfer or ignore, the system MUST NOT require category or notes. The system MUST show a clear validation message if the user attempts to save income/expense without a category.
- **FR-007**: The system MUST support filtering the list by classification type and by category (and optionally by unclassified vs classified) and MUST support sorting by at least date, amount, type, or category so the user can find and order transactions.
- **FR-008**: When the list is large, the system MUST support pagination or virtual scrolling (or equivalent) so the view remains usable and responsive.
- **FR-009**: The system MAY provide bulk actions (e.g. accept all suggestions at or above a given confidence) so the user can confirm many classifications at once; the exact actions are implementation-defined but MUST NOT create user-defined rules.
- **FR-010**: When the user navigates away without saving, the system MUST discard in-memory edits and MUST NOT prompt to save; only explicit save persists changes.
- **FR-011**: When auto-classification is unavailable or fails for some transactions, the system MUST still complete the import and MUST present those transactions in the single view as unclassified (or with a clear "pending" state) so the user can classify them manually.
- **FR-012**: The ledger list MUST refresh immediately after CSV import completes so that newly added transactions are visible without a browser refresh. Failure of auto-classification MUST NOT prevent the ledger list from updating.
- **FR-013**: The Ledger view MUST display Type and Category (and, where applicable, the same classification-related columns as the Classification view) for each transaction so users can see classification without leaving the Ledger.
- **FR-014**: Auto-classification for newly imported transactions SHOULD run with bounded parallelism (e.g. a limited number of concurrent classification tasks) so that large imports (e.g. hundreds of rows) complete in less wall-clock time than strictly sequential processing. Each transaction still receives at most one classification; correctness, persistence, and failure handling (FR-011) are unchanged. The concurrency limit is implementation-defined (e.g. to avoid overloading the AI service or the browser).

### Key Entities

- **Transaction**: A ledger transaction (from CSV import or existing data) with optional classification. Has type (income, expense, transfer, ignore), and for income/expense a category and optional notes. May be auto-classified (with source and confidence) or manually classified or unclassified.
- **Classification type**: One of income, expense, transfer, ignore.
- **Category**: A label required for income and expense; optional for transfer and ignore. The set of allowed categories is defined by the app (e.g. configuration) and is the same across the classification flow.
- **Auto-classification**: The result of running built-in rules and AI-assisted classification on a transaction at import (or when new transactions are added), producing an initial type and category and optional confidence/source for display.

## Assumptions

- The "import" and "CSV import" referred to in this spec are the same flow as feature 001 (csv-ledger-import): the user uploads or selects a CSV and the app ingests it into the ledger. Auto-classification is triggered when that import completes (or as part of it); there is no separate or different import mechanism in scope for this feature.
- The ledger and transaction model already support classification fields (type, category, notes) and suggestion metadata (e.g. source, confidence) as in the guided transaction classification and classified-transactions-view features; this feature reuses and extends that model.
- Built-in rules and AI-assisted classification (e.g. Ollama) are available or can be integrated; when they are not, transactions are left unclassified and the user classifies them in the single view.
- The app is local only; no multi-user or multi-tab conflict resolution is in scope.
- Allowed categories are defined elsewhere (e.g. config); this view does not define new categories.
- "Consolidation" means one UI view and one workflow; it may replace or subsume the UIs from the previous classification (002) and classified-transactions (003) features from a user perspective.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After importing a CSV, users see transactions already classified (type and category where applicable) in the single view without performing a separate classification step; only verification and corrections are needed for the majority of rows.
- **SC-002**: Users can complete the entire review-and-edit workflow in one view: open the view, filter/sort, edit or clear classifications, save, and optionally accept bulk suggestions—without switching to a different "classification" or "edit classification" screen.
- **SC-003**: The time and number of manual actions required to go from "CSV imported" to "all transactions reviewed or corrected" are reduced compared to the previous workflow (ingest → manual classify → review/edit); the reduction is measurable by fewer user steps and less data entry per transaction.
- **SC-004**: When auto-classification is unavailable, users can still import data and classify all transactions manually within the same single view; the app does not block import or require a different flow.
- **SC-005**: The single view loads and responds to filter, sort, and edit actions within a reasonable time (e.g. under 2 seconds for typical dataset sizes) so users can verify and correct without noticeable delay.
- **SC-006**: For large imports (e.g. hundreds of transactions), the time from import start to "ledger list refreshed with all classifications" is reduced by running auto-classification with bounded parallelism where possible, so that users are not blocked by strictly sequential classification.
