# Feature Specification: Guided Transaction Classification

**Feature Branch**: `002-guided-transaction-classification`  
**Created**: 2026-03-04  
**Status**: Draft  
**Input**: User description: "Extend the ledger app with a guided classification flow. The user works through unclassified transactions and labels each as income, expense, transfer, or ignore. For income/expense, the user assigns a category and optional notes. The app supports rules that auto-classify future transactions based on simple matchers (merchant/description/amount patterns), and always shows what rule was used. This phase is focused on speed and accuracy of classification; no quarterly tax calculation yet."

## Clarifications

### Session 2026-03-04

- Q: Who defines and maintains classification rules, and what is the user’s role? → A: Auto-classification is driven only by developer-maintained rules and heuristics. End users cannot create, edit, or manage rules. The system applies built-in merchant, description, regex, transfer-detection, and recurrence heuristics to suggest classifications with confidence levels. The user’s role is limited to reviewing, approving, or correcting suggestions. Corrections must not create new user-defined rules in this phase; transaction review outcomes are not stored (unneeded).
- Q: How should the system represent confidence level for suggestions? → A: Ordinal labels only (e.g. Low, Medium, High).
- Q: When should the system generate or refresh classification suggestions? → A: Only when new transactions are added (e.g. on import).
- Q: What must each transaction review outcome store for auditability? → A: Do not store transaction review outcomes; they are unneeded.
- Q: How should the classification UI and submit behavior work? → A: Classification uses a paginated view of all unclassified transactions with sort and filter. Each transaction is shown with a pre-populated suggestion (used unless the user modifies). Submit applies only to the transaction currently displayed. Submit All applies to all pages. Buttons to submit by confidence: High only, Medium or higher, Low or higher. Transactions with no suggestion are not submitted (remain unclassified). After submit, the view repopulates with remaining unclassified or is empty. A separate table view for editing existing classifications, with filtering and sorting, is required.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Classify Unclassified Transactions in a Paginated View (Priority: P1)

The user opens the classification view and sees a paginated list of all unclassified transactions with the ability to sort and filter. Each row shows a transaction with a pre-populated suggested classification (type, and for income/expense category, plus confidence level) produced by built-in heuristics; that suggestion is used unless the user modifies it. The user may edit any suggestion (type, category, notes) before submitting. **Submit** applies only to the selected transaction (no-op if none selected), avoiding confusion about scope. **Submit All** applies the current suggestion (or user edit) to all unclassified transactions across all pages. Buttons **Submit by confidence** allow bulk submit by threshold: High only, Medium or higher, or Low or higher (only transactions with a suggestion at or above that confidence are submitted). Transactions that have no suggestion are never submitted by any bulk action and remain unclassified. After any submit, the view repopulates with the remaining unclassified transactions, or shows empty if all are classified. The app does not create user-defined rules from corrections and does not store separate transaction review outcomes.

**Why this priority**: Core value; without it there is no classification flow.

**Independent Test**: Load a ledger with unclassified transactions (e.g. after import), open the classification view, optionally edit some suggestions, use Submit (current), Submit All, and Submit by confidence (e.g. High only), then verify saved classifications and that transactions with no suggestion remain unclassified; verify the list repopulates after submit.

**Acceptance Scenarios**:

1. **Given** the ledger has unclassified transactions, **When** the user opens the classification view, **Then** the app shows a paginated list of all unclassified transactions with sort and filter, each with a pre-populated suggestion (type, category for income/expense, confidence level) when available.
2. **Given** the user does not modify any suggestion and triggers Submit (for the selected transaction), **Then** only that transaction is classified with its suggestion.
3. **Given** the user triggers Submit All, **Then** all unclassified transactions that have a suggestion (and any user edits) are classified accordingly across all pages; the view then repopulates with remaining unclassified or is empty.
4. **Given** the user triggers Submit by confidence (e.g. High only), **Then** only unclassified transactions whose suggestion has that confidence or higher are classified; transactions with no suggestion or lower confidence are not submitted and remain unclassified; the view repopulates.
5. **Given** a transaction has no suggestion, **When** the user triggers Submit All or Submit by confidence, **Then** that transaction is not submitted and remains unclassified.
6. **Given** the user has submitted one or more classifications, **When** the submit completes, **Then** the classification list repopulates with any remaining unclassified transactions or shows empty if all are classified.

---

### User Story 2 - View Ledger and Edit Classifications in a Table (Priority: P2)

The user can view the ledger with classification information visible (type, category, notes). For transactions that were suggested by built-in heuristics, the app shows which heuristic or rule was used and the confidence level. The user can filter or sort the ledger list by classification type and by category. A **separate table view** is provided for editing existing classifications: the user can open this view to change type, category, or notes for already-classified transactions, with filtering and sorting so they can find and edit specific transactions.

**Why this priority**: Enables users to verify classifications and correct mistakes without re-importing.

**Independent Test**: After classifications exist, open the ledger list and confirm type/category/notes and suggestion source/confidence; open the separate edit-classifications table, filter/sort, edit one or more transactions, save, and verify changes persist.

**Acceptance Scenarios**:

1. **Given** the ledger has classified and unclassified transactions, **When** the user views the ledger list, **Then** each transaction shows its classification type and, for income/expense, category and optional notes; for suggested/auto-classified transactions the app shows which built-in heuristic or rule was used and the confidence level.
2. **Given** the user is viewing the list, **When** the user applies a filter by classification type (e.g. expense) or by category, **Then** the list shows only transactions matching that type or category.
3. **Given** the user wants to edit existing classifications, **When** the user opens the separate table view for editing classifications, **Then** the app shows classified transactions with filtering and sorting, and the user can change type, category, or notes and save; changes persist and do not create user-defined rules.

---

### User Story 3 - System Applies Built-In Heuristics to Suggest Classifications (Priority: P2)

The system applies only developer-maintained rules and heuristics to produce classification suggestions. Built-in logic includes merchant matching, description matching, regex patterns, transfer-detection heuristics, and recurrence heuristics. Each suggestion includes a classification (type and, for income/expense, category) and a confidence level. Suggestions are generated only when new transactions are added to the ledger (e.g. on import); the user cannot trigger a suggestion refresh in this phase. The user cannot create, edit, or delete these rules; they are maintained by developers. When a suggestion is shown or applied, the system records which heuristic or rule produced it so it can be displayed in the list and in the flow.

**Why this priority**: Delivers speed and consistency without exposing rule management to end users.

**Independent Test**: Add or import transactions that match known built-in patterns (e.g. a common merchant or transfer pattern), trigger suggestions, and verify suggestions appear with type, category where applicable, confidence level, and source heuristic/rule; confirm the user has no UI to create or edit rules.

**Acceptance Scenarios**:

1. **Given** built-in heuristics exist (merchant, description, regex, transfer-detection, recurrence), **When** a new transaction is added to the ledger (e.g. on import), **Then** the system evaluates only these heuristics and may produce a suggestion with type, category (for income/expense), and confidence level.
2. **Given** a suggestion was produced, **When** the user views that transaction in the list or in the flow, **Then** the app shows which built-in heuristic or rule was used and the confidence level.
3. **Given** the user is in the app, **When** the user looks for rule management (create, edit, delete rules), **Then** no such capability is offered; rules are developer-maintained only.

---

### User Story 4 - Corrections Do Not Create User-Defined Rules (Priority: P3)

When the user corrects a suggested classification (changes type, category, or notes), the system saves only the final classification. The system does not store separate transaction review outcomes (they are unneeded). Corrections do not create, update, or delete any user-defined rules; in this phase there are no user-defined rules.

**Why this priority**: Keeps scope clear and avoids unnecessary storage.

**Independent Test**: Correct a suggested classification for one or more transactions, then verify the corrected classification is persisted and that no new user-defined rules exist.

**Acceptance Scenarios**:

1. **Given** the user corrects a suggestion and saves, **When** the system persists the classification, **Then** only the final classification (type, category, notes) is stored; no separate review outcome or audit record is stored.
2. **Given** the user has corrected transactions, **When** the user inspects the app, **Then** no new user-defined rules were created; only developer-maintained rules exist.

---

### Edge Cases

- What happens when there are no unclassified transactions? The classification view shows an empty list (or a clear message); the user can switch to the ledger or the edit-classifications table.
- What happens when the system produces no suggestion for a transaction? The transaction appears in the unclassified list but with no suggestion; it is not included in Submit All or Submit by confidence and remains unclassified until the user edits and submits that row (Submit for current only).
- What happens when multiple heuristics match the same transaction? The system produces a single suggestion (e.g. by defined priority or highest confidence) and records which heuristic/rule was used; behavior is consistent and predictable.
- What happens when the user triggers Submit with no transaction selected? Submit (current) is a no-op; no transaction is updated.
- How are confidence levels used? Confidence is expressed as ordinal labels (e.g. Low, Medium, High). Submit by confidence uses them: High only, Medium or higher, Low or higher. The system may also use them to sort or highlight in the classification view.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a classification view showing a paginated list of all unclassified transactions with sort and filter. Each column MAY be used to sort or filter (sort and filter are available per column). Each transaction MUST show a pre-populated suggestion (type, category for income/expense, confidence level) when available; the user MAY edit the suggestion. Submit MUST apply only to the selected transaction; if no transaction is selected, Submit is a no-op. Submit All MUST classify all unclassified transactions that have a suggestion (or user edit) across all pages. The system MUST provide Submit by confidence: High only, Medium or higher, Low or higher (only transactions with a suggestion at or above that confidence are submitted). Transactions with no suggestion MUST NOT be submitted by bulk actions and remain unclassified. After submit, the view MUST repopulate with remaining unclassified transactions or show empty.
- **FR-002**: For transactions classified as income or expense (whether approved or corrected), the system MUST require a category and MUST allow optional notes before saving.
- **FR-003**: For transactions classified as transfer or ignore, the system MUST save the classification without requiring a category or notes.
- **FR-004**: The system MUST persist all classifications (type, category, notes); the system does not store separate transaction review outcomes (unneeded).
- **FR-005**: The system MUST allow the user to view the ledger list with classification information (type, category, notes) and, for suggested/auto-classified items, which built-in heuristic or rule was used and the confidence level; the user MUST be able to filter or sort by classification type and by category. The system MUST provide a separate table view for editing existing classifications, with filtering and sorting, so the user can change type, category, or notes for already-classified transactions.
- **FR-006**: The system MUST apply only developer-maintained rules and heuristics (e.g. merchant, description, regex, transfer-detection, recurrence) to produce suggestions; each suggestion MUST include a confidence level expressed as an ordinal label (e.g. Low, Medium, High) and a reference to the heuristic or rule that produced it.
- **FR-007**: The system MUST NOT allow end users to create, edit, or manage classification rules in this phase; rules are maintained by developers only.
- **FR-008**: When the user corrects a suggestion, the system MUST save the corrected classification and MUST NOT create, update, or delete any user-defined rules from that correction; the system does not store separate transaction review outcomes (see FR-004).
- **FR-009**: The system MUST apply built-in heuristics in a consistent, defined way so that at most one suggestion (one type, one category if applicable, one confidence, one source) is produced per transaction for display and application.

### Key Entities

- **Transaction (extended)**: Existing ledger transaction with classification data: classification type (income, expense, transfer, ignore), category (for income/expense), optional notes, optional reference to the built-in heuristic or rule that produced the suggestion (if any), and optional confidence level.
- **Classification suggestion**: Output of built-in heuristics for a transaction: type, category (for income/expense), confidence level (ordinal labels only: e.g. Low, Medium, High), and reference to the heuristic or rule that produced it.
- **Built-in rule / heuristic**: Developer-maintained logic (merchant, description, regex, transfer-detection, recurrence) used to produce suggestions; not editable by end users.
- **Category**: A label for income and expense transactions. The list of allowed categories is read from a **classification config file** (e.g. JSON) so it can be manually updated without code changes; heuristics may also suggest categories from the same config. Users select or confirm from suggestions or this list, but do not define new rule logic.

## Assumptions

- The ledger and transaction model from the CSV import feature (001) exist; this feature extends transactions with classification fields, suggestions, and confidence.
- "Merchant" can be derived from the existing transaction description or a dedicated field if the normalized model supports it; built-in heuristics use fields available on the transaction.
- No quarterly or annual tax calculation is in scope; classification is for organization and future tax use only.
- Suggestions are produced only when new transactions are added (e.g. on import); there is no user-triggered suggestion refresh in this phase. Heuristic evaluation on import completes in under 2 seconds for typical import size (e.g. hundreds of rows).
- Categories (and optionally heuristic patterns such as merchant lists) are defined in a **classification config file** (e.g. `classification-config.json`) so they can be manually updated as needed; users do not create new rule logic from corrections in this phase.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Built-in heuristics produce suggestions with confidence levels for a defined set of patterns (merchant, description, regex, transfer, recurrence); a target proportion of matching transactions receive a suggestion (e.g. high confidence for known patterns) so that users can use Submit All or Submit by confidence for bulk classification. A concrete target proportion (e.g. ≥ X% of imported transactions with a suggestion) is to be set during implementation and documented in the codebase or quickstart.
- **SC-002**: Users can see which built-in heuristic or rule suggested each transaction and the confidence level in the classification view and in the ledger with no extra navigation.
- **SC-003**: Submit (current), Submit All, and Submit by confidence persist classifications immediately; after submit the classification view repopulates with remaining unclassified or empty.
- **SC-004**: Users can filter the ledger by classification type and by category and get accurate results for all classified transactions.
- **SC-005**: No user-defined rules are created from user corrections in this phase; the system does not store separate transaction review outcomes.
