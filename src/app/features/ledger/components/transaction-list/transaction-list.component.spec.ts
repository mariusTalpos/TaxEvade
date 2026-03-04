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
});
