# Tasks: CSV Ledger Import and View

**Input**: Design documents from `/specs/001-csv-ledger-import/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per constitution (`.specify/memory/constitution.md`), every component and service MUST have a spec file with smoke and key behavior tests. Test tasks are included for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Spec user stories: US1 Import, US2 View list, US3 Clear ledger (full wipe + delete selected), US4 Deduplicate.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3=Clear ledger, US4=Deduplicate)
- Include exact file paths in descriptions

## Path Conventions

- Angular app: `src/app/` at repository root; core under `src/app/core/`, feature under `src/app/features/ledger/`.
- Co-located specs: `*.spec.ts` next to component/service (per plan).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Angular 18+ shell

- [x] T001 Create Angular 18+ project with standalone components, strict TypeScript, and default app shell at repository root (ng new or equivalent)
- [x] T002 Configure ESLint and Prettier per constitution in project root and angular.json / eslint config
- [x] T003 [P] Create folder structure: src/app/core/services, src/app/core/models, src/app/features/ledger/containers/ledger-page, src/app/features/ledger/components/transaction-list, src/app/features/ledger/components/transaction-filters, src/app/features/ledger/components/import-file-picker, src/app/features/ledger/components/account-name-input, src/app/features/ledger/components/confirmation-dialog

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and storage that ALL user stories depend on. No user story work until this phase is complete.

- [x] T004 [P] Create Transaction and ImportResult interfaces in src/app/core/models/transaction.ts per contracts/normalized-transaction.md and data-model.md
- [x] T005 Implement LedgerStorageService: IndexedDB open, transactions store with indexes (date, account), getAll(), addTransactions(candidates, account) with deduplication by (date, amount, description, account), return ImportResult (added, skippedAsDuplicate, skippedInvalid) in src/app/core/services/ledger-storage.service.ts
- [x] T006 Add LedgerStorageService spec (smoke + getAll/addTransactions/dedupe behavior) in src/app/core/services/ledger-storage.service.spec.ts
- [x] T007 Add lazy route for ledger feature in src/app/app.routes.ts and create ledger.routes.ts in src/app/features/ledger/ledger.routes.ts with default path to ledger-page

**Checkpoint**: Types and persistence ready; ledger route loads. User story implementation can begin.

---

## Phase 3: User Story 1 - Import CSV into Ledger (Priority: P1) — MVP

**Goal**: User selects a Wells Fargo CSV, app parses and normalizes rows, stores transactions in the ledger, and shows how many were added (and any errors). Empty or invalid file shows a clear error.

**Independent Test**: Select a valid Wells Fargo CSV, confirm import; verify transactions appear in the ledger with correct date, description, amount, inflow/outflow, and account. Select an invalid file and verify an error message with no partial data added.

### Tests for User Story 1

- [x] T008 [P] [US1] Add CsvParserService spec (smoke + parse valid 5-column quoted CSV, normalize date/amount/description; reject invalid format) in src/app/core/services/csv-parser.service.spec.ts
- [x] T009 [P] [US1] Add ImportFilePickerComponent spec (smoke + file selection emits file) in src/app/features/ledger/components/import-file-picker/import-file-picker.component.spec.ts
- [x] T010 [US1] Add LedgerPageContainer spec (smoke + import flow: file -> parse -> storage -> result displayed; error on invalid file) in src/app/features/ledger/containers/ledger-page/ledger-page.component.spec.ts

### Implementation for User Story 1

- [x] T011 [P] [US1] Implement CsvParserService: parse Wells Fargo 5-column quoted CSV per contracts/wells-fargo-csv.md (columns 0=date, 1=amount, 4=description; normalize date to YYYY-MM-DD, amount as number; return Transaction-like rows without id/account) in src/app/core/services/csv-parser.service.ts
- [x] T012 [P] [US1] Create ImportFilePickerComponent (standalone, OnPush): file input, accept .csv, output file selected; no business logic in src/app/features/ledger/components/import-file-picker/import-file-picker.component.ts
- [x] T013 [US1] Create LedgerPageContainer (standalone, signals, OnPush): inject LedgerStorageService and CsvParserService; on file selected run parser, assign account from user input only (no fixed default per FR-012), call storage.addTransactions, store ImportResult in signal and display (added, skippedInvalid, error) in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts
- [x] T014 [US1] In LedgerPageContainer handle empty file and unsupported/invalid format: set error message in result and show user-facing message per FR-011; no partial data written in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts
- [x] T015 [US1] Wire ledger route to LedgerPageContainer and add ImportFilePickerComponent to template; display import result message (e.g. "X transactions added" or "No transactions found" / error) in src/app/features/ledger/containers/ledger-page/
- [x] T028 [US1] LedgerStorageService: add getDistinctAccountNames(): Promise<string[]> returning distinct account values from the transactions store (for FR-017 autocomplete) in src/app/core/services/ledger-storage.service.ts
- [x] T029 [P] [US1] Create AccountNameInputComponent (standalone, OnPush): input suggestions (string[]), output accountSelected (string); allow user to type or select from dropdown/datalist/autocomplete; no fixed default in src/app/features/ledger/components/account-name-input/account-name-input.component.ts
- [x] T030 [US1] Add AccountNameInputComponent spec (smoke + emits selected/typed value; displays suggestions) in src/app/features/ledger/components/account-name-input/account-name-input.component.spec.ts
- [x] T031 [US1] In LedgerPageContainer: prompt for account name before or with file pick (no "Wells Fargo" default); load suggestions via LedgerStorageService.getDistinctAccountNames(); pass suggestions to AccountNameInputComponent; use emitted account value for addTransactions(..., account) in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts
- [x] T032 [US1] Wire AccountNameInputComponent in import flow in LedgerPageContainer template (e.g. account step then file pick; or single view with account input + file pick) in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts

**Checkpoint**: User Story 1 is complete (with account prompt and autocomplete). User can import a Wells Fargo CSV with user-provided account name and see confirmation or error; transactions persist in IndexedDB.

---

## Phase 4: User Story 2 - View Searchable, Filterable Transaction List (Priority: P2)

**Goal**: User sees the full ledger as a list with date, description, amount, inflow/outflow, and account. Search (description/amount) and filters (date range, account, inflow vs outflow) narrow the list; clearing search/filters restores full list.

**Independent Test**: Load ledger with multiple transactions; open ledger page and see all. Enter search text and see list narrow; apply filters and see list narrow; clear and see full list again.

### Tests for User Story 2

- [x] T016 [P] [US2] Add TransactionListComponent spec (smoke + renders transaction rows with date, description, amount, account) in src/app/features/ledger/components/transaction-list/transaction-list.component.spec.ts
- [x] T017 [P] [US2] Add TransactionFiltersComponent spec (smoke + search and filter outputs emit when user changes values) in src/app/features/ledger/components/transaction-filters/transaction-filters.component.spec.ts

### Implementation for User Story 2

- [x] T018 [P] [US2] Create TransactionListComponent (standalone, OnPush): input signal or array of Transaction; display table/list with date, description, amount, inflow/outflow, account in src/app/features/ledger/components/transaction-list/transaction-list.component.ts
- [x] T019 [P] [US2] Create TransactionFiltersComponent (standalone, OnPush): inputs for search query, date range, account, inflow/outflow; output events or model for filter changes in src/app/features/ledger/components/transaction-filters/transaction-filters.component.ts
- [x] T020 [US2] In LedgerPageContainer load transactions from LedgerStorageService.getAll() into a signal; add signals for search query and filter state; compute filtered list signal (search on description/amount, filter by date range, account, inflow/outflow) in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts
- [x] T021 [US2] Wire TransactionFiltersComponent and TransactionListComponent in LedgerPageContainer template; pass filtered transactions to list; ensure list updates when search or filters change in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts
- [x] T027 [US2] Add pagination to the transaction list with user-selectable rows per page (e.g., 25, 50, 100) in src/app/features/ledger/components/transaction-list/transaction-list.component.ts and wire page size and current page in LedgerPageContainer per FR-010 (spec edge case)

**Checkpoint**: User Story 2 is complete. User can view, search, filter, and paginate the transaction list with selectable rows per page.

---

## Phase 5: User Story 3 - Clear Ledger (Priority: P3)

**Goal**: User can clear all transactions (full wipe) or select specific transactions via checkboxes and delete only those. Both actions require explicit confirmation (FR-013, FR-014, FR-015). After confirm, UI and persistence update immediately.

**Independent Test**: Import transactions; trigger full wipe and confirm → ledger empty. Import again; select some rows via checkbox, trigger "Delete selected" and confirm → only those removed. Cancel confirmation → no change.

### Tests for User Story 3 (Clear Ledger)

- [x] T033 [P] [US3] LedgerStorageService spec: add tests for clearAll() (store empty) and deleteByIds(ids) (only those ids removed) in src/app/core/services/ledger-storage.service.spec.ts
- [x] T039 [P] [US3] TransactionListComponent spec: add tests for row checkbox selection and selectedIds/output in src/app/features/ledger/components/transaction-list/transaction-list.component.spec.ts
- [x] T040 [US3] LedgerPageContainer spec: add tests for full wipe (confirm → clearAll, list empty) and delete selected (confirm → deleteByIds, selection cleared) in src/app/features/ledger/containers/ledger-page/ledger-page.component.spec.ts
- [x] T041 [P] [US3] Add ConfirmationDialogComponent spec (smoke + open with title/message, emit confirm and cancel) in src/app/features/ledger/components/confirmation-dialog/confirmation-dialog.component.spec.ts

### Implementation for User Story 3 (Clear Ledger)

- [x] T034 [US3] LedgerStorageService: add clearAll() and deleteByIds(ids: string[]) per data-model Delete operations in src/app/core/services/ledger-storage.service.ts
- [x] T035 [P] [US3] Create ConfirmationDialogComponent (standalone, OnPush): accept title and message; emit confirm/cancel; use for full wipe and delete-selected per FR-015 in src/app/features/ledger/components/confirmation-dialog/confirmation-dialog.component.ts
- [x] T036 [US3] TransactionListComponent: add row checkboxes bound to selection state; output selectedIds (or selectionChanged); optional "select all" for current page in src/app/features/ledger/components/transaction-list/transaction-list.component.ts
- [x] T037 [US3] LedgerPageContainer: add "Clear all" (or "Clear ledger") button; on click open confirmation "Clear all transactions? This cannot be undone."; on confirm call LedgerStorageService.clearAll(), refresh list signal in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts
- [x] T038 [US3] LedgerPageContainer: add "Delete selected" button (enabled when at least one row selected); on click open confirmation "Delete N selected transaction(s)?"; on confirm call LedgerStorageService.deleteByIds(selectedIds), clear selection, refresh list in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts

**Checkpoint**: User Story 3 (Clear Ledger) is complete. Full wipe and delete selected work with confirmation; list and storage stay in sync.

---

## Phase 6: User Story 4 - Deduplicate on Re-import (Priority: P4)

**Goal**: Re-importing the same or overlapping CSV does not create duplicate transactions; user sees a summary (e.g. X added, Y duplicates skipped).

**Independent Test**: Import a Wells Fargo CSV; import the same file again; verify zero new transactions and message showing duplicates skipped.

### Tests for User Story 4

- [x] T022 [US4] Add test in LedgerPageContainer or LedgerStorageService spec: re-import same CSV returns added=0, skippedAsDuplicate=N and no duplicate rows in storage in src/app/features/ledger/containers/ledger-page/ledger-page.component.spec.ts or ledger-storage.service.spec.ts

### Implementation for User Story 4

- [x] T023 [US4] Ensure ImportResult.skippedAsDuplicate is shown in LedgerPageContainer after import (e.g. "X added, Y duplicates skipped") when user re-imports same or overlapping file in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts

**Checkpoint**: User Story 4 is complete. Re-import shows duplicate count and no duplicates in ledger.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, validation, and quality

- [x] T024 [P] Handle malformed CSV rows: CsvParserService skips invalid rows and includes skippedInvalid in parse result; LedgerPageContainer shows summary (e.g. "X imported, Y rows skipped due to errors") per spec edge cases in src/app/core/services/csv-parser.service.ts and ledger container
- [x] T025 Run quickstart.md validation: ng serve, ng test, and manual import/list flow in project root
- [x] T026 [P] Code cleanup: ensure OnPush, signals, @if/@for/@switch control flow in templates; no NgModule; ESLint and Prettier pass; tests use Angular Testing Library style (Jasmine, minimal TestBed); 80%+ coverage on logic-heavy code (parser, storage) in src/app/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start first.
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 — MVP; includes account prompt and autocomplete (T028–T032).
- **Phase 4 (US2)**: Depends on Phase 2; uses same LedgerPageContainer and storage. Implement after US1 for a single developer.
- **Phase 5 (US3 Clear Ledger)**: Depends on Phase 2 (storage) and Phase 4 (list UI). Adds clearAll, deleteByIds, confirmation, checkboxes.
- **Phase 6 (US4 Deduplicate)**: Depends on Phase 2 (dedupe in storage) and US1 (import UI). Display of skippedAsDuplicate only.
- **Phase 7 (Polish)**: Depends on completion of desired user stories.

### User Story Dependencies

- **US1**: No dependency on US2/US3/US4. Delivers import, account prompt, autocomplete, persistence.
- **US2**: Needs ledger data (from US1 or manual seed); independently testable with preloaded storage.
- **US3 (Clear Ledger)**: Needs list (US2) and storage; adds clear/delete and confirmation.
- **US4 (Deduplicate)**: Deduplication in T005; US4 adds display of duplicate count and tests.

### Parallel Opportunities

- Phase 1: T003 [P] can run after T001/T002.
- Phase 2: T004 [P], T006 with T005; T007 after route structure exists.
- Phase 3: T008, T009, T010 [P] tests; T011, T012 [P] implementation; then T013–T015 sequential; T028 (storage), T029 [P] (AccountNameInputComponent), T030 (spec); then T031–T032 in container.
- Phase 4: T016, T017 [P] tests; T018, T019 [P] components; T020–T021 in container; T027 pagination.
- Phase 5: T033, T039, T040, T041 [P] tests; T034 (storage), T035 [P] (ConfirmationDialogComponent); T036 (list checkboxes); T037–T038 (container).
- Phase 7: T024, T026 [P] can run in parallel.

---

## Parallel Example: User Story 1

```text
# After Phase 2 complete, tests in parallel:
T008 CsvParserService spec
T009 ImportFilePickerComponent spec
T010 LedgerPageContainer spec

# Then implementation in parallel where possible:
T011 CsvParserService
T012 ImportFilePickerComponent
# Then T013–T015 in LedgerPageContainer (sequential)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (US1): parser, file picker, ledger page, import flow, error handling.
3. Validate: import a Wells Fargo CSV, confirm transactions in storage and message.
4. Optionally run Phase 7 (Polish): T024 (malformed rows) and T025 (quickstart).

### Incremental Delivery

1. Setup + Foundational → types and storage ready.
2. US1 → Import working (including account prompt and autocomplete) → MVP.
3. US2 → List, search, filter → full viewing.
4. US3 → Clear ledger (full wipe, delete selected with confirmation) → data management.
5. US4 → Duplicate summary in UI → re-import safe.
6. Polish → edge cases and cleanup.

### Task Summary

| Phase           | Task IDs                    | Count |
|-----------------|-----------------------------|-------|
| Setup           | T001–T003                   | 3     |
| Foundational    | T004–T007                   | 4     |
| US1 (P1)        | T008–T015, T028–T032        | 13    |
| US2 (P2)        | T016–T021, T027             | 7     |
| US3 Clear (P3)  | T033–T041                   | 9     |
| US4 Dedupe (P4) | T022–T023                   | 2     |
| Polish          | T024–T026                   | 3     |
| **Total**       |                             | **41**|

- **MVP scope**: Phases 1 + 2 + 3 (T001–T015; optional T028–T032 for account prompt + autocomplete).
- **Large imports (1k+ rows)**: Import performance for files over 1,000 rows is a future enhancement; SC-001 targets up to 1,000 rows. No dedicated performance task in this scope.
- **Independent test criteria**: See “Independent Test” under each user story phase.
- All tasks use checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`.
