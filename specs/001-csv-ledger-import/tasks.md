# Tasks: CSV Ledger Import and View

**Input**: Design documents from `/specs/001-csv-ledger-import/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per constitution (`.specify/memory/constitution.md`), every component and service MUST have a spec file with smoke and key behavior tests. Test tasks are included for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Angular app: `src/app/` at repository root; core under `src/app/core/`, feature under `src/app/features/ledger/`.
- Co-located specs: `*.spec.ts` next to component/service (per plan).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Angular 18+ shell

- [ ] T001 Create Angular 18+ project with standalone components, strict TypeScript, and default app shell at repository root (ng new or equivalent)
- [ ] T002 Configure ESLint and Prettier per constitution in project root and angular.json / eslint config
- [ ] T003 [P] Create folder structure: src/app/core/services, src/app/core/models, src/app/features/ledger/containers/ledger-page, src/app/features/ledger/components/transaction-list, src/app/features/ledger/components/transaction-filters, src/app/features/ledger/components/import-file-picker

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and storage that ALL user stories depend on. No user story work until this phase is complete.

- [ ] T004 [P] Create Transaction and ImportResult interfaces in src/app/core/models/transaction.ts per contracts/normalized-transaction.md and data-model.md
- [ ] T005 Implement LedgerStorageService: IndexedDB open, transactions store with indexes (date, account), getAll(), addTransactions(candidates, account) with deduplication by (date, amount, description, account), return ImportResult (added, skippedAsDuplicate, skippedInvalid) in src/app/core/services/ledger-storage.service.ts
- [ ] T006 Add LedgerStorageService spec (smoke + getAll/addTransactions/dedupe behavior) in src/app/core/services/ledger-storage.service.spec.ts
- [ ] T007 Add lazy route for ledger feature in src/app/app.routes.ts and create ledger.routes.ts in src/app/features/ledger/ledger.routes.ts with default path to ledger-page

**Checkpoint**: Types and persistence ready; ledger route loads. User story implementation can begin.

---

## Phase 3: User Story 1 - Import CSV into Ledger (Priority: P1) — MVP

**Goal**: User selects a Wells Fargo CSV, app parses and normalizes rows, stores transactions in the ledger, and shows how many were added (and any errors). Empty or invalid file shows a clear error.

**Independent Test**: Select a valid Wells Fargo CSV, confirm import; verify transactions appear in the ledger with correct date, description, amount, inflow/outflow, and account. Select an invalid file and verify an error message with no partial data added.

### Tests for User Story 1

- [ ] T008 [P] [US1] Add CsvParserService spec (smoke + parse valid 5-column quoted CSV, normalize date/amount/description; reject invalid format) in src/app/core/services/csv-parser.service.spec.ts
- [ ] T009 [P] [US1] Add ImportFilePickerComponent spec (smoke + file selection emits file) in src/app/features/ledger/components/import-file-picker/import-file-picker.component.spec.ts
- [ ] T010 [US1] Add LedgerPageContainer spec (smoke + import flow: file -> parse -> storage -> result displayed; error on invalid file) in src/app/features/ledger/containers/ledger-page/ledger-page.component.spec.ts

### Implementation for User Story 1

- [ ] T011 [P] [US1] Implement CsvParserService: parse Wells Fargo 5-column quoted CSV per contracts/wells-fargo-csv.md (columns 0=date, 1=amount, 4=description; normalize date to YYYY-MM-DD, amount as number; return Transaction-like rows without id/account) in src/app/core/services/csv-parser.service.ts
- [ ] T012 [P] [US1] Create ImportFilePickerComponent (standalone, OnPush): file input, accept .csv, output file selected; no business logic in src/app/features/ledger/components/import-file-picker/import-file-picker.component.ts
- [ ] T013 [US1] Create LedgerPageContainer (standalone, signals, OnPush): inject LedgerStorageService and CsvParserService; on file selected run parser, assign account (default or user input), call storage.addTransactions, store ImportResult in signal and display (added, skippedInvalid, error) in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts
- [ ] T014 [US1] In LedgerPageContainer handle empty file and unsupported/invalid format: set error message in result and show user-facing message per FR-010; no partial data written in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts
- [ ] T015 [US1] Wire ledger route to LedgerPageContainer and add ImportFilePickerComponent to template; display import result message (e.g. "X transactions added" or "No transactions found" / error) in src/app/features/ledger/containers/ledger-page/

**Checkpoint**: User Story 1 is complete. User can import a Wells Fargo CSV and see confirmation or error; transactions persist in IndexedDB.

---

## Phase 4: User Story 2 - View Searchable, Filterable Transaction List (Priority: P2)

**Goal**: User sees the full ledger as a list with date, description, amount, inflow/outflow, and account. Search (description/amount) and filters (date range, account, inflow vs outflow) narrow the list; clearing search/filters restores full list.

**Independent Test**: Load ledger with multiple transactions; open ledger page and see all. Enter search text and see list narrow; apply filters and see list narrow; clear and see full list again.

### Tests for User Story 2

- [ ] T016 [P] [US2] Add TransactionListComponent spec (smoke + renders transaction rows with date, description, amount, account) in src/app/features/ledger/components/transaction-list/transaction-list.component.spec.ts
- [ ] T017 [P] [US2] Add TransactionFiltersComponent spec (smoke + search and filter outputs emit when user changes values) in src/app/features/ledger/components/transaction-filters/transaction-filters.component.spec.ts

### Implementation for User Story 2

- [ ] T018 [P] [US2] Create TransactionListComponent (standalone, OnPush): input signal or array of Transaction; display table/list with date, description, amount, inflow/outflow, account in src/app/features/ledger/components/transaction-list/transaction-list.component.ts
- [ ] T019 [P] [US2] Create TransactionFiltersComponent (standalone, OnPush): inputs for search query, date range, account, inflow/outflow; output events or model for filter changes in src/app/features/ledger/components/transaction-filters/transaction-filters.component.ts
- [ ] T020 [US2] In LedgerPageContainer load transactions from LedgerStorageService.getAll() into a signal; add signals for search query and filter state; compute filtered list signal (search on description/amount, filter by date range, account, inflow/outflow) in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts
- [ ] T021 [US2] Wire TransactionFiltersComponent and TransactionListComponent in LedgerPageContainer template; pass filtered transactions to list; ensure list updates when search or filters change in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts
- [ ] T027 [US2] Add pagination to the transaction list with user-selectable rows per page (e.g., 25, 50, 100) in src/app/features/ledger/components/transaction-list/transaction-list.component.ts and wire page size and current page in LedgerPageContainer per FR-010 (spec edge case)

**Checkpoint**: User Story 2 is complete. User can view, search, filter, and paginate the transaction list with selectable rows per page.

---

## Phase 5: User Story 3 - Deduplicate on Re-import (Priority: P3)

**Goal**: Re-importing the same or overlapping CSV does not create duplicate transactions; user sees a summary (e.g. X added, Y duplicates skipped).

**Independent Test**: Import a Wells Fargo CSV; import the same file again; verify zero new transactions and message showing duplicates skipped.

### Tests for User Story 3

- [ ] T022 [US3] Add test in LedgerPageContainer or LedgerStorageService spec: re-import same CSV returns added=0, skippedAsDuplicate=N and no duplicate rows in storage in src/app/features/ledger/containers/ledger-page/ledger-page.component.spec.ts or ledger-storage.service.spec.ts

### Implementation for User Story 3

- [ ] T023 [US3] Ensure ImportResult.skippedAsDuplicate is shown in LedgerPageContainer after import (e.g. "X added, Y duplicates skipped") when user re-imports same or overlapping file in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts

**Checkpoint**: User Story 3 is complete. Re-import shows duplicate count and no duplicates in ledger.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, validation, and quality

- [ ] T024 [P] Handle malformed CSV rows: CsvParserService skips invalid rows and includes skippedInvalid in parse result; LedgerPageContainer shows summary (e.g. "X imported, Y rows skipped due to errors") per spec edge cases in src/app/core/services/csv-parser.service.ts and ledger container
- [ ] T025 Run quickstart.md validation: ng serve, ng test, and manual import/list flow in project root
- [ ] T026 [P] Code cleanup: ensure OnPush, signals, @if/@for/@switch control flow in templates; no NgModule; ESLint and Prettier pass; tests use Angular Testing Library style (Jasmine, minimal TestBed); 80%+ coverage on logic-heavy code (parser, storage) in src/app/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start first.
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 — MVP; can ship after this.
- **Phase 4 (US2)**: Depends on Phase 2; uses same LedgerPageContainer and storage. Implement after US1 for a single developer.
- **Phase 5 (US3)**: Depends on Phase 2 (dedupe in storage) and US1 (import UI). Display of skippedAsDuplicate only.
- **Phase 6 (Polish)**: Depends on completion of desired user stories.

### User Story Dependencies

- **US1**: No dependency on US2/US3. Delivers import and persistence.
- **US2**: Needs ledger data (from US1 or manual seed); independently testable with preloaded storage.
- **US3**: Deduplication logic in Foundational (T005); US3 adds display of duplicate count and tests.

### Parallel Opportunities

- Phase 1: T003 [P] can run after T001/T002.
- Phase 2: T004 [P], T006 with T005; T007 after route structure exists.
- Phase 3: T008, T009, T010 [P] tests; T011, T012 [P] implementation; then T013–T015 sequential in container.
- Phase 4: T016, T017 [P] tests; T018, T019 [P] components; T020–T021 in container; T027 pagination.
- Phase 6: T024, T026 [P] can run in parallel.

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
4. Optionally run Phase 6 T024 (malformed rows) and T025 (quickstart).

### Incremental Delivery

1. Setup + Foundational → types and storage ready.
2. US1 → Import working → MVP.
3. US2 → List, search, filter → full viewing.
4. US3 → Duplicate summary in UI → re-import safe.
5. Polish → edge cases and cleanup.

### Task Summary

| Phase        | Task IDs   | Count |
|-------------|------------|-------|
| Setup       | T001–T003  | 3     |
| Foundational| T004–T007  | 4     |
| US1 (P1)    | T008–T015  | 8     |
| US2 (P2)    | T016–T021, T027 | 7     |
| US3 (P3)    | T022–T023  | 2     |
| Polish      | T024–T026  | 3     |
| **Total**   |            | **27**|

- **MVP scope**: Phases 1 + 2 + 3 (Tasks T001–T015).
- **Large imports (1k+ rows)**: Import performance for files over 1,000 rows is a future enhancement; SC-001 targets up to 1,000 rows. No dedicated performance task in this scope.
- **Independent test criteria**: See “Independent Test” under each user story phase.
- All tasks use checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`.
