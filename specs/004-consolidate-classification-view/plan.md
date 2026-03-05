# Implementation Plan: Consolidated Classification View

**Branch**: `004-consolidate-classification-view` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/004-consolidate-classification-view/spec.md`

## Summary

Consolidate the classification flow into a **single view** that replaces both the unclassified (002) and edit-classifications (003) screens. When the user imports a CSV via feature 001, the system **auto-classifies** each imported transaction using built-in rules and AI-assisted classification (e.g. Ollama), persisting type and category so the user sees transactions already classified. The single classification view shows **all** transactions (classified and unclassified) with filter, sort, pagination; the user reviews or edits in one place. No separate "classify" then "review" steps—import completes with classifications applied, then user verifies or corrects in the unified view.

## Technical Context

**Language/Version**: TypeScript 5.4+  
**Primary Dependencies**: Angular 18+ (standalone components, signals), Angular Material or CDK (tables, pagination, sort, filter)  
**Storage**: IndexedDB (browser); reuses existing transaction store and classification fields from 002/003; no new stores.  
**Testing**: Jasmine + Angular Testing Library style; TestBed minimal; 80%+ coverage on auto-classification pipeline and consolidated view logic.  
**Target Platform**: Browser (single-user, local).  
**Project Type**: Web application (Angular SPA).  
**Performance Goals**: Auto-classification on import completes within a reasonable time (e.g. under 10 seconds for hundreds of rows; AI calls may be batched or async). Single view loads and filter/sort respond within 2 seconds for typical dataset.  
**Constraints**: OnPush; signals for reactive state; discard on navigate without save. AI (Ollama) may run locally; browser calls localhost API or app remains usable when AI unavailable (transactions left unclassified).  
**Scale/Scope**: Single user; same ledger scale as 001/002/003; one classification view listing all transactions with pagination or virtual scrolling.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with `.specify/memory/constitution.md`:

- **Angular**: Angular 18+, standalone components, signals, OnPush, @if/@for/@switch.
- **Types**: strict TypeScript, explicit public APIs; no any.
- **State**: Smart/dumb split; signals/store; lazy routes.
- **Testing**: Specs for every component/service; smoke + key behavior; 80%+ on logic-heavy code.
- **Security**: Sanitize input; typed HTTP; route guards; no frontend-only auth.
- **Scope**: Single-user, local MVP; no multi-tenant or cloud requirement.

**Status**: Compliant. No violations. Feature extends 002/003 with auto-apply on import and one consolidated view; same stack and patterns. AI (Ollama) integration is local (localhost); no cloud auth.

**Post–Phase 1**: Re-checked. data-model, contracts, and quickstart align with Angular 18+, standalone, signals, IndexedDB; no new violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-consolidate-classification-view/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends the same Angular app. Classification feature is **refactored** into one consolidated view; 001 import flow is **extended** to run auto-classification (rules + AI) and persist classifications.

```text
src/
├── app/
│   ├── core/
│   │   ├── models/           # (002) Transaction extended; no new models for 004
│   │   └── services/
│   │       ├── ledger-storage.service.ts      # (002/003) existing; 004 uses getAll for single view
│   │       ├── classification-heuristics.service.ts  # (002) existing; 004 runs first in pipeline
│   │       ├── classification-ai.service.ts # NEW (optional): call Ollama/local AI for suggestion
│   │       └── csv-parser.service.ts          # (001) unchanged
│   └── features/
│       ├── ledger/
│       │   └── containers/
│       │       └── ledger-page/               # 004: after addTransactions, run auto-classify and persist
│       └── classification/
│           ├── classification.routes.ts      # 004: single route to consolidated view (replace '', 'edit')
│           ├── containers/
│           │   └── classification-page/      # 004: single container – all transactions, filter (incl. unclassified), sort, paginate, edit, save, clear, bulk
│           │   # REMOVE or deprecate: edit-classifications-page (merged into classification-page)
│           └── components/
│               ├── classification-table/    # 004: extend to show all tx, classified + unclassified; source/confidence; inline edit; save; clear
│               # REMOVE or repurpose: edit-classifications-table (merged into classification-table)
│               └── suggestion-badges/       # (002) keep for source/confidence display
tests/
├── unit/
└── integration/
```

**Structure Decision**: One classification route (e.g. `/classification`) loads the consolidated page. The previous `classification-page` (unclassified only) and `edit-classifications-page` (classified only) are replaced by a single **classification-page** that lists all transactions with a filter for "all | unclassified | by type | by category". Auto-classification runs in the ledger import path (ledger-page or a dedicated service called after `addTransactions`): run heuristics then AI (if available), then **persist** the chosen result as `classificationType` and `classificationCategory` (and notes if any) so the single view shows "already classified" and user only verifies or edits.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |
