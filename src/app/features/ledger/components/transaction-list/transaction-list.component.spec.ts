import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionListComponent } from './transaction-list.component';
import { Transaction } from '../../../../core/models/transaction';

describe('TransactionListComponent', () => {
  let component: TransactionListComponent;
  let fixture: ComponentFixture<TransactionListComponent>;

  const sample: Transaction[] = [
    {
      id: '1',
      date: '2025-01-01',
      description: 'Test',
      amount: -10,
      account: 'Checking',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('transactions', sample);
    fixture.componentRef.setInput('totalItems', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render transaction rows with date, description, amount, account', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('2025-01-01');
    expect(el.textContent).toContain('Test');
    expect(el.textContent).toContain('Checking');
  });

  it('should emit selectionChange when row checkbox toggled', () => {
    fixture.componentRef.setInput('selectedIds', []);
    fixture.detectChanges();
    let emitted: string[] = [];
    component.selectionChange.subscribe((ids) => (emitted = ids));
    component.onToggleSelect('1');
    expect(emitted).toEqual(['1']);
    fixture.componentRef.setInput('selectedIds', ['1']);
    fixture.detectChanges();
    component.onToggleSelect('1');
    expect(emitted).toEqual([]);
  });

  it('should have select-all checkbox that toggles all on page', () => {
    const two: Transaction[] = [
      { id: 'a', date: '2025-01-01', description: 'A', amount: 1, account: 'C' },
      { id: 'b', date: '2025-01-02', description: 'B', amount: 2, account: 'C' },
    ];
    fixture.componentRef.setInput('transactions', two);
    fixture.componentRef.setInput('selectedIds', []);
    fixture.componentRef.setInput('totalItems', 2);
    fixture.detectChanges();
    let emitted: string[] = [];
    component.selectionChange.subscribe((ids) => (emitted = ids));
    component.onSelectAllPage({ target: { checked: true } } as unknown as Event);
    expect(emitted).toEqual(['a', 'b']);
  });
});
