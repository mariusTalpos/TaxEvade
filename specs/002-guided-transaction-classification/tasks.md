# Tasks: Guided Transaction Classification

**Input**: Design documents from `specs/002-guided-transaction-classification/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per constitution, every component and service MUST have a spec file with smoke and key behavior tests. Test tasks are included for each user story.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Single Angular app: `src/app/` at repository root
- Core: `src/app/core/models/`, `src/app/core/services/`
- Feature: `src/app/features/classification/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add classification feature structure and route stub.

- [x] T001 Add classification feature folder and lazy route stub in `src/app/features/classification/classification.routes.ts` with empty component placeholder
- [x] T002 [P] Add nav entry or link to classification feature in app shell (e.g. `src/app/app.routes.ts` or shell component)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, storage extension, and heuristics pipeline so all user stories can use classification data and suggestions.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Add ClassificationType, Confidence, ClassificationSuggestion, and TransactionWithClassification types plus confidenceAtOrAbove(c, threshold) helper in `src/app/core/models/transaction.model.ts` (or new `src/app/core/models/classification.model.ts`) per contracts/classification-transaction.md
- [x] T003b [P] Add classification config file at `src/assets/config/classification-config.json` with at least a `categories` array (and optionally heuristic data such as merchant lists or patterns); add a small service or loader to read the config (e.g. HttpClient) and expose categories (and heuristic data) to ClassificationHeuristicsService and UI; document format in quickstart or code comments
- [x] T004 Extend IndexedDB schema in ledger storage: add classification fields to transaction store and indexes for classificationType and classificationCategory (or isClassified) in `src/app/core/services/ledger-storage.service.ts`
- [x] T005 Extend ledger-storage.service: add getUnclassified(), getClassified(), updateClassification(transactionId, classification) and ensure Transaction type includes classification/suggestion fields in `src/app/core/services/ledger-storage.service.ts`
- [x] T006 Create ClassificationHeuristicsService with suggest(transaction) returning ClassificationSuggestion | null; implement pipeline runner (first match or highest confidence) and at least one stub heuristic so suggestions can be produced; consume categories/heuristic data from classification config in `src/app/core/services/classification-heuristics.service.ts`
- [x] T007 Hook import flow to run heuristics after new transactions are added: in the component or service that performs import (e.g. ledger-page container or the service that calls addTransactions after CSV parse), for each new transaction call classificationHeuristicsService.suggest() and persist suggestion fields on the transaction in the store
- [x] T008 [P] Add unit tests for ClassificationHeuristicsService (smoke + suggest returns null or suggestion, pipeline order) in `src/app/core/services/classification-heuristics.service.spec.ts`
- [x] T009 [P] Add unit tests for ledger-storage getUnclassified, getClassified, updateClassification in `src/app/core/services/ledger-storage.service.spec.ts`

**Checkpoint**: Foundation ready — types, storage, heuristics runner, and import hook in place. User story implementation can begin.

---

## Phase 3: User Story 1 - Classify Unclassified Transactions in a Paginated View (Priority: P1) 🎯 MVP

**Goal**: User sees paginated unclassified list with pre-populated suggestions; can Submit (current row), Submit All, or Submit by confidence; list repopulates after submit.

**Independent Test**: Load ledger with unclassified transactions, open classification view, edit some suggestions, use Submit (current), Submit All, Submit by confidence (e.g. High only); verify saved classifications, no-suggestion rows remain unclassified, list repopulates.

### Tests for User Story 1

- [x] T010 [P] [US1] Add classification-page container spec: smoke and load unclassified list in `src/app/features/classification/containers/classification-page/classification-page.component.spec.ts`
- [x] T011 [P] [US1] Add classification-table component spec: smoke and row selection / display suggestion in `src/app/features/classification/components/classification-table/classification-table.component.spec.ts`

### Implementation for User Story 1

- [x] T012 [US1] Implement classification-page container: load unclassified via ledger-storage, signals for list/pagination/sort/filter/selectedTransactionId, pass to table in `src/app/features/classification/containers/classification-page/classification-page.component.ts`
- [x] T013 [P] [US1] Implement classification-table presentational component: paginated table (e.g. Angular Material Table or CDK), sort, filter, row selection, display transaction + suggestion (type, category, confidence, sourceId), optional inline edit in `src/app/features/classification/components/classification-table/classification-table.component.ts`
- [x] T014 [US1] Add Submit (current) action: validate category required when type is income/expense before calling updateClassification; on Submit click, update only selected transaction with current suggestion/edit via ledger-storage.updateClassification; disable Submit when no row selected in `src/app/features/classification/containers/classification-page/classification-page.component.ts`
- [x] T015 [US1] Add Submit All action: validate category for income/expense for each transaction before update; classify all unclassified transactions across all pages that have a suggestion (or user edit) via ledger-storage; then refresh unclassified list in `src/app/features/classification/containers/classification-page/classification-page.component.ts`
- [x] T016 [US1] Add Submit by confidence buttons (High only, Medium or higher, Low or higher): filter unclassified by confidence threshold using confidenceAtOrAbove helper, update those transactions, then refresh list in `src/app/features/classification/containers/classification-page/classification-page.component.ts`
- [x] T017 [US1] Ensure classification view repopulates after any submit (reload unclassified list or empty state) in `src/app/features/classification/containers/classification-page/classification-page.component.ts`
- [x] T018 [US1] Wire classification route to classification-page and ensure lazy load works in `src/app/features/classification/classification.routes.ts`

**Checkpoint**: User Story 1 complete. Classification view is fully functional and independently testable.

---

## Phase 4: User Story 2 - View Ledger and Edit Classifications in a Table (Priority: P2)

**Goal**: Ledger list shows classification columns; separate edit-classifications table with filter/sort and inline edit/save.

**Independent Test**: Open ledger list, confirm classification columns and suggestion source/confidence; open edit-classifications view, filter/sort, edit and save; verify persistence.

### Tests for User Story 2

- [ ] T019 [P] [US2] Add edit-classifications-page container spec: smoke and load classified list in `src/app/features/classification/containers/edit-classifications-page/edit-classifications-page.component.spec.ts`
- [ ] T020 [P] [US2] Add edit-classifications-table component spec: smoke and edit/save in `src/app/features/classification/components/edit-classifications-table/edit-classifications-table.component.spec.ts`

### Implementation for User Story 2

- [ ] T021 [US2] Extend ledger transaction list (001) to show classification columns: type, category, notes, suggestion source and confidence in `src/app/features/ledger/components/transaction-list/`
- [ ] T022 [US2] Add filter and sort by classification type and by category to ledger list (dropdown or controls) in ledger feature
- [ ] T023 [US2] Implement edit-classifications-page container: load classified transactions via ledger-storage.getClassified(), signals for filter/sort, pass to table in `src/app/features/classification/containers/edit-classifications-page/edit-classifications-page.component.ts`
- [ ] T024 [P] [US2] Implement edit-classifications-table component: table with filter, sort, inline edit of type/category/notes; validate category required when type is income/expense before save; save per row or batch via ledger-storage.updateClassification in `src/app/features/classification/components/edit-classifications-table/edit-classifications-table.component.ts`
- [ ] T025 [US2] Add route and nav link for edit-classifications view in `src/app/features/classification/classification.routes.ts` and app shell

**Checkpoint**: User Story 2 complete. Ledger shows classification; edit-classifications table is functional.

---

## Phase 5: User Story 3 - System Applies Built-In Heuristics (Priority: P2)

**Goal**: All heuristic types (transfer, merchant, description/regex, recurrence) implemented; pipeline order documented; single suggestion per transaction; no user rule UI.

**Independent Test**: Import transactions matching known patterns; verify suggestions with type, category, confidence, source; confirm no rule management UI.

### Tests for User Story 3

- [ ] T026 [P] [US3] Add unit tests for transfer-detection heuristic in `src/app/core/services/classification-heuristics.service.spec.ts`
- [ ] T027 [P] [US3] Add unit tests for merchant and description/regex heuristics in `src/app/core/services/classification-heuristics.service.spec.ts`
- [ ] T028 [P] [US3] Add unit tests for recurrence heuristic and pipeline order (single suggestion, sourceId) in `src/app/core/services/classification-heuristics.service.spec.ts`

### Implementation for User Story 3

- [ ] T029 [P] [US3] Implement transfer-detection heuristic in ClassificationHeuristicsService (e.g. same amount in/out, same day or pattern) in `src/app/core/services/classification-heuristics.service.ts`
- [ ] T030 [P] [US3] Implement merchant-matching heuristic (built-in list or config) in `src/app/core/services/classification-heuristics.service.ts`
- [ ] T031 [P] [US3] Implement description/regex heuristic (pattern → type/category/confidence) in `src/app/core/services/classification-heuristics.service.ts`
- [ ] T032 [P] [US3] Implement recurrence heuristic (e.g. similar amount/description pattern) in `src/app/core/services/classification-heuristics.service.ts`
- [ ] T033 [US3] Wire all heuristics into pipeline with defined order; document order and resolution (first match or highest confidence) in code; ensure single suggestion per transaction in `src/app/core/services/classification-heuristics.service.ts`
- [ ] T034 [US3] Verification: ensure no UI or route for creating/editing/deleting rules exists (rules are developer-maintained only)

**Checkpoint**: User Story 3 complete. All heuristics produce suggestions at import; display already covered in US1/US2.

---

## Phase 6: User Story 4 - Corrections Do Not Create User-Defined Rules (Priority: P3)

**Goal**: Corrections persist only final classification; no separate review outcomes; no user-defined rules created.

**Independent Test**: Correct a suggestion and save; verify only classification fields persisted; confirm no rule-creation UI or storage.

- [ ] T035 [US4] Verification and doc: ensure updateClassification only writes classificationType, classificationCategory, classificationNotes; add brief comment or assertion that no user-defined rules are created in `src/app/core/services/ledger-storage.service.ts` and classification containers
- [ ] T036 [US4] Add or run test that correcting a suggestion does not create any rule records (no new store or rule entities) in `src/app/core/services/ledger-storage.service.spec.ts` or classification-page spec

**Checkpoint**: User Story 4 verified. Scope and storage behavior documented.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality, docs, and validation.

- [ ] T037 [P] Validate quickstart steps: run app, open classification view, use Submit/Submit All/Submit by confidence, open edit-classifications; document any path or step fixes in `specs/002-guided-transaction-classification/quickstart.md`
- [ ] T038 [P] Add suggestion-badges component for confidence and sourceId display (if not inlined in table) in `src/app/features/classification/components/suggestion-badges/suggestion-badges.component.ts` and spec
- [ ] T039 Audit OnPush and signals usage in classification feature components; fix any missing change detection or reactivity
- [ ] T040 Run full test suite and ensure 80%+ coverage on classification and heuristics logic; add tests for edge cases (no selection, no suggestion, empty list)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1. **Blocks** all user stories.
- **Phase 3 (US1)**: Depends on Phase 2. No dependency on US2/US3/US4.
- **Phase 4 (US2)**: Depends on Phase 2. May reuse ledger list from 001; extend with classification columns.
- **Phase 5 (US3)**: Depends on Phase 2 (pipeline runner exists). Can be done in parallel with US1/US2 after Phase 2.
- **Phase 6 (US4)**: Depends on US1/US2 (corrections happen there). Verification only.
- **Phase 7 (Polish)**: Depends on completion of desired user stories.

### User Story Dependencies

- **US1 (P1)**: After Phase 2. Independent. **MVP**.
- **US2 (P2)**: After Phase 2. Independent; extends ledger from 001.
- **US3 (P2)**: After Phase 2. Feeds suggestions already shown in US1/US2; can parallel with US1/US2.
- **US4 (P3)**: Verification; no new code beyond ensuring no rule creation.

### Within Each User Story

- Tests before or alongside implementation (constitution).
- Container (smart) before or with table (presentational).
- Submit actions depend on container and storage API.

### Parallel Opportunities

- T002, T003, T003b, T008, T009 can run in parallel where marked [P].
- After Phase 2: US1, US2, US3 can proceed in parallel (different developers).
- T013, T024, T029–T032 are parallelizable within their phases.

---

## Parallel Example: User Story 1

```text
# After Phase 2, US1 tests in parallel:
T010: classification-page.component.spec.ts
T011: classification-table.component.spec.ts

# US1 implementation (T012 then T013 can overlap with T014–T017 by different dev):
T012: classification-page container
T013: classification-table component
T014–T017: Submit actions and repopulate
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: User Story 1  
4. **STOP and VALIDATE**: Run independent test (quickstart classification view, Submit / Submit All / by confidence)  
5. Demo/deploy if ready  

### Incremental Delivery

1. Setup + Foundational → foundation ready  
2. Add US1 → test independently → **MVP**  
3. Add US2 → ledger columns + edit-classifications table → test  
4. Add US3 → all heuristics → test  
5. US4 verification + Polish  

### Parallel Team Strategy

- After Phase 2: Dev A — US1 (classification view); Dev B — US2 (ledger + edit table); Dev C — US3 (heuristics).  
- US4 and Polish after US1–US3.

---

## Notes

- [P] = different files, no blocking dependency.
- [USn] = task belongs to that user story for traceability.
- Each story is independently testable per spec.
- Commit after each task or logical group.
- Paths assume repo root = TaxEvade with `src/app/`; adjust if your layout differs.
