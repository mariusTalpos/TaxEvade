<!--
Sync Impact Report
- Version change: (none) → 1.0.0 (initial adoption)
- Modified principles: N/A (full replacement from template placeholders)
- Added sections: Purpose, MVP Scope & Deployment, Development Workflow
- Removed sections: N/A
- Templates: plan-template.md ✅ updated; spec-template.md ✅ no change needed; tasks-template.md ✅ updated; commands/*.md N/A (none present)
- Follow-up TODOs: None
-->

# TaxEvade Constitution

Core non-negotiables for every spec, plan, task, and implementation.
MUST/SHOULD/MAY per RFC 2119. AI agents (e.g. Cursor, Copilot) MUST respect this.

## 1. Purpose

This constitution defines the architectural and quality baseline for the TaxEvade application: a **quarterly estimated tax assistant** for single-user, local use. It overrides any conflicting generated content from /speckit.* commands.

## 2. Core Principles (Non-Negotiables)

### 1. Modern Angular Only

- Target Angular 18+ with standalone components (no NgModules unless legacy interop required).
- Use signals + input()/output() for reactivity; avoid BehaviorSubject for new code unless complex state orchestration.
- Prefer functional guards, resolvers, and interceptors over class-based.

### 2. Type Safety & Strictness

- strict: true in tsconfig (no any, full template type checking).
- Use TypeScript 5.4+ features (satisfies, const assertions, etc.).
- All public APIs and components MUST have explicit types or interfaces.

### 3. Component & State Architecture

- Smart vs Dumb: Containers fetch/store data; presentational components are pure (inputs/outputs only).
- State management: Use signals or store (built-in or NgRx SignalStore) for app state; no global services for mutable state.
- Lazy-load routes and feature modules aggressively.

### 4. Performance & Bundle Health

- No unnecessary change detection (OnPush default for components).
- Deferrable views (@defer) and @let for control flow.
- Tree-shakable imports; avoid barrel files that break optimization.
- Images/assets: Use ngSrc and srcset where possible.

### 5. Security & Best Practices

- Sanitize user input (DomSanitizer only when trusted).
- No direct DOM manipulation (use Renderer2 if absolutely needed).
- HTTP: Use typed HttpClient responses and interceptors for auth/errors.
- Route guards for auth; never trust frontend-only checks.

### 6. Testing

- Every component and service MUST have a spec file with at least smoke and key behavior tests.
- Use Jasmine with Angular Testing Library style (TestBed.configureTestingModule minimal).
- Aim for 80%+ coverage on logic-heavy code.
- **Option-value coverage**: When behavior depends on a fixed set of options (e.g. enum or union type such as classification type: income, expense, transfer, ignore), tests MUST verify at least two distinct values for both **display** (correct value shown when stored) and **persistence** (saved value matches user choice). This catches default-value and single-path bugs (e.g. only testing "expense" and missing "income").

### 7. Code Style & Tooling

- Enforce Angular style guide, Prettier, and ESLint (no unused vars, consistent naming).
- Conventional commits (Commitizen or equivalent).
- Nx or Angular CLI monorepo if multi-app/libs.

### 8. AI Agent Rules

Agents MUST:

- Generate standalone components with signals.
- Add tests with the feature.
- Use @if / @for / @switch control flow.
- Never introduce NgModule unless explicitly requested.

Agents MUST NOT:

- Use deprecated patterns (e.g. ngIf-else legacy syntax, class-based state).
- Bypass strict typing or OnPush.

## 3. MVP Scope & Deployment

- **Audience**: Single user (owner); no multi-tenant or shared deployment.
- **Environment**: Run locally; no requirement for cloud or production hosting for MVP.
- **Data**: User profile, transactions, and tax estimates are local; CSV import and manual entry as specified in MVP workflow.

## 4. Development Workflow

- Code style and tooling MUST follow Principle 7.
- Specs and plans MUST align with this constitution; contradictory specs/plans/tasks MUST be rejected or rewritten.
- Constitution Check in implementation plans MUST verify Angular 18+, standalone/signals, strict types, OnPush, and test coverage expectations before Phase 0 research and after Phase 1 design.

## 5. Governance

- Changes to this file require PR and approval.
- Contradictory specs, plans, or tasks MUST be rejected or rewritten.
- Version bumps: MAJOR for backward-incompatible principle removals or redefinitions; MINOR for new principles or materially expanded guidance; PATCH for clarifications, wording, and non-semantic refinements.

**Version**: 1.0.1 | **Ratified**: 2026-03-04 | **Last Amended**: 2026-03-04
