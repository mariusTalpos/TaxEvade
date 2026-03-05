# Implementation Plan: Classified Transactions View

**Branch**: `003-classified-transactions-view` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-classified-transactions-view/spec.md`

## Summary

Add a **dedicated view** where the user can view and modify transactions that already have a classification (type and, for income/expense, category) from feature 002. The view lists only classified transactions with filter (by type, category) and sort (date, amount, type, category). The user can edit type, category, and notes and save; or **clear the classification** so the transaction becomes unclassified (removed from this view and appearing in 002’s classification view). Validation requires category when type is income/expense. Navigating away without saving **discards** in-memory edits (no prompt). Same tech stack as 002: Angular 18+, IndexedDB, existing Transaction model; this feature implements or extends the “edit classifications” view from 002 with 003’s full requirements.

## Technical Context

**Language/Version**: TypeScript 5.4+  
**Primary Dependencies**: Angular 18+ (standalone components, signals), Angular Material or CDK (tables, pagination, sort, filter)  
**Storage**: IndexedDB (browser); reuses existing transaction store and classification fields from 002; no new stores.  
**Testing**: Jasmine + Angular Testing Library style; TestBed minimal; 80%+ coverage on view logic and validation.  
**Target Platform**: Browser (single-user, local).  
**Project Type**: Web application (Angular SPA).  
**Performance Goals**: View loads and filter/sort respond within 2 seconds for typical dataset (e.g. hundreds of classified transactions); pagination or virtual scrolling for large lists.  
**Constraints**: OnPush; signals for reactive state; discard on navigate (no unsaved-edit prompt).  
**Scale/Scope**: Single user; same ledger scale as 001/002; classified list paginated or virtual-scrolled (e.g. 25–50 per page).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with `.specify/memory/constitution.md`:

- **Angular**: Angular 18+, standalone components, signals, OnPush, @if/@for/@switch.
- **Types**: strict TypeScript, explicit public APIs; no any.
- **State**: Smart/dumb split; signals/store; lazy routes.
- **Testing**: Specs for every component/service; smoke + key behavior; 80%+ on logic-heavy code.
- **Security**: Sanitize input; typed HTTP; route guards; no frontend-only auth.
- **Scope**: Single-user, local MVP; no multi-tenant or cloud requirement.

**Status**: Compliant. No violations. Feature extends 002’s edit-classifications concept with 003 spec; same stack and patterns.

**Post–Phase 1**: Re-checked. data-model, contracts, and quickstart align with Angular 18+, standalone, signals, IndexedDB; no new violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-classified-transactions-view/
├── plan.md              # This file
├── research.md           # Phase 0
├── data-model.md         # Phase 1
├── quickstart.md         # Phase 1
├── contracts/            # Phase 1
└── tasks.md              # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends the same Angular app and classification feature as 002. The classified-transactions view is the **edit-classifications** view from 002, fully specified by 003 (clear classification, validation, discard on navigate).

```text
src/
├── app/
│   ├── core/
│   │   ├── models/           # (002) Transaction extended; no new models for 003
│   │   └── services/
│   │       └── ledger-storage.service.ts   # (002) getClassified(), update; 003 uses and may extend for clear
│   └── features/
│       └── classification/    # (002) existing feature
│           ├── classification.routes.ts    # ensure route to classified/edit view
│           ├── containers/
│           │   ├── classification-page/    # (002) unclassified flow
│           │   └── edit-classifications-page/   # 003: classified list, filter, sort, edit, clear, discard on nav
│           └── components/
│               ├── classification-table/   # (002)
│               ├── edit-classifications-table/   # 003: table of classified, inline edit, save, clear
│               └── suggestion-badges/       # (002) optional
tests/
├── unit/
└── integration/
```

**Structure Decision**: No new top-level feature folder. 003 lives under `src/app/features/classification/` as the **edit-classifications** flow (edit-classifications-page, edit-classifications-table). Implement or complete these so they satisfy 003’s spec: list classified only, filter/sort/paginate, edit and save, clear classification (→ unclassified, remove from list), category validation, discard on navigate without prompt.

## Complexity Tracking

> No constitution violations. This section left empty.
