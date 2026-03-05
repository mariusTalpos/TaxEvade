# Tasks: Consolidated Classification View

**Input**: Design documents from `/specs/004-consolidate-classification-view/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per project constitution (`.specify/memory/constitution.md`), every component and service MUST have a spec file with smoke and key behavior tests. Test tasks are included for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Angular app: `src/app/` at repository root; tests under `src/app/` alongside components/services (`.spec.ts`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project baseline before feature work

- [ ] T001 Verify project structure and 001/002/003 baseline per plan in specs/004-consolidate-classification-view/plan.md (ledger, classification feature, LedgerStorageService, ClassificationHeuristicsService, classification.routes.ts)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure storage and models support 004; no new stores or entities.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [ ] T002 Verify LedgerStorageService.getAll and updateTransaction support classification and suggestion fields in src/app/core/services/ledger-storage.service.ts (002/003 contract; no code change if already present)

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Automatic Classification on Import (Priority: P1) 🎯 MVP

**Goal**: When the user imports a CSV (001), the system runs rules then optional AI and **applies** the result as classification (type, category, notes) so transactions are already classified after import; user can verify or edit in the single view.

**Independent Test**: Import a CSV into the ledger, then open the classification view; confirm imported transactions already have classification type (and category for income/expense) where rules or AI produced a result; unclassified remain for manual classification.

### Tests for User Story 1

- [ ] T003 [P] [US1] Add ClassificationAiService spec with smoke test and tests for suggest() returning null on timeout/error in src/app/core/services/classification-ai.service.spec.ts
- [ ] T004 [P] [US1] Add AutoClassificationService spec with runAndPersist applying heuristics result and AI fallback in src/app/core/services/auto-classification.service.spec.ts
- [ ] T005 [US1] Add ledger-page tests for auto-classification after addTransactions (runAndPersist called, UI refreshed) in src/app/features/ledger/containers/ledger-page/ledger-page.component.spec.ts

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create ClassificationAiService with suggest(tx): Promise<ClassificationSuggestion | null>, timeout and graceful null on failure in src/app/core/services/classification-ai.service.ts
- [ ] T007 [US1] Create AutoClassificationService with runAndPersist(added: Transaction[]) using heuristics first then AI, apply and persist via LedgerStorageService in src/app/core/services/auto-classification.service.ts
- [ ] T008 [US1] In ledger-page after addTransactions success call AutoClassificationService.runAndPersist(result.addedTransactions) then set importResult and refresh transactions in src/app/features/ledger/containers/ledger-page/ledger-page.component.ts

**Checkpoint**: User Story 1 complete — import applies classifications; single view can show them once US2 is done

---

## Phase 4: User Story 2 - Single View to Review and Edit Classifications (Priority: P1)

**Goal**: One classification view showing all transactions (classified and unclassified) with filter (all | unclassified | by type | category), sort, pagination; inline edit, Save, Clear; source/confidence display; discard on navigate or selection change.

**Independent Test**: After import with auto-classification, open the single classification view; confirm all transactions appear; filter by unclassified/type/category, sort, edit and save one or more, clear classification for one; verify persisted state and that the list is single (no separate edit screen).

### Tests for User Story 2

- [ ] T009 [P] [US2] Update classification-page spec for loading all transactions, filter (all/unclassified/type/category), sort, pagination in src/app/features/classification/containers/classification-page/classification-page.component.spec.ts
- [ ] T010 [P] [US2] Update classification-table spec for display of source/confidence, inline edit, Save, Clear, category validation for income/expense in src/app/features/classification/components/classification-table/classification-table.component.spec.ts

### Implementation for User Story 2

- [ ] T011 [US2] Update classification.routes.ts to single route '' loading ClassificationPageComponent and remove edit route in src/app/features/classification/classification.routes.ts
- [ ] T012 [US2] Refactor classification-page to load all transactions (getAll), add filter state (all | unclassified | by type | by category), sort, pagination, selection, draft in src/app/features/classification/containers/classification-page/classification-page.component.ts
- [ ] T013 [US2] Refactor classification-table to show all transactions with type, category, notes, and suggestionSourceId/suggestionConfidence when present in src/app/features/classification/components/classification-table/classification-table.component.ts
- [ ] T014 [US2] Add inline edit, Save, Clear classification and category validation (income/expense) in classification-table in src/app/features/classification/components/classification-table/classification-table.component.ts
- [ ] T015 [US2] Ensure discard on navigate or selection change without Save (no prompt) and refresh list after save in src/app/features/classification/containers/classification-page/classification-page.component.ts
- [ ] T016 [US2] Remove edit-classifications route and delete or deprecate edit-classifications-page and edit-classifications-table in src/app/features/classification/containers/edit-classifications-page/ and src/app/features/classification/components/edit-classifications-table/

**Checkpoint**: User Stories 1 and 2 complete — single view is the only classification entry point; review and edit workflow in one place

---

## Phase 5: User Story 3 - Reduced Manual Input and Bulk Actions (Priority: P2)

**Goal**: Bulk action (e.g. Accept all high confidence) so the user can confirm many classifications at once; filter to unclassified to focus on remainder.

**Independent Test**: Import a CSV, open single view; use bulk "Accept high confidence" (or similar); verify matching transactions are classified; filter to unclassified and complete remaining manually in the same view.

### Tests for User Story 3

- [ ] T017 [P] [US3] Add tests for bulk accept high confidence in classification-page spec in src/app/features/classification/containers/classification-page/classification-page.component.spec.ts

### Implementation for User Story 3

- [ ] T018 [US3] Add bulk action Accept all high confidence to classification-page (apply classification for filtered list where suggestionConfidence === 'High') in src/app/features/classification/containers/classification-page/classification-page.component.ts

**Checkpoint**: All user stories complete; bulk actions reduce manual steps

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, coverage, and cleanup

- [ ] T019 [P] Run quickstart validation per specs/004-consolidate-classification-view/quickstart.md (import CSV, open classification, verify workflow)
- [ ] T020 [P] Add option-value coverage for at least two classification types (e.g. income and expense) for display and persistence in src/app/features/classification/components/classification-table/classification-table.component.spec.ts
- [ ] T021 Code cleanup: remove dead code, ensure OnPush and signals throughout classification feature in src/app/features/classification/
- [ ] T022 Update app navigation to single Classification entry if edit link existed in src/app/app.component.html or app routes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — implements auto-classification on import
- **User Story 2 (Phase 4)**: Depends on Foundational; benefits from US1 (import already applies classification) but can be tested with existing classified/unclassified data
- **User Story 3 (Phase 5)**: Depends on Phase 4 (single view and suggestion fields)
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on US2/US3. Delivers: apply classification at import.
- **User Story 2 (P1)**: No dependency on US1 for implementation; US1 improves end-to-end flow. Delivers: single view, filter, sort, edit, save, clear.
- **User Story 3 (P2)**: Depends on US2 (single view and table). Delivers: bulk accept high confidence.

### Within Each User Story

- Tests (T003–T005 for US1, T009–T010 for US2, T017 for US3) can be written to fail first, then implementation tasks make them pass.
- US1: ClassificationAiService and AutoClassificationService before wiring in ledger-page.
- US2: Routes and page refactor before table refactor; then remove edit-classifications.

### Parallel Opportunities

- T003, T004 (US1 tests) can run in parallel
- T006 (ClassificationAiService) and T007 (AutoClassificationService) — T007 depends on T006 if it injects AI service; otherwise T006 can be parallel to T007. T007 needs heuristics + storage; T006 is standalone. So T006 [P], T007 after T006 (or parallel if AI is optional and T007 uses only heuristics first). Mark T006 [P].
- T009, T010 (US2 tests) can run in parallel
- T019, T020, T021, T022 (Polish) where marked [P] can run in parallel

---

## Parallel Example: User Story 1

```text
# Tests first (fail), then implement:
T003 + T004 (specs for AI service and auto-classification service)
T006 (ClassificationAiService) — parallel to any other file-only task
T007 (AutoClassificationService) — after T006 if using AI; can start once heuristics contract is clear
T008 (ledger-page wire) — after T007
```

---

## Parallel Example: User Story 2

```text
T009 + T010 (page and table specs)
T011 (routes) then T012 (page refactor) then T013–T015 (table and behavior) then T016 (remove edit)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: User Story 1 (auto-classification on import)  
4. **STOP and VALIDATE**: Import CSV, confirm transactions classified where rules/AI match  
5. Complete Phase 4: User Story 2 (single view, filter, edit, save, clear)  
6. **STOP and VALIDATE**: Full workflow in one view  
7. Deploy/demo

### Incremental Delivery

1. Setup + Foundational → baseline ready  
2. Add US1 → Import applies classifications → Validate  
3. Add US2 → Single view replaces two screens → Validate (MVP)  
4. Add US3 → Bulk accept high confidence → Validate  
5. Polish → Quickstart and option-value coverage

### Task Summary

- **Total task count**: 22  
- **Phase 1**: 1 task  
- **Phase 2**: 1 task  
- **Phase 3 (US1)**: 6 tasks (3 test, 3 implementation)  
- **Phase 4 (US2)**: 8 tasks (2 test, 6 implementation)  
- **Phase 5 (US3)**: 2 tasks (1 test, 1 implementation)  
- **Phase 6 (Polish)**: 4 tasks  

**Suggested MVP scope**: Phases 1–4 (Setup through User Story 2). User Story 3 (bulk actions) and Polish can follow.

---

## Notes

- [P] tasks = different files, no dependencies on same-phase incomplete tasks
- [Story] label maps task to spec user story for traceability
- Each user story phase is independently testable per Independent Test criteria above
- Commit after each task or logical group
- Constitution: option-value coverage (income + expense) in tests; 80%+ on logic-heavy code
