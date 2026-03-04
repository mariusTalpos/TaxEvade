# Research: Guided Transaction Classification

**Feature**: 002-guided-transaction-classification  
**Phase**: 0 (Outline & Research)

## 1. Pagination, Sort, and Filter in Angular (Classification View)

**Decision**: Use **client-side pagination, sort, and filter** over the unclassified-transactions list. The classification view loads unclassified transactions (from IndexedDB via ledger storage service), holds them in a **signal** (or derived signals for filtered/sorted slice), and uses **Angular Material Table** (or CDK table) with `MatPaginator`, `MatSort`, and filter controls. Page size is configurable (e.g. 25 or 50); sort and filter are in-memory over the current result set.

**Rationale**: Spec requires "paginated view of all unclassified transactions with sort and filter." Single-user, local data; total unclassified count is bounded by ledger size. Client-side avoids extra IndexedDB query patterns for "page N" and keeps reactivity simple with signals. Angular Material Table is the standard in Angular 18+ for tables with pagination/sort; aligns with constitution (Angular 18+, standalone).

**Alternatives considered**:
- Server-side pagination: N/A; no server; IndexedDB is local.
- Virtual scrolling only (no pages): Spec explicitly asks for "paginated view" and "Submit All" across "all pages"; pagination is required.
- Custom table without Material: More work; Material Table is well-supported and accessible.

**Implementation note**: Container (smart) component holds `unclassifiedTransactions = signal<TransactionWithSuggestion[]>([])`, `filter = signal<FilterState>({...})`, `sort = signal<SortState>({...})`. Derived signals compute `filteredAndSorted()` and `paginatedSlice()`. Presentational table receives `paginatedSlice()` and paginator/sort/filter events; OnPush. "Currently displayed transaction" for Submit = the row currently selected or focused (single selection), or the row at current page + index; define consistently (e.g. selected row id).

---

## 2. Confidence Ordering and Submit-by-Confidence Semantics

**Decision**: Confidence has a **total order**: **High > Medium > Low**. "High only" = confidence exactly High. "Medium or higher" = Medium or High. "Low or higher" = Low, Medium, or High (i.e. any suggestion). Ordinal labels are stored and compared via an enum or ordered type (e.g. `Confidence.High`, `Confidence.Medium`, `Confidence.Low`) so that "at or above that confidence" is a simple comparison.

**Rationale**: Spec says "Submit by confidence: High only, Medium or higher, Low or higher" and "only transactions with a suggestion at or above that confidence are submitted." A single ordered type avoids ambiguity and keeps UI and service logic consistent.

**Alternatives considered**:
- Numeric confidence (0–1) with thresholds: Spec clarified ordinal labels only; numeric is not required.
- Free-text labels: Rejected; ordering would be undefined.

**Implementation note**: `type Confidence = 'High' | 'Medium' | 'Low'`. Helper `confidenceAtOrAbove(c: Confidence, threshold: 'High' | 'Medium' | 'Low'): boolean` for Submit-by-confidence filtering. When multiple heuristics match, "highest confidence" can be used to pick one suggestion (see Research 3).

---

## 3. Heuristic Pipeline and Single-Suggestion Resolution

**Decision**: Built-in heuristics are implemented as a **pipeline** (ordered list of heuristic functions). Each heuristic takes a transaction and returns either a **suggestion** (type, category if income/expense, confidence, source id/name) or null. The pipeline runs in **fixed order**; the **first non-null suggestion** is used. Optionally, run all heuristics and choose by **highest confidence** (High > Medium > Low) to satisfy "at most one suggestion per transaction" and "consistent, defined way" (FR-009). Document the order and resolution rule so behavior is predictable.

**Rationale**: Spec: "at most one suggestion (one type, one category if applicable, one confidence, one source) is produced per transaction" and "multiple heuristics match → single suggestion (e.g. by defined priority or highest confidence)." First-match is simpler; highest-confidence gives better quality when several match. Choosing **first match** keeps implementation and debugging straightforward; if needed later, switch to "highest confidence wins."

**Alternatives considered**:
- All heuristics run and combine: Rejected; spec requires one suggestion per transaction.
- Random or last match: Rejected; not deterministic or user-friendly.

**Implementation note**: `ClassificationHeuristicsService.suggest(transaction): Suggestion | null`. Internal list: e.g. transfer detection → merchant matchers → description regex → recurrence. Each returns `{ type, category?, confidence, sourceId }` or null. Return first non-null, or implement "highest confidence wins" by collecting all and reducing. Store `sourceId` (e.g. heuristic name) and confidence on the suggestion for display.

---

## 4. When and Where to Run Suggestions (Import Hook)

**Decision**: Run the suggestion pipeline **immediately after** new transactions are written to the ledger during **import**. The import flow (001) already parses CSV, deduplicates, and writes to IndexedDB. Extend that flow: after each successful insert (or batch insert), for each new transaction call the classification heuristics service and **persist the suggestion** (or a "pending" suggestion) with the transaction so the classification view can show it without re-running. Suggestions are **generated only when new transactions are added** (e.g. on import); no user-triggered refresh.

**Rationale**: Spec: "Suggestions are generated only when new transactions are added to the ledger (e.g. on import)." Running at import time keeps the classification view read-only for suggestion computation and avoids duplicate work. Storing the suggestion (or fields derived from it) on or alongside the transaction allows the UI to display "pre-populated suggestion" and confidence without recomputation.

**Alternatives considered**:
- Compute suggestions on-demand when opening the classification view: Rejected; spec says only on new transactions (import).
- Background worker: Overkill for single-user, local; sync at import is sufficient.
- Separate "suggestions" store keyed by transaction id: Possible; alternatively store suggestion result on the transaction record (classificationSuggestion, confidence, suggestionSourceId) so one read gets both.

**Implementation note**: Ledger storage or import pipeline: after `addTransactions(newTx[])`, for each new transaction run `heuristics.suggest(tx)`, attach suggestion to the transaction (or write to a suggestion cache/store), then persist. Transaction entity extended with optional suggestion fields (see data-model.md).

---

## 5. "Currently Displayed" Transaction for Submit

**Decision**: **Submit** applies to the **single transaction currently selected** in the classification table (e.g. selected row). If no row is selected, Submit is either disabled or applies to the first row on the current page (document consistently). Recommendation: **require selection** so the user always knows which transaction will be updated; disable Submit when selection is empty.

**Rationale**: Spec: "Submit will only update the transaction currently displayed" to avoid confusion. Explicit selection is clearer than "focused" and works well with table UX (click row to select).

**Alternatives considered**:
- Submit applies to first row on page: Possible but less clear; selection is more explicit.
- Submit applies to all visible on page: That would be a different action (e.g. "Submit page"); spec says only current.

**Implementation note**: Container holds `selectedTransactionId = signal<string | null>(null)`. Submit button calls `classifyOne(selectedTransactionId())`; if null, button disabled or no-op. Table component emits selection change to parent.
