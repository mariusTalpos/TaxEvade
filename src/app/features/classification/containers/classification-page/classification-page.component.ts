import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
} from '@angular/core';
import { ClassificationTableComponent } from '../../components/classification-table/classification-table.component';
import { LedgerStorageService } from '../../../../core/services/ledger-storage.service';
import { ClassificationConfigService } from '../../../../core/services/classification-config.service';
import type { Transaction } from '../../../../core/models/transaction';
import type { ClassificationType } from '../../../../core/models/classification.model';

const DEFAULT_PAGE_SIZE = 25;
export type SortColumn = 'date' | 'amount' | 'type' | 'category';
export type SortDirection = 'asc' | 'desc';
export type FilterOption = 'all' | 'unclassified' | ClassificationType;

@Component({
  selector: 'app-classification-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClassificationTableComponent],
  template: `
    <h1>Classification</h1>
    <p>Review and edit classifications for all transactions. Filter by status or type.</p>

    @if (loading()) {
      <p>Loading…</p>
    } @else {
      <div class="filters">
        <label>
          Show:
          <select [value]="filterOption()" (change)="onFilterOptionChange($event)">
            <option value="all">All</option>
            <option value="unclassified">Unclassified</option>
            @for (t of typeOptions; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </label>
        <label>
          Category:
          <select [value]="filterCategory()" (change)="onFilterCategoryChange($event)">
            <option value="">All</option>
            @for (c of categoryOptions(); track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </label>
        <label>
          Sort:
          <select [value]="sortColumn()" (change)="onSortColumnChange($event)">
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="type">Type</option>
            <option value="category">Category</option>
          </select>
        </label>
        <select [value]="sortDirection()" (change)="onSortDirectionChange($event)">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      @if (validationMessage()) {
        <p class="validation-message">{{ validationMessage() }}</p>
      }
      <div class="actions">
        <button
          type="button"
          [disabled]="!selectedTransactionId()"
          (click)="onSave()"
        >
          Save
        </button>
        <button
          type="button"
          [disabled]="!selectedTransactionId()"
          (click)="onClearClassification()"
        >
          Clear classification
        </button>
        <button type="button" (click)="onAcceptHighConfidence()">
          Accept all high confidence
        </button>
      </div>

      <app-classification-table
        [transactions]="paginatedList()"
        [pageSize]="pageSize()"
        [currentPage]="currentPage()"
        [totalItems]="sortedList().length"
        [selectedId]="selectedTransactionId()"
        [edits]="edits()"
        (selectionChange)="onSelectionChange($event)"
        (editsChange)="edits.set($event)"
        (pageSizeChange)="onPageSizeChange($event)"
        (pageChange)="currentPage.set($event)"
      />
    }
  `,
  styles: [
    `
      .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .filters label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .validation-message {
        color: #c00;
        margin-bottom: 0.5rem;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class ClassificationPageComponent implements OnInit {
  private readonly storage = inject(LedgerStorageService);
  private readonly configService = inject(ClassificationConfigService);

  readonly loading = signal(true);
  readonly allTransactions = signal<Transaction[]>([]);
  readonly filterOption = signal<FilterOption>('all');
  readonly filterCategory = signal<string>('');
  readonly sortColumn = signal<SortColumn>('date');
  readonly sortDirection = signal<SortDirection>('desc');
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly currentPage = signal(1);
  readonly selectedTransactionId = signal<string | null>(null);
  readonly edits = signal<
    Record<string, { type: ClassificationType; category: string; notes: string }>
  >({});
  readonly validationMessage = signal<string>('');

  readonly typeOptions: ClassificationType[] = ['income', 'expense', 'transfer', 'ignore'];

  readonly categoryOptions = computed(() => {
    const list = this.allTransactions();
    const config = this.configService.getCategories();
    const set = new Set<string>(config);
    list.forEach((t) => {
      const c = (t.classificationCategory ?? t.suggestionCategory ?? '').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  });

  readonly filteredList = computed(() => {
    const list = this.allTransactions();
    const opt = this.filterOption();
    const cat = this.filterCategory().trim();
    let result = list;
    if (opt === 'unclassified') {
      result = result.filter((t) => t.classificationType == null);
    } else if (opt !== 'all') {
      result = result.filter((t) => t.classificationType === opt);
    }
    if (cat) {
      result = result.filter(
        (t) =>
          (t.classificationCategory ?? t.suggestionCategory ?? '').trim() === cat
      );
    }
    return result;
  });

  readonly sortedList = computed(() => {
    const list = this.filteredList();
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const mult = dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      let cmp = 0;
      switch (col) {
        case 'date':
          cmp = (a.date ?? '').localeCompare(b.date ?? '');
          break;
        case 'amount':
          cmp = (a.amount ?? 0) - (b.amount ?? 0);
          break;
        case 'type':
          cmp = (a.classificationType ?? a.suggestionType ?? '').localeCompare(
            b.classificationType ?? b.suggestionType ?? ''
          );
          break;
        case 'category':
          cmp = (a.classificationCategory ?? a.suggestionCategory ?? '').localeCompare(
            b.classificationCategory ?? b.suggestionCategory ?? ''
          );
          break;
        default:
          break;
      }
      return cmp * mult;
    });
  });

  readonly paginatedList = computed(() => {
    const list = this.sortedList();
    const size = this.pageSize();
    const page = this.currentPage();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  constructor() {
    effect(() => {
      const list = this.sortedList();
      const page = this.currentPage();
      const size = this.pageSize();
      const maxPage = size > 0 ? Math.ceil(list.length / size) : 1;
      if (maxPage >= 1 && page > maxPage) {
        this.currentPage.set(maxPage);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.configService.load();
    await this.refreshList();
    this.loading.set(false);
  }

  async refreshList(): Promise<void> {
    const list = await this.storage.getAll();
    this.allTransactions.set([...list].sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0)));
  }

  onSelectionChange(id: string | null): void {
    this.selectedTransactionId.set(id);
    this.validationMessage.set('');
    if (!id) return;
    const list = this.allTransactions();
    const t = list.find((x) => x.id === id);
    if (t) {
      const type = t.classificationType ?? t.suggestionType ?? 'expense';
      const category = t.classificationCategory ?? t.suggestionCategory ?? '';
      const notes = t.classificationNotes ?? '';
      this.edits.set({ ...this.edits(), [id]: { type, category, notes } });
    }
  }

  private getEffective(
    t: Transaction
  ): { type: ClassificationType; category: string; notes: string } {
    const e = this.edits()[t.id];
    if (e) return e;
    const type = t.classificationType ?? t.suggestionType ?? 'expense';
    return {
      type,
      category: t.classificationCategory ?? t.suggestionCategory ?? '',
      notes: t.classificationNotes ?? '',
    };
  }

  private validateCategory(
    type: ClassificationType,
    category: string
  ): { valid: boolean; message?: string } {
    if (type !== 'income' && type !== 'expense') return { valid: true };
    const trimmed = (category ?? '').trim();
    if (!trimmed) {
      return { valid: false, message: 'Category is required for income and expense.' };
    }
    return { valid: true };
  }

  async onSave(): Promise<void> {
    const id = this.selectedTransactionId();
    if (!id) return;
    const list = this.allTransactions();
    const t = list.find((x) => x.id === id);
    if (!t) return;
    const { type, category, notes } = this.getEffective(t);
    const validation = this.validateCategory(type, category);
    if (!validation.valid) {
      this.validationMessage.set(validation.message ?? '');
      return;
    }
    await this.storage.updateClassification(id, {
      classificationType: type,
      classificationCategory: category?.trim() || undefined,
      classificationNotes: notes?.trim() || undefined,
    });
    const nextEdits = { ...this.edits() };
    delete nextEdits[id];
    this.edits.set(nextEdits);
    this.selectedTransactionId.set(null);
    this.validationMessage.set('');
    await this.refreshList();
  }

  async onClearClassification(): Promise<void> {
    const id = this.selectedTransactionId();
    if (!id) return;
    await this.storage.clearClassification(id);
    const nextEdits = { ...this.edits() };
    delete nextEdits[id];
    this.edits.set(nextEdits);
    this.selectedTransactionId.set(null);
    this.validationMessage.set('');
    await this.refreshList();
  }

  onFilterOptionChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as FilterOption;
    this.filterOption.set(val);
    this.currentPage.set(1);
  }

  onFilterCategoryChange(event: Event): void {
    this.filterCategory.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  onSortColumnChange(event: Event): void {
    this.sortColumn.set((event.target as HTMLSelectElement).value as SortColumn);
  }

  onSortDirectionChange(event: Event): void {
    this.sortDirection.set((event.target as HTMLSelectElement).value as SortDirection);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  async onAcceptHighConfidence(): Promise<void> {
    const list = this.sortedList();
    const toUpdate = list.filter(
      (t) =>
        t.classificationType == null &&
        t.suggestionConfidence === 'High' &&
        t.suggestionType != null
    );
    for (const t of toUpdate) {
      const type = t.suggestionType!;
      const category =
        type === 'income' || type === 'expense'
          ? (t.suggestionCategory?.trim() || 'Other')
          : undefined;
      await this.storage.updateClassification(t.id, {
        classificationType: type,
        classificationCategory: category,
        classificationNotes: undefined,
      });
    }
    this.edits.set({});
    this.selectedTransactionId.set(null);
    await this.refreshList();
  }
}
