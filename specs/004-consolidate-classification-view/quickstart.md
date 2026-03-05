# Quickstart: Consolidated Classification View

**Feature**: 004-consolidate-classification-view  
**Branch**: `004-consolidate-classification-view`

## Prerequisites

- 001 (CSV ledger import), 002 (guided transaction classification), and 003 (classified transactions view) implemented: ledger with IndexedDB, transactions with classification and suggestion fields, heuristics service.
- For **AI-assisted** classification: Ollama installed and running, with CORS configured and the `llama2` model pulled (see **Ollama setup** below).

### Ollama setup (Windows)

1. **Install Ollama** (if not already installed):
   ```powershell
   irm https://ollama.com/install.ps1 | iex
   ```
   Wait for the installer to finish. You may need to log off and back on (or restart) for `ollama` to be in your PATH.

2. **Configure CORS** so the Angular app (http://localhost:4200) can call Ollama:
   - **User env var** (persists across sessions):  
     `OLLAMA_ORIGINS` = `http://localhost:4200`  
     (Already set for your user account if you ran the project’s setup.)
   - **Current session only** (PowerShell):  
     `$env:OLLAMA_ORIGINS = "http://localhost:4200"`
   - Restart Ollama after changing the variable (quit from system tray if running, then start again).

3. **Start Ollama** (if not running): open the Ollama app from the Start menu, or run:
   ```powershell
   ollama serve
   ```

4. **Pull the model** used by the app (required for AI suggestions):
   ```powershell
   ollama pull llama2
   ```

Without Ollama running or with CORS not set, import still works; rules-based classification runs and AI is skipped for that session.

## Run the App

From the repository root:

```bash
npm install
npm start
```

`npm start` runs **Ollama** (with CORS for http://localhost:4200) and **Angular** together. Open http://localhost:4200 when the dev server is ready.

- To run only the app (no Ollama): `npm run start:app`
- If Ollama is not in your PATH yet, start it separately (e.g. from the Start menu or run `ollama serve` in a terminal where it’s available), then run `npm run start:app`

## Workflow

1. **Import CSV (001)**: On the Ledger page, enter an account name and import a CSV. After import, **auto-classification** runs (with bounded parallelism for large batches): built-in rules and (if available) Ollama assign type and category to each new transaction. Transactions appear in the ledger and in the classification view already classified where the system could determine a result.
2. **Single classification view**: Navigate to **Classification** (e.g. `/classification`). You see **one list** of all transactions (classified and unclassified). Filter by "All", "Unclassified", or by type/category. Sort and paginate. Each row shows current classification and, when applicable, source (e.g. Rule, AI) and confidence.
3. **Review and edit**: Select a row, change type, category, or notes if needed, then **Save**. Or **clear** classification to make a transaction unclassified; it stays in the list and can be re-classified in the same view. Navigate away without saving to discard in-memory edits (no prompt).
4. **Bulk actions** (if implemented): Use "Accept all high confidence" or similar to confirm many classifications at once; then focus on the remainder.

## Run Tests

```bash
ng test
```

Or with coverage:

```bash
ng test --code-coverage
```

Target: 80%+ coverage on auto-classification pipeline (rules + AI fallback), consolidated classification container and table (filter, sort, edit, save, clear, validation, discard on navigate). Option-value coverage: verify at least two classification types (e.g. income and expense) for display and persistence.

## Feature Location

- **Routes**: `src/app/features/classification/classification.routes.ts` — single route to the consolidated classification page (replaces separate '' and 'edit' routes).
- **Containers**: `src/app/features/classification/containers/classification-page/` — loads all transactions, filter (all | unclassified | type | category), sort, pagination, selection, draft, save, clear, bulk actions.
- **Components**: `src/app/features/classification/components/classification-table/` — table of all transactions with inline edit, source/confidence display, Save and Clear. Suggestion-badges (or equivalent) for source/confidence.
- **Core services**: `src/app/core/services/ledger-storage.service.ts` (getAll, updateTransaction); `classification-heuristics.service.ts` (rules); optional `classification-ai.service.ts` (Ollama). **Import hook**: ledger-page (or a dedicated service) runs auto-classification after addTransactions and persists classification + suggestion fields.

## Design Artifacts

- **Spec**: [spec.md](../spec.md)
- **Plan**: [plan.md](../plan.md)
- **Research**: [research.md](../research.md)
- **Data model**: [data-model.md](../data-model.md)
- **Contracts**: [contracts/](../contracts/)
