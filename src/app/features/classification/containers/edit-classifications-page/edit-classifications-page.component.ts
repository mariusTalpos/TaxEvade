import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
  effect,
  ViewChild,
} from '@angular/core';
import { EditClassificationsTableComponent } from '../../components/edit-classifications-table/edit-classifications-table.component';
import { LedgerStorageService } from '../../../../core/services/ledger-storage.service';
import { ClassificationConfigService } from '../../../../core/services/classification-config.service';
import type { Transaction } from '../../../../core/models/transaction';
import type { ClassificationType } from '../../../../core/models/classification.model';

export type SortColumn = 'date' | 'amount' | 'type' | 'category';
export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-edit-classifications-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditClassificationsTableComponent],
  template: `
    <h1>Edit Classifications</h1>
    <p>View and modify classified transactions.</p>

    @if (loading()) {
      <p>Loading…</p>
    } @else {
      <div class="filters">
        <label>
          Type:
          <select [value]="filterType()" (change)="onFilterTypeChange($event)">
            <option value="">All</option>
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
          Sort by:
          <select [value]="sortColumn()" (change)="onSortColumnChange($event)">
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="type">Type</option>
            <option value="category">Category</option>
          </select>
        </label>
        <label>
          <select [value]="sortDirection()" (change)="onSortDirectionChange($event)">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
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
      </div>
      <app-edit-classifications-table
        [transactions]="paginatedList()"
        [selectedId]="selectedTransactionId()"
        [categories]="allCategories()"
        [draftType]="draftType()"
        [draftCategory]="draftCategory()"
        [draftNotes]="draftNotes()"
        (selectionChange)="onSelectionChange($event)"
        (draftChange)="onDraftChange($event)"
      />
      @if (sortedList().length > 0) {
        <div class="pagination">
          <span>Rows per page:</span>
          <select [value]="pageSize()" (change)="onPageSizeChange($event)">
            <option [value]="25">25</option>
            <option [value]="50">50</option>
            <option [value]="100">100</option>
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
      .pagination {
        margin-top: 1rem;
        display: flex;
        gap: 1rem;
        align-items: center;
      }
    `,
  ],
})
export class EditClassificationsPageComponent implements OnInit {
  @ViewChild(EditClassificationsTableComponent)
  editTable?: EditClassificationsTableComponent;

  private readonly storage = inject(LedgerStorageService);
  private readonly configService = inject(ClassificationConfigService);

  readonly loading = signal(true);
  readonly classifiedList = signal<Transaction[]>([]);
  readonly filterType = signal<ClassificationType | ''>('');
  readonly filterCategory = signal<string>('');
  readonly sortColumn = signal<SortColumn>('date');
  readonly sortDirection = signal<SortDirection>('desc');
  readonly pageSize = signal(25);
  readonly currentPage = signal(1);
  readonly selectedTransactionId = signal<string | null>(null);
  readonly draftType = signal<ClassificationType | ''>('');
  readonly draftCategory = signal<string>('');
  readonly draftNotes = signal<string>('');
  readonly validationMessage = signal<string>('');

  readonly typeOptions: ClassificationType[] = ['income', 'expense', 'transfer', 'ignore'];

  readonly categoryOptions = signal<string[]>([]);
  readonly allCategories = computed(() => {
    const fromList = this.categoryOptions();
    const fromConfig = this.configService.getCategories();
    const set = new Set([...fromConfig, ...fromList]);
    return Array.from(set).sort();
  });

  readonly filteredList = computed(() => {
    const list = this.classifiedList();
    const typeFilter = this.filterType();
    const categoryFilter = this.filterCategory().trim();
    let result = list;
    if (typeFilter) {
      result = result.filter((t) => t.classificationType === typeFilter);
    }
    if (categoryFilter) {
      result = result.filter(
        (t) => (t.classificationCategory ?? '').trim() === categoryFilter
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
          cmp = (a.classificationType ?? '').localeCompare(b.classificationType ?? '');
          break;
        case 'category':
          cmp = (a.classificationCategory ?? '').localeCompare(
            b.classificationCategory ?? ''
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

  readonly totalPages = computed(() => {
    const size = this.pageSize();
    const total = this.sortedList().length;
    return size > 0 ? Math.max(1, Math.ceil(total / size)) : 1;
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

  onSelectionChange(id: string | null): void {
    this.selectedTransactionId.set(id);
    this.validationMessage.set('');
    if (id) {
      const list = this.classifiedList();
      const t = list.find((x) => x.id === id);
      if (t) {
        this.draftType.set((t.classificationType as ClassificationType) ?? '');
        this.draftCategory.set(t.classificationCategory ?? '');
        this.draftNotes.set(t.classificationNotes ?? '');
      }
    } else {
      this.draftType.set('');
      this.draftCategory.set('');
      this.draftNotes.set('');
    }
  }

  onDraftChange(draft: { type: ClassificationType | ''; category: string; notes: string }): void {
    this.draftType.set(draft.type);
    this.draftCategory.set(draft.category);
    this.draftNotes.set(draft.notes);
    this.validationMessage.set('');
  }

  private validateCategory(
    type: ClassificationType | '',
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
    const draft = this.editTable?.getDraft() ?? {
      type: this.draftType(),
      category: this.draftCategory(),
      notes: this.draftNotes(),
    };
    const type = draft.type;
    const category = draft.category;
    const notes = draft.notes;
    if (type === '') {
      this.validationMessage.set('Select a type or use Clear to unclassify.');
      return;
    }
    const validation = this.validateCategory(type, category);
    if (!validation.valid) {
      this.validationMessage.set(validation.message ?? '');
      return;
    }
    await this.storage.updateClassification(id, {
      classificationType: type as ClassificationType,
      classificationCategory: category?.trim() || undefined,
      classificationNotes: notes?.trim() || undefined,
    });
    this.selectedTransactionId.set(null);
    this.draftType.set('');
    this.draftCategory.set('');
    this.draftNotes.set('');
    this.validationMessage.set('');
    await this.refreshList();
  }

  async onClearClassification(): Promise<void> {
    const id = this.selectedTransactionId();
    if (!id) return;
    await this.storage.clearClassification(id);
    this.selectedTransactionId.set(null);
    this.draftType.set('');
    this.draftCategory.set('');
    this.draftNotes.set('');
    this.validationMessage.set('');
    await this.refreshList();
  }

  async refreshList(): Promise<void> {
    const list = await this.storage.getClassified();
    this.classifiedList.set(this.sortByDate(list));
    this.updateCategoryOptions();
  }

  private sortByDate(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((a, b) =>
      (b.date ?? '').localeCompare(a.date ?? '')
    );
  }

  private updateCategoryOptions(): void {
    const list = this.classifiedList();
    const set = new Set<string>();
    list.forEach((t) => {
      const c = (t.classificationCategory ?? '').trim();
      if (c) set.add(c);
    });
    this.categoryOptions.set(Array.from(set).sort());
  }

  onFilterTypeChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as ClassificationType | '';
    this.filterType.set(val === '' ? '' : val);
  }

  onFilterCategoryChange(event: Event): void {
    this.filterCategory.set((event.target as HTMLSelectElement).value);
  }

  onSortColumnChange(event: Event): void {
    this.sortColumn.set((event.target as HTMLSelectElement).value as SortColumn);
  }

  onSortDirectionChange(event: Event): void {
    this.sortDirection.set((event.target as HTMLSelectElement).value as SortDirection);
  }

  onPageSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  onPrevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  onNextPage(): void {
    const max = this.totalPages();
    this.currentPage.update((p) => Math.min(max, p + 1));
  }
}
