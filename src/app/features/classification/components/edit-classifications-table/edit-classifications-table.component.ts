import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { Transaction } from '../../../../core/models/transaction';
import type { ClassificationType } from '../../../../core/models/classification.model';

const TYPES: ClassificationType[] = ['income', 'expense', 'transfer', 'ignore'];

@Component({
  selector: 'app-edit-classifications-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <table>
      <thead>
        <tr>
          <th class="col-check"></th>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Type</th>
          <th>Category</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        @for (t of transactions(); track t.id) {
          <tr [class.selected]="selectedId() === t.id" (click)="onSelectRow(t.id)">
            <td class="col-check">
              <input
                type="radio"
                [checked]="selectedId() === t.id"
                [attr.aria-label]="'Select transaction ' + t.id"
                (click)="$event.stopPropagation(); onSelectRow(t.id)"
              />
            </td>
            <td>{{ t.date }}</td>
            <td>{{ t.description }}</td>
            <td>{{ t.amount | number: '1.2-2' }}</td>
            @if (selectedId() === t.id) {
              <td>
                <select
                  [value]="localType()"
                  (change)="onTypeChange($event)"
                >
                  @for (opt of typeOptions; track opt) {
                    <option [value]="opt" [selected]="localType() === opt">{{ opt }}</option>
                  }
                </select>
              </td>
              <td>
                <select
                  [value]="localCategory()"
                  (change)="onCategoryChange($event)"
                >
                  <option value="">—</option>
                  @for (c of categories(); track c) {
                    <option [value]="c" [selected]="localCategory() === c">{{ c }}</option>
                  }
                </select>
              </td>
              <td>
                <input
                  type="text"
                  [value]="localNotes()"
                  (input)="onNotesChange($event)"
                  placeholder="Notes"
                />
              </td>
            } @else {
              <td>{{ t.classificationType ?? '—' }}</td>
              <td>{{ t.classificationCategory ?? '—' }}</td>
              <td>{{ t.classificationNotes ?? '—' }}</td>
            }
          </tr>
        } @empty {
          <tr>
            <td colspan="7">No classified transactions. Classify transactions from the Classification view.</td>
          </tr>
        }
      </tbody>
    </table>
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
      select,
      input[type='text'] {
        min-width: 6rem;
      }
    `,
  ],
})
export class EditClassificationsTableComponent {
  readonly transactions = input.required<Transaction[]>();
  readonly selectedId = input<string | null>(null);
  readonly categories = input<string[]>([]);
  readonly draftType = input<ClassificationType | ''>('');
  readonly draftCategory = input<string>('');
  readonly draftNotes = input<string>('');

  readonly selectionChange = output<string | null>();
  readonly draftChange = output<{ type: ClassificationType | ''; category: string; notes: string }>();

  readonly typeOptions = TYPES;

  /** Local copy of draft so the select always reflects and persists the exact chosen value. */
  readonly localType = signal<ClassificationType | ''>('');
  readonly localCategory = signal<string>('');
  readonly localNotes = signal<string>('');

  constructor() {
    effect(
      () => {
        this.localType.set(this.draftType());
        this.localCategory.set(this.draftCategory());
        this.localNotes.set(this.draftNotes());
      },
      { allowSignalWrites: true }
    );
  }

  onSelectRow(id: string): void {
    this.selectionChange.emit(id);
  }

  onTypeChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as ClassificationType | '';
    this.localType.set(val);
    this.draftChange.emit({
      type: val,
      category: this.localCategory(),
      notes: this.localNotes(),
    });
  }

  onCategoryChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.localCategory.set(val);
    this.draftChange.emit({
      type: this.localType(),
      category: val,
      notes: this.localNotes(),
    });
  }

  onNotesChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.localNotes.set(val);
    this.draftChange.emit({
      type: this.localType(),
      category: this.localCategory(),
      notes: val,
    });
  }

  /** Returns the current draft from the table (source of truth for save). */
  getDraft(): { type: ClassificationType | ''; category: string; notes: string } {
    return {
      type: this.localType(),
      category: this.localCategory(),
      notes: this.localNotes(),
    };
  }
}
