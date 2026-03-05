# Research: Consolidated Classification View

**Feature**: 004-consolidate-classification-view  
**Phase**: 0 (Outline & Research)

## 1. When and Where to Run Auto-Classification (001 Import Hook)

**Decision**: Run **auto-classification immediately after** new transactions are written to the ledger during the **001 CSV import** flow. The hook is the same place as in 002 (ledger-page after `addTransactions`), but instead of only persisting **suggestions** (suggestionType, suggestionCategory, etc.), the system **applies** the result as the initial **classification** (classificationType, classificationCategory, classificationNotes). So after import, each new transaction has classification fields set when rules or AI produced a result; otherwise it remains unclassified for the user to classify in the single view.

**Rationale**: Spec says "when the user imports a CSV into the ledger (feature 001)… each imported transaction receives an initial classification type and, for income/expense, a category, before or as part of the import completion." Applying at import time (not just suggesting) delivers the "verify, don't enter" workflow. Reusing the existing import completion path keeps a single place for "new transactions added" and avoids duplicate logic.

**Alternatives considered**:
- Only store suggestions and require user to "Accept all": Rejected; spec requires transactions to be **already classified** after import so the user only reviews/edits.
- Run auto-classification in a background job after import: Adds complexity; spec implies classification is part of or right after import completion. Sync after import is sufficient for single-user, local MVP.

**Implementation note**: In ledger-page (or a dedicated AutoClassificationService called from ledger-page), after `storage.addTransactions(rows, account)` and receiving `addedTransactions`, for each added transaction: (1) run rules pipeline (existing ClassificationHeuristicsService.suggest), (2) optionally run AI (Ollama) if rules return null or to refine; (3) take the chosen result (first match or AI result) and call `storage.updateTransaction(id, { classificationType, classificationCategory, classificationNotes, suggestionType, suggestionCategory, suggestionConfidence, suggestionSourceId })` so both classification and suggestion metadata are stored. If no result (rules and AI both fail), leave transaction unclassified; it appears in the single view for manual classification.

---

## 2. Rules + AI Pipeline Order and Applying Result

**Decision**: Run **built-in rules first** (existing ClassificationHeuristicsService); if a rule returns a suggestion, use it and **optionally** skip AI to save time and cost. If no rule matches (or product decision: always run AI to refine), call **AI (Ollama)** with transaction description/amount to get a suggested type and category. **Apply the first acceptable result** (rule or AI) as the initial classification: set classificationType, classificationCategory, classificationNotes, and store the same as suggestion* for display (sourceId e.g. "heuristics" or "ollama", confidence). If both rule and AI fail or return nothing, leave the transaction unclassified.

**Rationale**: Spec: "using built-in rules and AI-assisted classification"; user input mentioned "existing rules and then Ollama." Rules are fast and deterministic; AI adds coverage. Applying the first good result keeps import completion time predictable and avoids overwriting a good rule match with AI.

**Alternatives considered**:
- AI only: Rejected; spec and user want "existing rules" first.
- AI first: Rejected; rules are cheaper and faster; use AI when rules don't match.
- Run both and merge: Out of scope for MVP; single result per transaction is sufficient.

**Implementation note**: Pipeline: `heuristics.suggest(tx)` → if non-null, apply and persist, done. If null, call `classificationAiService.suggest(tx)` (or similar); if non-null, apply and persist. Else leave unclassified. Confidence for rule results comes from heuristics; for AI, assign a default (e.g. Medium) or derive from model response if available.

---

## 3. Ollama Integration from Browser

**Decision**: Call Ollama from the Angular app via **HTTP to localhost** (e.g. `http://127.0.0.1:11434`). Use a dedicated service (e.g. `ClassificationAiService`) that uses `HttpClient` or `fetch` to POST to `/api/generate` (or `/api/chat`) with a prompt that includes transaction description and amount and asks for classification type and category. Parse the response and map to ClassificationType and category string. **Graceful degradation**: if the request fails (Ollama not running, CORS, network), treat as "no AI suggestion" and leave the transaction with whatever the rules produced, or unclassified. Do not block import; FR-011 requires import to complete and show transactions as unclassified when auto-classification fails.

**Rationale**: Ollama runs locally; the browser can call it if CORS is configured. Spec and assumptions say "when they are not [available], transactions are left unclassified." So AI is optional and best-effort.

**Alternatives considered**:
- Backend proxy: Adds a server; MVP is local-only; direct browser → Ollama is simpler if CORS is set.
- No AI in MVP: User explicitly asked for "rules and then Ollama"; include AI with fallback.

**Implementation note**: Set `OLLAMA_ORIGINS` (e.g. `http://localhost:4200` or `*`) so Angular dev server can call Ollama. Document in quickstart. Use a small, focused prompt (e.g. "Classify this transaction: description=<…>, amount=<…>. Reply with one line: type category" or JSON) and parse the response. Timeout after a few seconds so import does not hang; on timeout, treat as no AI result.

---

## 4. Single View Consolidation (One List, Filter, Edit)

**Decision**: **One route** (e.g. `/classification`) and **one container** (classification-page) that loads **all** transactions from the ledger (via existing storage.getAll() or a dedicated getForClassificationView()). The list is **filtered** by: all, unclassified only, or by classification type / category. Sort and pagination apply over the filtered list. Each row shows transaction details, current classification (type, category, notes), and when applicable source/confidence (rule or AI). User can **edit** any row (type, category, notes) and **save**; or **clear** classification (transaction becomes unclassified, stays in list, filterable as unclassified). **Bulk actions** (e.g. "Accept all high confidence") apply to filtered subset; implementation-defined. The previous classification-page (unclassified only) and edit-classifications-page (classified only) are **removed**; their behavior is merged into this single view.

**Rationale**: Spec FR-002: "single classification view that shows all transactions relevant to classification (both those already classified and those unclassified). This view MUST replace the need for a separate 'classification' screen and 'edit classification' screen."

**Alternatives considered**:
- Two tabs in one page: Still one view; tabs are an implementation detail. Single list with filter is simpler and matches "one list" in spec.
- Keep two routes but same data: Rejected; spec says one view replaces both.

**Implementation note**: Container holds `transactions = signal<Transaction[]>([])`, `filter = signal<FilterState>({ classificationFilter: 'all' | 'unclassified' | type | category })`, `sort`, `pagination`. Derived signals: filteredList(), sortedList(), paginatedSlice(). Table component receives rows and emits edit/save/clear. Filter control includes "Unclassified" option so user can focus on remaining work. Option-value coverage: test both classified and unclassified display and persistence (constitution).

---

## 5. Displaying Source and Confidence in the Single View

**Decision**: Reuse the existing **suggestion/source metadata** on the transaction. When a transaction was auto-classified at import, the system has stored suggestionSourceId and suggestionConfidence (and suggestionType/suggestionCategory mirror the applied classification). The single view table shows for each row: **source** (e.g. "Rule: transfer-detection" or "AI") and **confidence** (High/Medium/Low) when present. For manually classified or edited rows, source can be "Manual" or omitted. Use the same suggestion-badges component or inline text so the user can see how each classification was derived.

**Rationale**: Spec FR-003: "When a transaction was auto-classified, the system MUST indicate the source (e.g. rule or AI suggestion) and confidence level where available."

**Alternatives considered**:
- Don't show source for applied classification: Rejected; spec requires it.
- New fields for "appliedFromSource": Redundant; we can show the suggestion* fields that were used when applying at import.

**Implementation note**: After applying classification at import, persist both classification* and suggestion* (same values and source/confidence). View reads suggestionSourceId and suggestionConfidence for display; if missing (e.g. manual edit), show "Manual" or nothing.
