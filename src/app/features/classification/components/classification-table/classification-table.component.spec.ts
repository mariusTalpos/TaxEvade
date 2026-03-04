import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClassificationTableComponent } from './classification-table.component';
import type { Transaction } from '../../../../core/models/transaction';

describe('ClassificationTableComponent', () => {
  let component: ClassificationTableComponent;
  let fixture: ComponentFixture<ClassificationTableComponent>;

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      date: '2025-01-15',
      description: 'Coffee',
      amount: -5.5,
      account: 'Checking',
      suggestionType: 'expense',
      suggestionCategory: 'Food',
      suggestionConfidence: 'High',
      suggestionSourceId: 'merchant',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassificationTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassificationTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('transactions', mockTransactions);
    fixture.componentRef.setInput('pageSize', 25);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalItems', 1);
    fixture.componentRef.setInput('selectedId', null);
    fixture.componentRef.setInput('edits', {});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display transaction and suggestion', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('2025-01-15');
    expect(el.textContent).toContain('Coffee');
    expect(el.textContent).toContain('High');
    expect(el.textContent).toContain('merchant');
    const categoryInput = el.querySelector<HTMLInputElement>('input[placeholder="Category"]');
    expect(categoryInput?.value).toBe('Food');
  });

  it('should emit selection when row is selected', () => {
    let emitted: string | null = undefined!;
    component.selectionChange.subscribe((id) => (emitted = id));
    component.onSelectRow('tx-1');
    expect(emitted).toBe('tx-1');
  });

  it('should emit null when select none', () => {
    let emitted: string | null = undefined!;
    component.selectionChange.subscribe((id) => (emitted = id));
    component.onSelectNone();
    expect(emitted).toBeNull();
  });
});
