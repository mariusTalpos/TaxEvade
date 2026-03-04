import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Transaction } from '../../../../core/models/transaction';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th>In/Out</th>
          <th>Account</th>
        </tr>
      </thead>
      <tbody>
        @for (t of transactions(); track t.id) {
          <tr>
            <td>{{ t.date }}</td>
            <td>{{ t.description }}</td>
            <td>{{ t.amount | number: '1.2-2' }}</td>
            <td>{{ t.amount >= 0 ? 'In' : 'Out' }}</td>
            <td>{{ t.account }}</td>
          </tr>
        } @empty {
          <tr>
            <td colspan="5">No transactions to show.</td>
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
      .pagination {
        margin-top: 1rem;
        display: flex;
        gap: 1rem;
        align-items: center;
      }
    `,
  ],
})
export class TransactionListComponent {
  readonly transactions = input.required<Transaction[]>();
  readonly pageSize = input<number>(25);
  readonly currentPage = input<number>(1);
  readonly totalItems = input<number>(0);

  totalPages(): number {
    const size = this.pageSize();
    const total = this.totalItems();
    return size > 0 ? Math.ceil(total / size) : 0;
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = Number(select.value);
    this.pageSizeChange.emit(value);
  }

  onPrevPage(): void {
    this.pageChange.emit(this.currentPage() - 1);
  }

  onNextPage(): void {
    this.pageChange.emit(this.currentPage() + 1);
  }

  pageSizeChange = output<number>();
  pageChange = output<number>();
}
