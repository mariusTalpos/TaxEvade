import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  computed,
  OnInit,
} from '@angular/core';
import { LedgerStorageService } from '../../../../core/services/ledger-storage.service';
import { CsvParserService } from '../../../../core/services/csv-parser.service';
import { ClassificationHeuristicsService } from '../../../../core/services/classification-heuristics.service';
import { ImportFilePickerComponent } from '../../components/import-file-picker/import-file-picker.component';
import { TransactionListComponent } from '../../components/transaction-list/transaction-list.component';
import {
  TransactionFiltersComponent,
  LedgerFilters,
} from '../../components/transaction-filters/transaction-filters.component';
import { AccountNameInputComponent } from '../../components/account-name-input/account-name-input.component';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { ImportResult, Transaction } from '../../../../core/models/transaction';

export interface ConfirmState {
  title: string;
  message: string;
  onConfirm: () => void;
}

const DEFAULT_PAGE_SIZE = 25;

@Component({
  selector: 'app-ledger-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ImportFilePickerComponent,
    TransactionListComponent,
    TransactionFiltersComponent,
    AccountNameInputComponent,
    ConfirmationDialogComponent,
  ],
  template: `
    <h1>Ledger</h1>
    <section class="import-section">
      <h2>Import CSV</h2>
      <app-account-name-input
        [suggestions]="accountSuggestions()"
        (accountSelected)="accountName.set($event)"
      />
      <app-import-file-picker (fileSelected)="onFileSelected($event)" />
    </section>
    @if (importResult(); as result) {
      <div class="import-result">
        @if (result.error) {
          <p class="error">{{ result.error }}</p>
        } @else {
          <p>{{ result.added }} transaction(s) added.</p>
          @if (result.skippedAsDuplicate > 0) {
            <p>{{ result.skippedAsDuplicate }} duplicate(s) skipped.</p>
          }
          @if ((result.skippedInvalid ?? 0) > 0) {
            <p>{{ result.skippedInvalid }} row(s) skipped due to errors.</p>
          }
          @if (
            result.added === 0 &&
            result.skippedAsDuplicate === 0 &&
            (result.skippedInvalid ?? 0) === 0
          ) {
            <p>No transactions found in file.</p>
          }
        }
      </div>
    }
    @if (confirmState(); as state) {
      <div class="dialog-overlay" role="presentation">
        <app-confirmation-dialog
          [title]="state.title"
          [message]="state.message"
          (confirmed)="state.onConfirm(); confirmState.set(null)"
          (cancelled)="confirmState.set(null)"
        />
      </div>
    }
    <section class="actions">
      <button type="button" (click)="onClearAllClick()">Clear all</button>
      <button
        type="button"
        [disabled]="selectedIds().length === 0"
        (click)="onDeleteSelectedClick()"
      >
        Delete selected ({{ selectedIds().length }})
      </button>
    </section>
    <app-transaction-filters
      [search]="filterState().search"
      [dateFrom]="filterState().dateFrom"
      [dateTo]="filterState().dateTo"
      [account]="filterState().account"
      [flow]="filterState().flow"
      [accounts]="uniqueAccounts()"
      (filtersChange)="onFiltersChange($event)"
    />
    <app-transaction-list
      [transactions]="paginatedList()"
      [pageSize]="pageSize()"
      [currentPage]="currentPage()"
      [totalItems]="filteredList().length"
      [selectedIds]="selectedIds()"
      (pageSizeChange)="onPageSizeChange($event)"
      (pageChange)="onPageChange($event)"
      (selectionChange)="selectedIds.set($event)"
    />
  `,
  styles: [
    `
      .import-section {
        margin-bottom: 1.5rem;
      }
      .import-section app-account-name-input {
        margin-bottom: 0.5rem;
      }
      .dialog-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .actions {
        margin: 1rem 0;
        display: flex;
        gap: 0.75rem;
      }
      .actions button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .import-result {
        margin-top: 1rem;
      }
      .error {
        color: #c00;
      }
    `,
  ],
})
export class LedgerPageComponent implements OnInit {
  private readonly storage = inject(LedgerStorageService);
  private readonly parser = inject(CsvParserService);
  private readonly heuristics = inject(ClassificationHeuristicsService);

  readonly importResult = signal<ImportResult | null>(null);
  readonly transactions = signal<Transaction[]>([]);
  readonly accountName = signal<string>('');
  readonly accountSuggestions = signal<string[]>([]);
  readonly selectedIds = signal<string[]>([]);
  readonly confirmState = signal<ConfirmState | null>(null);
  readonly filterState = signal<LedgerFilters>({
    search: '',
    dateFrom: '',
    dateTo: '',
    account: '',
    flow: 'all',
  });
  readonly pageSize = signal<number>(DEFAULT_PAGE_SIZE);
  readonly currentPage = signal<number>(1);

  readonly uniqueAccounts = computed(() => {
    const txs = this.transactions();
    const set = new Set(txs.map((t) => t.account));
    return Array.from(set).sort();
  });

  readonly filteredList = computed(() => {
    const txs = this.transactions();
    const f = this.filterState();
    let list = txs;
    if (f.search.trim()) {
      const q = f.search.trim().toLowerCase();
      list = list.filter(
        (t) => t.description.toLowerCase().includes(q) || String(t.amount).includes(q)
      );
    }
    if (f.dateFrom) {
      list = list.filter((t) => t.date >= f.dateFrom);
    }
    if (f.dateTo) {
      list = list.filter((t) => t.date <= f.dateTo);
    }
    if (f.account) {
      list = list.filter((t) => t.account === f.account);
    }
    if (f.flow === 'in') list = list.filter((t) => t.amount >= 0);
    if (f.flow === 'out') list = list.filter((t) => t.amount < 0);
    return list;
  });

  readonly totalPages = computed(() => {
    const size = this.pageSize();
    const total = this.filteredList().length;
    return size > 0 ? Math.ceil(total / size) : 0;
  });

  readonly paginatedList = computed(() => {
    const list = this.filteredList();
    const size = this.pageSize();
    const page = this.currentPage();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  ngOnInit(): void {
    this.storage.getAll().then((txs) => this.transactions.set(txs));
    this.storage.getDistinctAccountNames().then((names) => this.accountSuggestions.set(names));
  }

  onFiltersChange(f: LedgerFilters): void {
    this.filterState.set(f);
    this.currentPage.set(1);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onClearAllClick(): void {
    this.confirmState.set({
      title: 'Clear ledger',
      message: 'Clear all transactions? This cannot be undone.',
      onConfirm: () => this.doClearAll(),
    });
  }

  async doClearAll(): Promise<void> {
    await this.storage.clearAll();
    this.transactions.set([]);
    this.selectedIds.set([]);
    this.accountSuggestions.set(await this.storage.getDistinctAccountNames());
  }

  onDeleteSelectedClick(): void {
    const ids = this.selectedIds();
    const n = ids.length;
    this.confirmState.set({
      title: 'Delete selected',
      message: `Delete ${n} selected transaction(s)?`,
      onConfirm: () => this.doDeleteByIds(ids),
    });
  }

  async doDeleteByIds(ids: string[]): Promise<void> {
    await this.storage.deleteByIds(ids);
    this.transactions.set(await this.storage.getAll());
    this.selectedIds.set([]);
  }

  async onFileSelected(file: File): Promise<void> {
    const text = await file.text();
    const parseResult = this.parser.parse(text);

    if (parseResult.error) {
      this.importResult.set({
        added: 0,
        skippedAsDuplicate: 0,
        skippedInvalid: parseResult.skippedInvalid,
        error: parseResult.error,
      });
      return;
    }

    if (parseResult.rows.length === 0) {
      this.importResult.set({
        added: 0,
        skippedAsDuplicate: 0,
        skippedInvalid: parseResult.skippedInvalid,
        error: parseResult.skippedInvalid > 0 ? undefined : 'No transactions found in file.',
      });
      return;
    }

    const account = this.accountName().trim();
    if (!account) {
      this.importResult.set({
        added: 0,
        skippedAsDuplicate: 0,
        skippedInvalid: parseResult.skippedInvalid,
        error: 'Please enter an account name first.',
      });
      return;
    }
    const result = await this.storage.addTransactions(parseResult.rows, account);
    // Run heuristics on newly added transactions and persist suggestions (no user-defined rules)
    const added = result.addedTransactions ?? [];
    for (const tx of added) {
      const suggestion = await this.heuristics.suggest(tx);
      if (suggestion) {
        await this.storage.updateTransaction(tx.id, {
          suggestionType: suggestion.type,
          suggestionCategory: suggestion.category,
          suggestionConfidence: suggestion.confidence,
          suggestionSourceId: suggestion.sourceId,
        });
      }
    }
    this.importResult.set({
      ...result,
      skippedInvalid: parseResult.skippedInvalid,
    });
    const txs = await this.storage.getAll();
    this.transactions.set(txs);
    this.accountSuggestions.set(await this.storage.getDistinctAccountNames());
  }
}
