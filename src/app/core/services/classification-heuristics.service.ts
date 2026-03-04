import { Injectable, inject } from '@angular/core';
import type { Transaction } from '../models/transaction';
import type {
  ClassificationSuggestion,
  ClassificationType,
  Confidence,
} from '../models/classification.model';
import { ClassificationConfigService } from './classification-config.service';

/**
 * Pipeline order: transfer detection → merchant → description/regex → recurrence.
 * First non-null suggestion wins (single suggestion per transaction).
 * No user-defined rules; all logic is developer-maintained.
 */
@Injectable({ providedIn: 'root' })
export class ClassificationHeuristicsService {
  private readonly configService = inject(ClassificationConfigService);

  /** Returns a single suggestion for the transaction, or null. */
  async suggest(transaction: Transaction): Promise<ClassificationSuggestion | null> {
    await this.configService.load();
    const heuristics: Array<() => ClassificationSuggestion | null> = [
      () => this.transferDetection(transaction),
      () => this.merchantMatch(transaction),
      () => this.descriptionRegex(transaction),
      () => this.recurrence(transaction),
    ];
    for (const h of heuristics) {
      const s = h();
      if (s) return s;
    }
    return null;
  }

  /** Stub: detect same-day opposite amount as possible transfer. */
  private transferDetection(t: Transaction): ClassificationSuggestion | null {
    // Simple heuristic: description contains common transfer keywords
    const d = (t.description ?? '').toUpperCase();
    if (
      d.includes('TRANSFER') ||
      d.includes('XFER') ||
      d.includes('ZELLE') ||
      d.includes('VENMO')
    ) {
      return {
        type: 'transfer',
        confidence: 'Medium',
        sourceId: 'transfer-detection',
      };
    }
    return null;
  }

  private merchantMatch(t: Transaction): ClassificationSuggestion | null {
    const merchants = this.configService.getMerchants();
    if (merchants.length === 0) return null;
    const desc = (t.description ?? '').toLowerCase();
    for (const m of merchants) {
      if (desc.includes(m.toLowerCase())) {
        const categories = this.configService.getCategories();
        return {
          type: 'expense',
          category: categories[0] ?? 'Other',
          confidence: 'High',
          sourceId: `merchant:${m}`,
        };
      }
    }
    return null;
  }

  private descriptionRegex(t: Transaction): ClassificationSuggestion | null {
    const patterns = this.configService.getPatterns() ?? [];
    const desc = t.description ?? '';
    for (const p of patterns) {
      try {
        const re = new RegExp(p.pattern, 'i');
        if (re.test(desc)) {
          const type = (p.type ?? 'expense') as ClassificationType;
          const confidence = (p.confidence ?? 'Low') as Confidence;
          return {
            type,
            category: p.category,
            confidence,
            sourceId: `pattern:${p.pattern.slice(0, 20)}`,
          };
        }
      } catch {
        // invalid regex skip
      }
    }
    return null;
  }

  private recurrence(_t: Transaction): ClassificationSuggestion | null {
    // Stub: no recurrence heuristic yet
    return null;
  }
}
