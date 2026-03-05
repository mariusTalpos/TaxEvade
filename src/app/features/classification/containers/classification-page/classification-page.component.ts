import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClassificationTableComponent } from '../../components/classification-table/classification-table.component';
import { LedgerStorageService } from '../../../../core/services/ledger-storage.service';
import { ClassificationConfigService } from '../../../../core/services/classification-config.service';
import type { Transaction } from '../../../../core/models/transaction';
import type { ClassificationType, Confidence } from '../../../../core/models/classification.model';
import { confidenceAtOrAbove } from '../../../../core/models/classification.model';

const DEFAULT_PAGE_SIZE = 25;
const CONFIDENCE_SUBMIT_OPTIONS: { threshold: Confidence; label: string }[] = [
  { threshold: 'High', label: 'Submit High only' },
  { threshold: 'Medium', label: 'Submit Medium or higher' },
  { threshold: 'Low', label: 'Submit Low or higher' },
];

@Component({
  selector: 'app-classification-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClassificationTableComponent, RouterLink],
  template: `
    <h1>Classification</h1>
    <p>Review and submit classifications for unclassified transactions.</p>
    <p>
      <a routerLink="edit">Edit classifications</a> (view or modify already classified transactions).
    </p>

    @if (loading()) {
      <p>Loading…</p>
    } @else {
      <div class="actions">
        <button
          type="button"
          [disabled]="!selectedTransactionId()"
          (click)="submitCurrent()"
        >
          Submit (current)
        </button>
        <button type="button" (click)="submitAll()">Submit All</button>
        @for (opt of confidenceSubmitOptions; track opt.threshold) {
          <button type="button" (click)="submitByConfidence(opt.threshold)">
            {{ opt.label }}
          </button>
        }
      </div>

      <app-classification-table
        [transactions]="paginatedList()"
        [pageSize]="pageSize()"
        [currentPage]="currentPage()"
        [totalItems]="unclassifiedList().length"
        [selectedId]="selectedTransactionId()"
        [edits]="edits()"
        (selectionChange)="selectedTransactionId.set($event)"
        (editsChange)="edits.set($event)"
        (pageSizeChange)="onPageSizeChange($event)"
        (pageChange)="currentPage.set($event)"
      />
    }
  `,
  styles: [
    `
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
  readonly unclassifiedList = signal<Transaction[]>([]);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly currentPage = signal(1);
  readonly selectedTransactionId = signal<string | null>(null);
  readonly edits = signal<
    Record<string, { type: ClassificationType; category: string; notes: string }>
  >({});

  readonly confidenceSubmitOptions = CONFIDENCE_SUBMIT_OPTIONS;

  readonly paginatedList = computed(() => {
    const list = this.unclassifiedList();
    const size = this.pageSize();
    const page = this.currentPage();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  constructor() {
    effect(() => {
      const list = this.unclassifiedList();
      const page = this.currentPage();
      const size = this.pageSize();
      const maxPage = size > 0 ? Math.ceil(list.length / size) : 1;
      if (page > maxPage && maxPage >= 1) {
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
    const list = await this.storage.getUnclassified();
    this.unclassifiedList.set(this.sortByDate(list));
    const size = this.pageSize();
    const total = list.length;
    const maxPage = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1;
    if (this.currentPage() > maxPage) {
      this.currentPage.set(maxPage);
    }
  }

  private sortByDate(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0));
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  private getEffective(
    t: Transaction
  ): { type: ClassificationType; category: string; notes: string } {
    const e = this.edits()[t.id];
    if (e) return e;
    return {
      type: t.suggestionType ?? 'expense',
      category: t.suggestionCategory ?? '',
      notes: '',
    };
  }

  private validateCategory(
    type: ClassificationType,
    category: string
  ): { valid: boolean; message?: string } {
    if (type !== 'income' && type !== 'expense') return { valid: true };
    const trimmed = category?.trim() ?? '';
    if (!trimmed) return { valid: false, message: 'Category is required for income/expense.' };
    const allowed = this.configService.getCategories();
    if (allowed.length > 0 && !allowed.includes(trimmed)) {
      return { valid: false, message: `Category must be one of: ${allowed.join(', ')}` };
    }
    return { valid: true };
  }

  private hasSuggestionOrEdit(t: Transaction): boolean {
    const e = this.edits()[t.id];
    if (e) return true;
    return (
      t.suggestionType != null ||
      (t.suggestionCategory != null && t.suggestionCategory.trim() !== '')
    );
  }

  async submitCurrent(): Promise<void> {
    const id = this.selectedTransactionId();
    if (!id) return;
    const list = this.unclassifiedList();
    const t = list.find((x) => x.id === id);
    if (!t) return;
    const { type, category, notes } = this.getEffective(t);
    const validation = this.validateCategory(type, category);
    if (!validation.valid) {
      alert(validation.message);
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
    await this.refreshList();
  }

  async submitAll(): Promise<void> {
    const list = this.unclassifiedList();
    const toUpdate = list.filter((t) => this.hasSuggestionOrEdit(t));
    for (const t of toUpdate) {
      const { type, category, notes } = this.getEffective(t);
      const validation = this.validateCategory(type, category);
      if (!validation.valid) {
        alert(`Transaction ${t.id}: ${validation.message}`);
        return;
      }
      await this.storage.updateClassification(t.id, {
        classificationType: type,
        classificationCategory: category?.trim() || undefined,
        classificationNotes: notes?.trim() || undefined,
      });
    }
    this.edits.set({});
    this.selectedTransactionId.set(null);
    await this.refreshList();
  }

  async submitByConfidence(threshold: Confidence): Promise<void> {
    const list = this.unclassifiedList();
    const toUpdate = list.filter(
      (t) =>
        t.suggestionConfidence != null &&
        confidenceAtOrAbove(t.suggestionConfidence, threshold) &&
        this.hasSuggestionOrEdit(t)
    );
    for (const t of toUpdate) {
      const { type, category, notes } = this.getEffective(t);
      const validation = this.validateCategory(type, category);
      if (!validation.valid) {
        alert(`Transaction ${t.id}: ${validation.message}`);
        return;
      }
      await this.storage.updateClassification(t.id, {
        classificationType: type,
        classificationCategory: category?.trim() || undefined,
        classificationNotes: notes?.trim() || undefined,
      });
    }
    this.edits.set({});
    this.selectedTransactionId.set(null);
    await this.refreshList();
  }
}
