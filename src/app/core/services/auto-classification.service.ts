import { Injectable, inject } from '@angular/core';
import type { Transaction } from '../models/transaction';
import type { ClassificationSuggestion } from '../models/classification.model';
import { LedgerStorageService } from './ledger-storage.service';
import { ClassificationHeuristicsService } from './classification-heuristics.service';
import { ClassificationAiService } from './classification-ai.service';

/** Max concurrent classification tasks (FR-014). */
const CONCURRENCY_LIMIT = 8;

/**
 * Runs rules first, then optional AI; applies the first result as classification and persists
 * suggestion metadata for display. Used after 001 CSV import.
 * Runs with bounded parallelism so large imports complete in less wall-clock time (FR-014).
 * @see specs/004-consolidate-classification-view/contracts/consolidated-classification-view.md
 */
@Injectable({ providedIn: 'root' })
export class AutoClassificationService {
  private readonly storage = inject(LedgerStorageService);
  private readonly heuristics = inject(ClassificationHeuristicsService);
  private readonly ai = inject(ClassificationAiService);

  private static logCtx(tx: Transaction): string {
    const desc = (tx.description ?? '').slice(0, 40);
    return `${tx.date} ${desc}${desc.length >= 40 ? '…' : ''}`;
  }

  /**
   * Classify one transaction (heuristics then AI) and persist if a suggestion is found.
   * Preserves logging and per-transaction failure handling.
   */
  private async classifyAndPersistOne(tx: Transaction): Promise<void> {
    const ctx = AutoClassificationService.logCtx(tx);
    try {
      let suggestion: ClassificationSuggestion | null = await this.heuristics.suggest(tx);
      if (suggestion) {
        console.log(
          `[AutoClassification] Rules matched: ${suggestion.type}${suggestion.category ? ` / ${suggestion.category}` : ''} (source: ${suggestion.sourceId}) — ${ctx}`
        );
      }
      if (!suggestion) {
        suggestion = await this.ai.suggest(tx);
        if (suggestion) {
          console.log(
            `[AutoClassification] AI used: ${suggestion.type}${suggestion.category ? ` / ${suggestion.category}` : ''} — ${ctx}`
          );
        }
      }
      if (!suggestion) {
        console.log(`[AutoClassification] Nothing matched — ${ctx}`);
      }
      if (suggestion) {
        const category =
          suggestion.type === 'income' || suggestion.type === 'expense'
            ? (suggestion.category?.trim() || 'Other')
            : undefined;
        await this.storage.updateTransaction(tx.id, {
          classificationType: suggestion.type,
          classificationCategory: category,
          classificationNotes: undefined,
          suggestionType: suggestion.type,
          suggestionCategory: category,
          suggestionConfidence: suggestion.confidence,
          suggestionSourceId: suggestion.sourceId,
        });
      }
    } catch (err) {
      console.warn(`[AutoClassification] Error classifying — ${ctx}`, err);
      // Leave this transaction unclassified; continue with others (FR-011)
    }
  }

  /**
   * For each added transaction: run heuristics, then AI if no result; apply first suggestion
   * as classification and store suggestion metadata. Runs with bounded parallelism (FR-014).
   * Leaves transaction unclassified if both fail.
   */
  async runAndPersist(added: Transaction[]): Promise<void> {
    if (added.length === 0) return;
    const limit = Math.min(CONCURRENCY_LIMIT, added.length);
    let index = 0;
    const worker = async (): Promise<void> => {
      while (index < added.length) {
        const i = index++;
        if (i >= added.length) break;
        await this.classifyAndPersistOne(added[i]!);
      }
    };
    await Promise.all(Array.from({ length: limit }, () => worker()));
  }
}
