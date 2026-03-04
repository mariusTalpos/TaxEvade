# Implementation Plan: CSV Ledger Import and View

**Branch**: `001-csv-ledger-import` | **Date**: 2025-03-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-csv-ledger-import/spec.md`

## Summary

Single-user Angular app that lets the user select a Wells Fargo CSV, parses and normalizes rows into a standard transaction model (date, description, amount, inflow/outflow, account), deduplicates on re-import, and shows a searchable, filterable ledger. Data is persisted locally (IndexedDB). No tax logic in this phase.

## Technical Context

**Language/Version**: TypeScript 5.4+ (Angular 18+)  
**Primary Dependencies**: Angular 18+ (standalone components, signals, Angular CLI or Nx)  
**Storage**: IndexedDB (browser) for ledger persistence; FileReader API for CSV ingestion  
**Testing**: Jasmine + Angular Testing Library; Karma or Jest per project setup  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge); local-only, no server  
**Project Type**: Web application (Angular SPA)  
**Performance Goals**: Import ≤1 min for 1,000 rows; search/filter result update with no perceptible delay for typical ledger size  
**Constraints**: Single-user, local-only MVP; no backend or cloud; strict TypeScript, OnPush, signals  
**Scale/Scope**: One user; ledger on the order of thousands of transactions; Wells Fargo CSV only in this phase  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with `.specify/memory/constitution.md`:

- **Angular**: Angular 18+, standalone components, signals, OnPush, @if/@for/@switch.
- **Types**: strict TypeScript, explicit public APIs; no any.
- **State**: Smart/dumb split; signals/store; lazy routes.
- **Testing**: Specs for every component/service; smoke + key behavior; 80%+ on logic-heavy code.
- **Security**: Sanitize input; typed HTTP; route guards; no frontend-only auth.
- **Scope**: Single-user, local MVP; no multi-tenant or cloud requirement.

**Status**: No violations. Plan uses Angular 18+ SPA, local storage, and in-scope MVP. Re-checked after Phase 1 design: data model and contracts remain aligned (no NgModules, explicit types, IndexedDB + FileReader only).

## Project Structure

### Documentation (this feature)

```text
specs/001-csv-ledger-import/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── app.config.ts
│   ├── app.routes.ts
│   ├── core/                    # Singletons, guards, interceptors
│   │   ├── services/
│   │   │   ├── ledger-storage.service.ts   # IndexedDB read/write
│   │   │   └── csv-parser.service.ts       # Wells Fargo parse + normalize
│   │   └── models/                         # Shared types (Transaction, etc.)
│   └── features/
│       └── ledger/
│           ├── ledger.routes.ts
│           ├── components/                 # Presentational
│           │   ├── transaction-list/
│           │   ├── transaction-filters/
│           │   └── import-file-picker/
│           └── containers/                 # Smart: load data, handle import
│               └── ledger-page/
├── index.html
├── main.ts
└── styles/

tests/ or src/app/**/*.spec.ts
├── unit/ (or co-located .spec.ts)
└── integration/ (if needed)
```

**Structure Decision**: Single Angular app under `src/app/`. Feature `ledger` lives in `features/ledger/` with core services and models shared. Aligns with constitution (standalone, lazy-loaded feature route, smart/dumb components).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                    |
