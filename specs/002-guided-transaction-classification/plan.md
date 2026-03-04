# Implementation Plan: Guided Transaction Classification

**Branch**: `002-guided-transaction-classification` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-guided-transaction-classification/spec.md`

## Summary

Add a classification flow where unclassified transactions are shown in a **paginated view** with sort and filter. Each row displays a **pre-populated suggestion** (type, category, confidence) from developer-maintained heuristics (merchant, description, regex, transfer-detection, recurrence). The user may edit suggestions then **Submit** (current row only), **Submit All**, or **Submit by confidence** (High only / Medium or higher / Low or higher). Transactions with no suggestion remain unclassified and are excluded from bulk submit. A **separate table view** allows editing existing classifications with filter and sort. Suggestions are generated only on import; no user-defined rules.

## Technical Context

**Language/Version**: TypeScript 5.4+  
**Primary Dependencies**: Angular 18+ (standalone components, signals), Angular Material or CDK (tables, dialogs if needed)  
**Storage**: IndexedDB (browser); extends existing transaction store with classification fields and suggestion metadata; no new stores for rules (built-in heuristics are code/config).  
**Testing**: Jasmine + Angular Testing Library style; TestBed minimal; 80%+ coverage on classification and heuristic logic.  
**Target Platform**: Browser (single-user, local).  
**Project Type**: Web application (Angular SPA).  
**Performance Goals**: Classification view paginates and filters without blocking UI; heuristic evaluation on import completes in under 2 seconds for typical import size (e.g. hundreds of rows).  
**Constraints**: OnPush everywhere; signals for reactive state; no user-triggered suggestion refresh.  
**Scale/Scope**: Single user; ledger scale from 001 (thousands of transactions); classification view paginated (e.g. 25–50 per page).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with `.specify/memory/constitution.md`:

- **Angular**: Angular 18+, standalone components, signals, OnPush, @if/@for/@switch.
- **Types**: strict TypeScript, explicit public APIs; no any.
- **State**: Smart/dumb split; signals/store; lazy routes.
- **Testing**: Specs for every component/service; smoke + key behavior; 80%+ on logic-heavy code.
- **Security**: Sanitize input; typed HTTP; route guards; no frontend-only auth.
- **Scope**: Single-user, local MVP; no multi-tenant or cloud requirement.

**Status**: Compliant. No violations. Feature extends existing ledger (001) with new views and services; same stack and patterns.

**Post–Phase 1**: Re-checked. data-model, contracts, and quickstart align with Angular 18+, standalone, signals, IndexedDB; no new violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-guided-transaction-classification/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Single Angular app; feature lives under `src/app/`:

```text
src/
├── assets/
│   └── config/
│       └── classification-config.json   # Categories and optional heuristic data; manually editable
├── app/
│   ├── core/
│   │   ├── models/           # Transaction (extended), ClassificationType, Confidence, Suggestion
│   │   └── services/
│   │       ├── ledger-storage.service.ts   # extend: classification fields, unclassified query
│   │       ├── classification-heuristics.service.ts  # NEW: run heuristics on transaction(s)
│   │       └── csv-parser.service.ts      # existing; hook suggestion run after import
│   └── features/
│       ├── ledger/            # existing (001)
│       └── classification/   # NEW
│           ├── classification.routes.ts
│           ├── containers/
│           │   ├── classification-page/    # paginated unclassified + Submit / Submit All / by confidence
│           │   └── edit-classifications-page/  # table of classified, filter/sort, edit
│           └── components/
│               ├── classification-table/  # paginated table, sort, filter, inline edit, Submit actions
│               ├── edit-classifications-table/
│               └── suggestion-badges/      # optional: confidence + source heuristic
tests/
├── unit/
└── integration/
```

**Structure Decision**: Extend existing `src/app` layout. New feature `classification` is a lazy-loaded route; core services extended for classification fields and new `classification-heuristics.service`; no backend (IndexedDB only). Categories and optional heuristic data (e.g. merchant lists, regex patterns) live in `src/assets/config/classification-config.json` so they can be updated manually without code changes; the app loads this config at runtime (e.g. via HttpClient or injected at build time).

## Complexity Tracking

> No constitution violations. This section left empty.
