import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';

export interface LedgerFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  account: string;
  flow: 'all' | 'in' | 'out';
}

@Component({
  selector: 'app-transaction-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters">
      <label
        >Search
        <input
          type="text"
          [value]="search()"
          (input)="onSearch($event)"
          placeholder="Description or amount"
      /></label>
      <label>From <input type="date" [value]="dateFrom()" (input)="onDateFrom($event)" /></label>
      <label>To <input type="date" [value]="dateTo()" (input)="onDateTo($event)" /></label>
      <label
        >Account
        <select [value]="account()" (change)="onAccount($event)">
          <option value="">All</option>
          @for (a of accounts(); track a) {
            <option [value]="a">{{ a }}</option>
          }
        </select></label
      >
      <label
        >Flow
        <select [value]="flow()" (change)="onFlow($event)">
          <option value="all">All</option>
          <option value="in">Inflow</option>
          <option value="out">Outflow</option>
        </select></label
      >
      <button type="button" (click)="clear()">Clear</button>
    </div>
  `,
  styles: [
    `
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
      }
      .filters label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
    `,
  ],
})
export class TransactionFiltersComponent {
  readonly search = input<string>('');
  readonly dateFrom = input<string>('');
  readonly dateTo = input<string>('');
  readonly account = input<string>('');
  readonly flow = input<'all' | 'in' | 'out'>('all');
  readonly accounts = input<string[]>([]);

  readonly filtersChange = output<LedgerFilters>();

  onSearch(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.filtersChange.emit({ ...this.current(), search: v });
  }

  onDateFrom(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.filtersChange.emit({ ...this.current(), dateFrom: v });
  }

  onDateTo(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.filtersChange.emit({ ...this.current(), dateTo: v });
  }

  onAccount(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.filtersChange.emit({ ...this.current(), account: v });
  }

  onFlow(event: Event): void {
    const v = (event.target as HTMLSelectElement).value as 'all' | 'in' | 'out';
    this.filtersChange.emit({ ...this.current(), flow: v });
  }

  clear(): void {
    this.filtersChange.emit({
      search: '',
      dateFrom: '',
      dateTo: '',
      account: '',
      flow: 'all',
    });
  }

  private current(): LedgerFilters {
    return {
      search: this.search(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
      account: this.account(),
      flow: this.flow(),
    };
  }
}
