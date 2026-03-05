# Implementation Plan: Consolidated Classification View

**Branch**: `004-consolidate-classification-view` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/004-consolidate-classification-view/spec.md`

## Summary

Consolidate the classification and edit-classification flows into a single view. When the user imports a CSV (feature 001), the system runs **auto-classification** (built-in rules first, then Ollama when available) and **applies** the result as each transaction’s initial classification so the user can verify and correct instead of entering from scratch. The single classification view shows all transactions (classified and unclassified), with filter, sort, pagination, inline edit, save, and clear. **Auto-classification SHOULD run with bounded parallelism** so large imports (e.g. hundreds of rows) complete in less wall-clock time than strictly sequential processing (FR-014, SC-006).

## Technical Context

**Language/Version**: TypeScript 5.5+, Angular 18+  
**Primary Dependencies**: Angular 18 (standalone components, signals, router, HttpClient), IndexedDB (browser), Ollama (local HTTP for AI)  
**Storage**: IndexedDB (transaction store with classification/suggestion fields); no new stores for 004  
**Testing**: Jasmine + Angular TestBed; Karma; 80%+ coverage on logic-heavy code; option-value coverage for classification types  
**Target Platform**: Browser (local single-user); Angular dev server (e.g. localhost:4200)  
**Project Type**: Web application (Angular SPA)  
**Performance Goals**: Single view filter/sort &lt; 2s (SC-005); large-import classification time reduced via bounded parallelism (SC-006)  
**Constraints**: Strict TypeScript; OnPush; no blocking import on AI failure; concurrency limit for classification is implementation-defined (e.g. to avoid overloading Ollama or the browser)  
**Scale/Scope**: Single user; typical batch hundreds of transactions; one classification view and one ledger view

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with `.specify/memory/constitution.md`:

- **Angular**: Angular 18+, standalone components, signals, OnPush, @if/@for/@switch.
- **Types**: strict TypeScript, explicit public APIs; no any.
- **State**: Smart/dumb split; signals/store; lazy routes.
- **Testing**: Specs for every component/service; smoke + key behavior; 80%+ on logic-heavy code.
- **Security**: Sanitize input; typed HTTP; route guards; no frontend-only auth.
- **Scope**: Single-user, local MVP; no multi-tenant or cloud requirement.

## Project Structure

### Documentation (this feature)

```text
specs/004-consolidate-classification-view/
├── plan.md              # This file
├── research.md          # Phase 0 (incl. parallel classification)
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
│   └── consolidated-classification-view.md
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── app.component.ts
│   ├── app.config.ts
│   ├── app.routes.ts
│   ├── core/
│   │   ├── components/
│   │   │   └── ai-status-indicator/
│   │   ├── models/
│   │   │   ├── transaction.ts
│   │   │   └── classification.model.ts
│   │   └── services/
│   │       ├── ledger-storage.service.ts
│   │       ├── classification-heuristics.service.ts
│   │       ├── classification-ai.service.ts
│   │       ├── classification-config.service.ts
│   │       ├── csv-parser.service.ts
│   │       └── auto-classification.service.ts
│   └── features/
│       ├── classification/
│       │   ├── classification.routes.ts
│       │   ├── containers/
│       │   │   └── classification-page/
│       │   └── components/
│       │       └── classification-table/
│       └── ledger/
│           ├── ledger.routes.ts
│           ├── containers/
│           │   └── ledger-page/
│           └── components/
│               ├── transaction-list/
│               ├── transaction-filters/
│               ├── import-file-picker/
│               ├── account-name-input/
│               └── confirmation-dialog/
```

**Structure Decision**: Single Angular app under `src/app/`; core services and models; feature-based routing (ledger, classification). Auto-classification runs in core (AutoClassificationService) and is invoked from ledger-page after addTransactions. Parallel classification (FR-014) is implemented in AutoClassificationService with bounded concurrency.

## Complexity Tracking

No constitution violations. (Empty table optional.)
