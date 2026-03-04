import { Injectable } from '@angular/core';
import { TransactionRow } from '../models/transaction';

export interface ParseResult {
  rows: TransactionRow[];
  skippedInvalid: number;
  error?: string;
}

/**
 * Parse Wells Fargo 5-column quoted CSV.
 * Columns: 0=Date (MM/DD/YYYY), 1=Amount, 2=*, 3=empty, 4=Description.
 * @see specs/001-csv-ledger-import/contracts/wells-fargo-csv.md
 */
@Injectable({ providedIn: 'root' })
export class CsvParserService {
  /**
   * Parse CSV text. Returns rows normalized to YYYY-MM-DD and numeric amount.
   * Empty file or unsupported format sets error; malformed rows increment skippedInvalid.
   */
  parse(csvText: string): ParseResult {
    const trimmed = csvText.trim();
    if (trimmed.length === 0) {
      return { rows: [], skippedInvalid: 0, error: 'No transactions found. The file is empty.' };
    }

    const lines = this.splitLines(trimmed);
    const rows: TransactionRow[] = [];
    let skippedInvalid = 0;

    for (const line of lines) {
      const cols = this.parseQuotedLine(line);
      if (cols.length < 5) {
        skippedInvalid++;
        continue;
      }
      const date = this.normalizeDate(cols[0]);
      const amount = this.parseAmount(cols[1]);
      const description = cols[4]?.trim() ?? '';
      if (!date || amount === null || description === '') {
        skippedInvalid++;
        continue;
      }
      rows.push({ date, description, amount });
    }

    if (lines.length > 0 && rows.length === 0 && skippedInvalid === lines.length) {
      return {
        rows: [],
        skippedInvalid,
        error: 'Unsupported CSV format. Please use a Wells Fargo export file.',
      };
    }

    return { rows, skippedInvalid };
  }

  private splitLines(text: string): string[] {
    const result: string[] = [];
    let i = 0;
    while (i < text.length) {
      const lineEnd = text.indexOf('\n', i);
      const line = lineEnd === -1 ? text.slice(i) : text.slice(i, lineEnd);
      result.push(line.trim());
      i = lineEnd === -1 ? text.length : lineEnd + 1;
    }
    return result.filter((l) => l.length > 0);
  }

  private parseQuotedLine(line: string): string[] {
    const cols: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        i++;
        let cell = '';
        while (i < line.length) {
          if (line[i] === '"') {
            i++;
            if (line[i] === '"') {
              cell += '"';
              i++;
            } else {
              break;
            }
          } else {
            cell += line[i];
            i++;
          }
        }
        cols.push(cell);
        while (i < line.length && (line[i] === ',' || line[i] === ' ')) i++;
      } else {
        const next = line.indexOf(',', i);
        const end = next === -1 ? line.length : next;
        cols.push(line.slice(i, end).replace(/^"|"$/g, '').trim());
        i = next === -1 ? line.length : next + 1;
      }
    }
    return cols;
  }

  private normalizeDate(value: string): string | null {
    const s = value.replace(/^"|"$/g, '').trim();
    const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const [, month, day, year] = match;
    const m = month.padStart(2, '0');
    const d = day.padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  private parseAmount(value: string): number | null {
    const s = value.replace(/^"|"$/g, '').replace(/,/g, '').trim();
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }
}
