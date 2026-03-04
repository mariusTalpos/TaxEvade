# Implementation Plan: CSV Ledger Import and View (Clarifications)

**Branch**: `001-csv-ledger-import` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-csv-ledger-import/spec.md`, including Session 2026-03-04 clarifications.

## Summary

This plan addresses the **clarifications** added to the feature: (1) **Account name**—the app must prompt the user for an account name at import time and must not use a fixed default (e.g. "Wells Fargo"). (2) **Account name autocomplete**—keep a list of previously used account names and prepopulate or suggest them when prompting (e.g. dropdown, datalist, or autocomplete) so the user can pick an existing name or type a new one, reducing typos (FR-017). (3) **Clear ledger**—support full wipe and checkbox-select delete, with (4) **Confirmation**—explicit user confirmation required before full wipe or delete selected. Implementation builds on the existing Angular 18+ ledger feature: add account-name step with autocomplete/suggestions in the import flow, add clear-all and delete-selected actions with confirmation dialogs, and persist removals in IndexedDB.

## Technical Context

**Language/Version**: TypeScript 5.4+  
**Primary Dependencies**: Angular 18+ (standalone components, signals), Angular Material or CDK for dialogs (if used)  
**Storage**: IndexedDB (browser); transaction store with indexes on date, account, and composite for deduplication  
**Testing**: Jasmine + Angular Testing Library style; 80%+ coverage on logic-heavy code  
**Target Platform**: Browser (local single-user app)  
**Project Type**: Web application (frontend-only; no backend for MVP)  
**Performance Goals**: Import up to 1,000 rows in under one minute; list view responsive with pagination  
**Constraints**: Single-user, local-only; no cloud; strict TypeScript; OnPush change detection  
**Scale/Scope**: Single ledger; typical export sizes (hundreds to low thousands of transactions)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with `.specify/memory/constitution.md`:

- **Angular**: Angular 18+, standalone components, signals, OnPush, @if/@for/@switch. ✅
- **Types**: strict TypeScript, explicit public APIs; no any. ✅
- **State**: Smart/dumb split; signals/store; lazy routes. ✅
- **Testing**: Specs for every component/service; smoke + key behavior; 80%+ on logic-heavy code. ✅
- **Security**: Sanitize input; typed HTTP; route guards; no frontend-only auth. ✅ (Local-only; input sanitization for account name and display.)
- **Scope**: Single-user, local MVP; no multi-tenant or cloud requirement. ✅

**Result**: No violations. Plan aligns with constitution.

## Project Structure

### Documentation (this feature)

```text
specs/001-csv-ledger-import/
├── plan.md              # This file
├── research.md          # Phase 0 (includes account autocomplete)
├── data-model.md        # Phase 1 (already includes Delete operations)
├── quickstart.md        # Phase 1 (account prompt + autocomplete + clear flows)
├── contracts/           # Phase 1 (account from user input only)
└── tasks.md             # Phase 2 output (/speckit.tasks - not created by this command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── core/
│   │   ├── models/           # Transaction, ImportResult
│   │   └── services/         # LedgerStorageService, CsvParserService
│   └── features/
│       └── ledger/
│           ├── ledger.routes.ts
│           ├── containers/
│           │   └── ledger-page/    # Smart component: import, clear, delete, list
│           └── components/         # transaction-list (with checkboxes), filters, import-file-picker, account-name-input (with autocomplete), dialogs
tests/
├── unit/                   # Component and service specs
└── (integration/ as needed)
```

**Structure Decision**: Single frontend app at repo root. Ledger is a lazy-loaded feature under `src/app/features/ledger`. Containers own state and storage; presentational components receive inputs and emit events. New work: account-name input **with autocomplete/suggestions** (list derived from distinct account values in ledger) in import flow; confirmation dialog(s); transaction list checkboxes and delete-selected/full-wipe actions.

## Phase 0: Research (Clarifications)

Research and decisions for the clarified behavior are consolidated in `research.md`:

- **Account name at import**: No fixed default; user must be prompted and provide a value (or explicitly choose a suggested value). See research §4.
- **Account name autocomplete**: Keep a list of previously used account names (e.g. derived from distinct `account` values in the ledger) and offer them when prompting—dropdown, datalist, or autocomplete—so the user can select or type; reduces typos (FR-017). See research §8.
- **Confirmation dialogs**: Full wipe and delete selected both require an explicit confirmation step (e.g. Angular Material Dialog or CDK dialog) with accept/cancel; no auto-execute. See research §7.
- **Clear/delete UX**: Full wipe clears all transactions; checkbox select allows selecting a subset and deleting only those. List shows checkboxes; toolbar or actions for "Clear all" and "Delete selected". See research §7.

## Phase 1: Design & Contracts

- **data-model.md**: Already includes Ledger Delete operations (full wipe and selected subset). No new entity for account list: list is derived from distinct Transaction.account values (or optional dedicated query/index). No change required unless documenting derived list.
- **contracts**: `wells-fargo-csv.md` and `normalized-transaction.md` updated so that account is set from **user input only** (required; no fixed default). Account name input contract: accepts free text and optional list of suggestions (previously used account names).
- **quickstart.md**: First-time import steps updated to require account name entry **with previous names offered as suggestions**; section for clearing ledger (full wipe and delete selected with confirmation).

## Phase 2: Implementation (Task Breakdown)

*Filled by `/speckit.tasks`.*

- Implement account name prompt in import flow (before or with file pick; no "Wells Fargo" default).
- **Implement account name autocomplete**: Obtain list of previously used account names (e.g. distinct account values from LedgerStorageService); add UI control (dropdown, datalist, or autocomplete) that suggests these when the user is prompted for account name; allow selecting a suggestion or typing a new name.
- Add full-wipe action with confirmation dialog; wire to LedgerStorageService clear-all.
- Add transaction list row checkboxes and "Delete selected" with confirmation dialog; wire to LedgerStorageService delete-by-ids.
- Ensure UI and persistence update immediately after confirm; add/update tests for new components and storage methods.

## Complexity Tracking

> No constitution violations. Table left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                   |
