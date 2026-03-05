import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { Transaction } from '../../../../core/models/transaction';
import type { ClassificationType, Confidence } from '../../../../core/models/classification.model';

const TYPES: ClassificationType[] = ['income', 'expense', 'transfer', 'ignore'];

@Component({
  selector: 'app-classification-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <table>
      <thead>
        <tr>
          <th class="col-check">
            <input
              type="radio"
              name="classifySelect"
              [checked]="selectedId() === null && transactions().length > 0"
              [attr.aria-label]="'Select none'"
              (change)="onSelectNone()"
            />
          </th>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Account</th>
          <th>Type</th>
          <th>Category</th>
          <th>Confidence</th>
          <th>Source</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        @for (t of transactions(); track t.id) {
          <tr [class.selected]="selectedId() === t.id">
            <td class="col-check">
              <input
                type="radio"
                name="classifySelect"
                [checked]="selectedId() === t.id"
                [attr.aria-label]="'Select transaction ' + t.id"
                (change)="onSelectRow(t.id)"
              />
            </td>
            <td>{{ t.date }}</td>
            <td>{{ t.description }}</td>
            <td>{{ t.amount | number: '1.2-2' }}</td>
            <td>{{ t.account }}</td>
            <td>
              <select
                [value]="effectiveType(t)"
                (change)="onTypeChange(t.id, $event)"
                (blur)="onEditsChange()"
              >
                @for (opt of typeOptions; track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            </td>
            <td>
              <input
                type="text"
                [value]="effectiveCategory(t)"
                (input)="onCategoryChange(t.id, $event)"
                (blur)="onEditsChange()"
                placeholder="Category"
              />
            </td>
            <td>{{ t.suggestionConfidence ?? '—' }}</td>
            <td>{{ t.suggestionSourceId ?? '—' }}</td>
            <td>
              <input
                type="text"
                [value]="effectiveNotes(t)"
                (input)="onNotesChange(t.id, $event)"
                (blur)="onEditsChange()"
                placeholder="Notes"
              />
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="10">No transactions.</td>
          </tr>
        }
      </tbody>
    </table>
    @if (pageSize() > 0 && totalItems() > 0) {
      <div class="pagination">
        <span>Rows per page:</span>
        <select (change)="onPageSizeChange($event)">
          <option value="25" [selected]="pageSize() === 25">25</option>
          <option value="50" [selected]="pageSize() === 50">50</option>
          <option value="100" [selected]="pageSize() === 100">100</option>
        </select>
        <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
        <button type="button" [disabled]="currentPage() <= 1" (click)="onPrevPage()">
          Previous
        </button>
        <button type="button" [disabled]="currentPage() >= totalPages()" (click)="onNextPage()">
          Next
        </button>
      </div>
    }
  `,
  styles: [
    `
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        border: 1px solid #ccc;
        padding: 0.5rem;
        text-align: left;
      }
      .col-check {
        width: 2.5rem;
        text-align: center;
      }
      tr.selected {
        background: #e8f4fc;
      }
      .pagination {
        margin-top: 1rem;
        display: flex;
        gap: 1rem;
        align-items: center;
      }
      select,
      input[type='text'] {
        min-width: 6rem;
      }
    `,
  ],
})
export class ClassificationTableComponent {
  readonly transactions = input.required<Transaction[]>();
  readonly pageSize = input<number>(25);
  readonly currentPage = input<number>(1);
  readonly totalItems = input<number>(0);
  readonly selectedId = input<string | null>(null);
  readonly edits = input<Record<string, { type: ClassificationType; category: string; notes: string }>>({});

  readonly selectionChange = output<string | null>();
  readonly editsChange = output<Record<string, { type: ClassificationType; category: string; notes: string }>>();
  readonly pageSizeChange = output<number>();
  readonly pageChange = output<number>();

  readonly typeOptions = TYPES;

  effectiveType(t: Transaction): ClassificationType {
    const e = this.edits()[t.id];
    if (e?.type) return e.type;
    return (t.classificationType ?? t.suggestionType ?? 'expense') as ClassificationType;
  }

  effectiveCategory(t: Transaction): string {
    const e = this.edits()[t.id];
    if (e?.category !== undefined) return e.category;
    return t.classificationCategory ?? t.suggestionCategory ?? '';
  }

  effectiveNotes(t: Transaction): string {
    const e = this.edits()[t.id];
    if (e?.notes !== undefined) return e.notes;
    return t.classificationNotes ?? '';
  }

  onSelectRow(id: string): void {
    this.selectionChange.emit(id);
  }

  onSelectNone(): void {
    this.selectionChange.emit(null);
  }

  onTypeChange(id: string, event: Event): void {
    const val = (event.target as HTMLSelectElement).value as ClassificationType;
    this.emitEdit(id, 'type', val);
  }

  onCategoryChange(id: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.emitEdit(id, 'category', val);
  }

  onNotesChange(id: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.emitEdit(id, 'notes', val);
  }

  private emitEdit(
    id: string,
    field: 'type' | 'category' | 'notes',
    value: ClassificationType | string
  ): void {
    const current = this.edits();
    const tx = this.transactions().find((t) => t.id === id);
    const prev = current[id] ?? {
      type: (tx?.classificationType ?? tx?.suggestionType ?? 'expense') as ClassificationType,
      category: tx?.classificationCategory ?? tx?.suggestionCategory ?? '',
      notes: tx?.classificationNotes ?? '',
    };
    const next = { ...prev, [field]: value };
    this.editsChange.emit({ ...current, [id]: next });
  }

  onEditsChange(): void {
    // No-op; edits already emitted on change
  }

  totalPages(): number {
    const size = this.pageSize();
    const total = this.totalItems();
    return size > 0 ? Math.ceil(total / size) : 0;
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSizeChange.emit(Number(select.value));
  }

  onPrevPage(): void {
    this.pageChange.emit(this.currentPage() - 1);
  }

  onNextPage(): void {
    this.pageChange.emit(this.currentPage() + 1);
  }
}
