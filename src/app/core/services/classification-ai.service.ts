import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import type { Transaction } from '../models/transaction';
import type {
  ClassificationSuggestion,
  ClassificationType,
} from '../models/classification.model';

const OLLAMA_BASE = 'http://127.0.0.1:11434';
const TIMEOUT_MS = 5000;
const STATUS_TIMEOUT_MS = 2000;

/**
 * Optional AI-assisted classification via local Ollama.
 * Returns null on timeout, network error, or CORS failure so import is never blocked.
 * @see specs/004-consolidate-classification-view/contracts/consolidated-classification-view.md
 */
@Injectable({ providedIn: 'root' })
export class ClassificationAiService {
  private readonly http = inject(HttpClient);

  /**
   * Check if Ollama is reachable (e.g. for UI status indicator).
   * GET / returns "Ollama is running" with 200 when up.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.http
          .get(`${OLLAMA_BASE}/`, { responseType: 'text' })
          .pipe(
            timeout(STATUS_TIMEOUT_MS),
            catchError(() => of(null))
          )
      );
      return res != null && res.includes('Ollama');
    } catch {
      return false;
    }
  }

  /**
   * Ask Ollama to suggest a classification for the transaction.
   * Returns null on any failure or timeout so callers can fall back to rules or leave unclassified.
   */
  async suggest(transaction: Transaction): Promise<ClassificationSuggestion | null> {
    const prompt = this.buildPrompt(transaction);
    const body = {
      model: 'llama2',
      prompt,
      stream: false,
    };
    try {
      const res = await firstValueFrom(
        this.http
          .post<{ response?: string }>(`${OLLAMA_BASE}/api/generate`, body)
          .pipe(
            timeout(TIMEOUT_MS),
            catchError(() => of(null))
          )
      );
      if (!res?.response) return null;
      return this.parseResponse(res.response, transaction);
    } catch {
      return null;
    }
  }

  private buildPrompt(t: Transaction): string {
    return `You classify bank/credit transactions. Reply with exactly one line: type category

Types: income | expense | transfer | ignore
- income: paychecks, deposits, refunds you count as income
- expense: purchases, bills, subscriptions you track
- transfer: moving money between accounts (e.g. Zelle, Venmo, TRANSFER)
- ignore: tax refunds (IRS TREAS 310), subscriptions to ignore (e.g. YouTube), or noise

Category: one word only for income or expense (e.g. Salary, Payroll, Food, Subscriptions, Shopping). Omit for transfer/ignore.

Amount sign: positive usually income, negative usually expense (use as a hint).

Examples:
- "Beacon Hill Staf PAYROLL..." → income Salary (paycheck)
- "PURCHASE AUTHORIZED ON ... SUNBIZ.ORG" → expense (category from context, e.g. Business)
- "PURCHASE ... Uber Technologies" → expense Transport
- "PURCHASE ... Google YouTube" → ignore (subscription to ignore)
- "IRS TREAS 310 TAX REF" → ignore

Transaction to classify:
Description: ${t.description}
Amount: ${t.amount}

Reply with exactly: type category (or "type" only for transfer/ignore):`;
  }

  private parseResponse(response: string, _t: Transaction): ClassificationSuggestion | null {
    const firstLine = response.trim().split('\n')[0]?.trim() ?? '';
    const parts = firstLine.split(/\s+/);
    const type = this.parseType(parts[0]?.toLowerCase());
    if (!type) return null;
    const category =
      type === 'income' || type === 'expense'
        ? (parts[1] ?? 'Other').trim() || 'Other'
        : undefined;
    return {
      type,
      category,
      confidence: 'Medium',
      sourceId: 'ollama',
    };
  }

  private parseType(s: string | undefined): ClassificationType | null {
    if (!s) return null;
    const t = s.toLowerCase();
    if (t === 'income' || t === 'expense' || t === 'transfer' || t === 'ignore') return t;
    return null;
  }
}
