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
import { ImportFilePickerComponent } from '../../components/import-file-picker/import-file-picker.component';
import { TransactionListComponent } from '../../components/transaction-list/transaction-list.component';
import {
  TransactionFiltersComponent,
  LedgerFilters,
} from '../../components/transaction-filters/transaction-filters.component';
import { ImportResult, Transaction } from '../../../../core/models/transaction';

const DEFAULT_PAGE_SIZE = 25;

@Component({
  selector: 'app-ledger-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ImportFilePickerComponent, TransactionListComponent, TransactionFiltersComponent],
  template: `
    <h1>Ledger</h1>
    <app-import-file-picker (fileSelected)="onFileSelected($event)" />
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
      (pageSizeChange)="onPageSizeChange($event)"
      (pageChange)="onPageChange($event)"
    />
  `,
  styles: [
    `
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

  readonly importResult = signal<ImportResult | null>(null);
  readonly transactions = signal<Transaction[]>([]);
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

    const account = 'Wells Fargo';
    const result = await this.storage.addTransactions(parseResult.rows, account);
    this.importResult.set({
      ...result,
      skippedInvalid: parseResult.skippedInvalid,
    });
    const txs = await this.storage.getAll();
    this.transactions.set(txs);
  }
}
