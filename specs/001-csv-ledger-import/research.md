# Research: CSV Ledger Import and View

**Feature**: 001-csv-ledger-import  
**Phase**: 0 (Outline & Research)

## 1. Wells Fargo CSV Export Format

**Decision**: Support the actual Wells Fargo CSV export: **five columns**, no header row. Column order: **Date** (0), **Amount** (1), asterisk (2), empty (3), **Description** (4). All fields are double-quoted; amount is a signed number (positive = deposit/inflow, negative = withdrawal/outflow).

**Rationale**: Real exports use this fixed layout; description in column 4 can contain commas and must be parsed as quoted CSV. Limiting to this format keeps the parser simple and matches the spec (“starting with Wells Fargo exports”).

**Alternatives considered**:
- Assume headers always present: rejected; observed exports have no header row.
- Support multiple bank formats in Phase 1: rejected; spec scopes to Wells Fargo first.

**References**: Observed format: `"MM/DD/YYYY","±amount","*","","description"`. No account label in file—account is supplied at import time (user choice or default). See `contracts/wells-fargo-csv.md`.

---

## 2. Local Persistence (Ledger Storage)

**Decision**: Use **IndexedDB** in the browser for storing the transaction ledger.

**Rationale**: Ledger can grow to thousands of rows; Success Criteria allow up to 1,000 rows in under one minute. localStorage has ~5–10 MB limits and is string-only; IndexedDB supports structured data and larger quotas, and allows efficient filtering/search without loading the full set into memory. Aligns with single-user, local-only MVP and constitution (no backend).

**Alternatives considered**:
- localStorage + JSON: simpler but hits size limits and requires full load for filtering; rejected for scale.
- File-based (e.g., save/load a JSON file): adds UX complexity (save location, overwrite); deferred; could be a future export/backup option.
- In-memory only: rejected; FR-004 and SC-005 require persistence across sessions.

**Implementation note**: Use a small wrapper (e.g., `idb` or native `indexedDB`) or a lightweight store service; avoid heavy ORMs. Schema: one object store keyed by a stable transaction id; indexes on date, account, and a composite for deduplication lookups.

---

## 3. Deduplication Key

**Decision**: Treat a transaction as duplicate if it matches an existing record on **date + amount + description + account** (all four).

**Rationale**: Spec and assumptions state “same date, amount, description, account” for identity. This is deterministic, easy to implement, and avoids false positives (e.g., two same-amount payments on same day with different descriptions stay distinct).

**Alternatives considered**:
- Add a bank transaction ID: Wells Fargo CSV does not consistently provide a unique ID in the export; not relied on for Phase 1.
- Hash of row: equivalent for identity but date+amount+description+account is human-readable and debuggable.

---

## 4. Account for Transactions (Wells Fargo CSV)

**Decision**: Wells Fargo CSV does not include an account name/number in the file. **Account** is set at import time: the app **MUST prompt the user** for an account label (user selects or types it (e.g., “Checking”, “Wells Fargo Checking”); the app **MUST NOT** use a fixed default (e.g., “Wells Fargo”) without user input. All rows from that import get the user-provided account value.

**Rationale**: Spec clarification (Session 2026-03-04): user must declare the account name. Single account per file; prompt can be a text field. Keeps the normalized model and satisfies FR-012.

**Alternatives considered**:
- Fixed default "Wells Fargo": rejected per spec; user must be asked.
- Infer account from filename: fragile and not user-transparent; optional enhancement later.
- Leave account empty: rejected; spec and filters require an account identifier.

---

## 5. File Reading and Parsing in the Browser

**Decision**: Use the **FileReader API** (or `File.arrayBuffer()`/`text()`) to read the user-selected file; parse CSV in the main thread (sync or async). For files up to ~1,000 rows, main-thread parsing is acceptable to meet the &lt;1 min goal; chunking or Web Worker can be considered if larger files are supported later.

**Rationale**: No server; file stays on the user’s device. Standard browser APIs are sufficient and align with local-only, no-backend constraint.

**Alternatives considered**:
- Server-side upload: out of scope; constitution and spec require local MVP.
- Web Worker for parsing: optional optimization; not required for 1,000-row target.

---

## 6. Angular 18+ Patterns for This Feature

**Decision**: Use **signals** for ledger state (e.g., list of transactions, filters, search query); **standalone** components and **OnPush**; **functional** guards/resolvers if route guards are needed; **lazy-loaded** route for the ledger feature. Smart container (e.g., ledger-page) loads from LedgerStorageService and calls CsvParserService on file selection; presentational components receive inputs and emit events.

**Rationale**: Matches constitution (Angular 18+, standalone, signals, OnPush, smart/dumb split). No NgModules for new code; @if/@for/@switch in templates.

**Alternatives considered**:
- BehaviorSubject for state: constitution prefers signals for new code; use signals unless complex orchestration is required.
- Eager-loaded ledger route: lazy load is preferred for bundle and consistency with "aggressive lazy-load" principle.

---

## 7. Clear Ledger and Confirmation Dialogs (Clarifications)

**Decision**: (1) **Full wipe**: One action (e.g. "Clear all" / "Clear ledger") that removes every transaction. (2) **Checkbox select**: Each list row has a checkbox; user can select one or more transactions and trigger "Delete selected" to remove only those. (3) **Confirmation**: Before executing either full wipe or delete selected, the app **MUST** show a confirmation dialog (e.g. "Clear all transactions? This cannot be undone." / "Delete N selected transaction(s)?") with explicit Accept and Cancel. Only on Accept are transactions removed; Cancel leaves the ledger unchanged.

**Rationale**: Spec clarifications (Session 2026-03-04): FR-013, FR-014, FR-015. Confirmation reduces accidental data loss; checkboxes allow selective removal without wiping the whole ledger.

**Alternatives considered**:
- No confirmation: rejected; spec requires explicit confirmation for both actions.
- Undo after delete: not in scope for MVP; confirmation is the safety mechanism.
- Delete without checkboxes (e.g. per-row delete only): spec requires both full wipe and checkbox-select delete; both implemented.

---

## 8. Account Name List and Autocomplete (Clarification)

**Decision**: The app keeps a list of **previously used account names** and **prepopulates or suggests** them when the user is prompted for an account name at import. The list can be **derived from distinct account values** already stored in the ledger (no separate persisted “account names” store required). The UI offers these as suggestions via **dropdown, datalist, or autocomplete** so the user can select an existing name or type a new one, reducing typos (FR-017).

**Rationale**: Spec clarification (Session 2026-03-04): keep a list of account names used and prepopulate with old inputs to prevent typos. Deriving from the ledger avoids a second store and keeps the list in sync with actual usage.

**Alternatives considered**:
- No suggestions: rejected; spec requires prepopulating with old inputs.
- Separate persisted “recent account names” store: optional; deriving from ledger is sufficient for MVP.
- Free-text only: rejected; spec requires offering previous names.

---
