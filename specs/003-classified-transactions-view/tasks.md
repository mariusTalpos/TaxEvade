# Tasks: Classified Transactions View

**Input**: Design documents from `/specs/003-classified-transactions-view/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per project constitution (`.specify/memory/constitution.md`), every component and service MUST have a spec file with smoke and key behavior tests. Test tasks are included for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Angular app under `src/app/` at repository root; tests under `src/` alongside components or in dedicated spec files.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure route and entry point for the edit-classifications (classified transactions) view.

- [ ] T001 Add edit-classifications route in src/app/features/classification/classification.routes.ts (path `edit`, loadComponent lazy-loading edit-classifications-page)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core support that MUST be in place before the edit-classifications view can implement clear-classification behavior.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Add clearClassification(transactionId: string) to LedgerStorageService in src/app/core/services/ledger-storage.service.ts that sets classificationType, classificationCategory, classificationNotes to undefined and persists via existing store; add unit test in src/app/core/services/ledger-storage.service.spec.ts

**Checkpoint**: Foundation ready – edit-classifications implementation can proceed.

---

## Phase 3: User Story 1 – View Classified Transactions in a List (Priority: P1) – MVP

**Goal**: User opens the classified-transactions (edit-classifications) view and sees a list of all classified transactions with type and category/notes, with filter by type/category and sort; empty state when none.

**Independent Test**: Load a ledger with classified transactions, open the edit-classifications view, confirm list shows and filter/sort work; with no classified transactions, confirm empty state (no error).

### Implementation for User Story 1

- [ ] T003 [P] [US1] Create edit-classifications-page container in src/app/features/classification/containers/edit-classifications-page/ (standalone, signals, OnPush) with template that hosts the classified table and filter/sort UI
- [ ] T004 [US1] In edit-classifications-page load classified list via LedgerStorageService.getClassified() on init and expose as signal (e.g. classifiedList) in src/app/features/classification/containers/edit-classifications-page/edit-classifications-page.component.ts
- [ ] T005 [P] [US1] Create edit-classifications-table presentational component in src/app/features/classification/components/edit-classifications-table/ (standalone, inputs: transactions, selection, filter/sort state; outputs: selectionChange; OnPush)
- [ ] T006 [US1] In edit-classifications-table implement table display columns: date, description, amount, classificationType, classificationCategory, classificationNotes; show empty state message when transactions list is empty in src/app/features/classification/components/edit-classifications-table/edit-classifications-table.component.ts
- [ ] T007 [US1] Add filter state (by classification type, by category) and derived filtered list in edit-classifications-page; pass filter state and filtered list to edit-classifications-table
- [ ] T008 [US1] Add sort state (column, direction) and apply sort to filtered list (date, amount, classificationType, category) in edit-classifications-page

### Tests for User Story 1

- [ ] T009 [P] [US1] Add edit-classifications-page.component.spec.ts with smoke test and test that getClassified is called and list is displayed; test empty state when getClassified returns []
- [ ] T010 [P] [US1] Add edit-classifications-table.component.spec.ts with smoke test and tests for display of rows and empty state when no transactions

**Checkpoint**: User Story 1 complete – user can view classified list with filter and sort; empty state works.

---

## Phase 4: User Story 2 – Modify Classification for a Transaction (Priority: P1)

**Goal**: User can select a transaction, edit type/category/notes and Save (with validation for income/expense category); or clear classification and Save so the transaction becomes unclassified and leaves the list. Navigating away or changing selection without Save discards draft (no prompt).

**Independent Test**: Open view, select a row, change type/category, Save and confirm persistence; clear classification and Save and confirm row disappears; try Save with income/expense and empty category and see validation message; edit and navigate away without Save and confirm edits are discarded.

### Implementation for User Story 2

- [ ] T011 [US2] In edit-classifications-page add selection state (selectedTransactionId signal) and draft state (draftType, draftCategory, draftNotes signals) for the selected row; discard draft on selection change and on route leave (ngOnDestroy) in src/app/features/classification/containers/edit-classifications-page/edit-classifications-page.component.ts
- [ ] T012 [US2] Implement Save in edit-classifications-page: when type is income or expense require non-empty category (trim); if invalid show validation message and do not persist; otherwise call updateClassification or updateTransaction; after save refresh list (getClassified()) and clear draft in src/app/features/classification/containers/edit-classifications-page/edit-classifications-page.component.ts
- [ ] T013 [US2] Implement Clear classification in edit-classifications-page: when user chooses Clear, call LedgerStorageService.clearClassification(selectedTransactionId), then refresh list so transaction is removed from view in src/app/features/classification/containers/edit-classifications-page/edit-classifications-page.component.ts
- [ ] T014 [US2] Wire edit-classifications-table with selection (input selectedId, output selectionChange), inline edit controls for type (dropdown), category (dropdown/input from config), notes (input), and Save and Clear buttons; bind draft values and emit changes to parent in src/app/features/classification/components/edit-classifications-table/edit-classifications-table.component.ts
- [ ] T015 [US2] Load allowed categories from classification config (e.g. classification-config.json or existing 002 mechanism) in edit-classifications-page and pass to edit-classifications-table for type and category controls

### Tests for User Story 2

- [ ] T016 [P] [US2] In edit-classifications-page.component.spec.ts add tests for save (persist and refresh), clear classification (transaction removed from list), validation (income/expense without category shows message and does not persist), discard on selection change and on destroy
- [ ] T017 [P] [US2] In edit-classifications-table.component.spec.ts add tests for selection change emission, draft binding, Save and Clear button emission

**Checkpoint**: User Story 2 complete – edit, save, clear, validation, and discard-on-navigate work.

---

## Phase 5: User Story 3 – Find and Navigate Classified Transactions (Priority: P2)

**Goal**: Filter and sort remain correct with many rows; pagination (or virtual scroll) keeps the view responsive; sort order preserved when changing page.

**Independent Test**: With many classified transactions, apply filter and sort, change page, and verify correct subset and order; verify list loads and updates within reasonable time.

### Implementation for User Story 3

- [ ] T018 [US3] Add pagination (e.g. MatPaginator or CDK) to edit-classifications-page: apply to filtered/sorted list with configurable page size (e.g. 25); pass paginated slice to edit-classifications-table in src/app/features/classification/containers/edit-classifications-page/edit-classifications-page.component.ts
- [ ] T019 [US3] Ensure sort and filter are applied before pagination and sort order is preserved when changing page in edit-classifications-page

### Tests for User Story 3

- [ ] T020 [P] [US3] In edit-classifications-page.component.spec.ts add tests for pagination (page size, page change) and that sort order is preserved across page changes

**Checkpoint**: User Story 3 complete – list is usable at scale with pagination.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Navigation from classification feature to edit view; validate against quickstart.

- [ ] T021 [P] Add link or button from classification-page to edit-classifications view (e.g. "Edit classifications" or "Classified transactions") in src/app/features/classification/containers/classification-page/classification-page.component.ts (and template) pointing to route `edit` or `/classification/edit`
- [ ] T022 Run quickstart.md validation: open app, navigate to edit-classifications, verify view list, filter, sort, edit, save, clear, empty state, and discard on navigate per quickstart steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies – can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 (route exists so feature is reachable). Blocks all user story implementation.
- **Phase 3 (US1)**: Depends on Phase 2. Delivers view + filter + sort + empty state.
- **Phase 4 (US2)**: Depends on Phase 3 (same container/table; adds selection, draft, save, clear, validation, discard).
- **Phase 5 (US3)**: Depends on Phase 3/4 (adds pagination to same page).
- **Phase 6 (Polish)**: Depends on Phase 4 at least (link from classification page); T022 depends on full implementation.

### User Story Dependencies

- **US1 (P1)**: After Foundational only. No dependency on US2/US3.
- **US2 (P1)**: After US1 (same container and table; extends with edit/save/clear).
- **US3 (P2)**: After US1 (pagination on same list); can be done in parallel with US2 if pagination is isolated.

### Within Each User Story

- Implementation tasks before or alongside test tasks; tests can be written after components exist (constitution: add tests with the feature).
- US1: Container + table + filter/sort → then tests.
- US2: Selection/draft/save/clear/validation/discard → then tests.
- US3: Pagination → then tests.

### Parallel Opportunities

- T003 and T005 can run in parallel (different folders).
- T009 and T010 can run in parallel (different spec files).
- T016 and T017 can run in parallel.
- T021 is [P] (single file change).
- T020 is [P].

---

## Parallel Example: User Story 1

```text
# After T004–T008, run tests in parallel:
T009: edit-classifications-page.component.spec.ts
T010: edit-classifications-table.component.spec.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001).
2. Complete Phase 2: Foundational (T002).
3. Complete Phase 3: User Story 1 (T003–T010).
4. **STOP and VALIDATE**: Open app, go to edit-classifications, see classified list, filter, sort, empty state.
5. Demo/deploy if ready.

### Incremental Delivery

1. Setup + Foundational → route and clear support ready.
2. Add US1 → view list, filter, sort, empty state (MVP).
3. Add US2 → edit, save, clear, validation, discard on navigate.
4. Add US3 → pagination for scale.
5. Polish → link from classification page, quickstart validation.

### Parallel Team Strategy

- After Phase 2: One developer can do US1 (T003–T010), then US2 (T011–T017), then US3 (T018–T020). Or US1 and US3 (pagination) can overlap if pagination is added without blocking edit behavior.

---

## Notes

- [P] = different files, no shared mutable state dependency.
- [USn] maps task to spec user story for traceability.
- Each user story is independently testable per spec acceptance scenarios.
- Commit after each task or logical group.
- LedgerStorageService.getClassified() and updateTransaction/updateClassification already exist from 002; T002 adds clearClassification for 003 clear behavior.
