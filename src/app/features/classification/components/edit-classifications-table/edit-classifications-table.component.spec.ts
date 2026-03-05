import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditClassificationsTableComponent } from './edit-classifications-table.component';
import type { Transaction } from '../../../../core/models/transaction';

describe('EditClassificationsTableComponent', () => {
  let component: EditClassificationsTableComponent;
  let fixture: ComponentFixture<EditClassificationsTableComponent>;

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      date: '2025-01-15',
      description: 'Coffee',
      amount: -5.5,
      account: 'Checking',
      classificationType: 'expense',
      classificationCategory: 'Food',
      classificationNotes: 'Test note',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditClassificationsTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditClassificationsTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('transactions', mockTransactions);
    fixture.componentRef.setInput('selectedId', null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display transaction rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('2025-01-15');
    expect(rows[0].textContent).toContain('Coffee');
    expect(rows[0].textContent).toContain('expense');
    expect(rows[0].textContent).toContain('Food');
    expect(rows[0].textContent).toContain('Test note');
  });

  it('should show empty state when no transactions', () => {
    fixture.componentRef.setInput('transactions', []);
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('tbody td[colspan="7"]');
    expect(cell).toBeTruthy();
    expect(cell.textContent).toContain('No classified transactions');
  });

  it('should emit selectionChange when row is selected', () => {
    let emitted: string | null = undefined!;
    component.selectionChange.subscribe((id) => (emitted = id));
    component.onSelectRow('tx-1');
    expect(emitted).toBe('tx-1');
  });

  it('should emit draftChange when type changes', () => {
    fixture.componentRef.setInput('selectedId', 'tx-1');
    fixture.componentRef.setInput('draftType', 'expense');
    fixture.componentRef.setInput('draftCategory', 'Food');
    fixture.componentRef.setInput('draftNotes', '');
    fixture.componentRef.setInput('categories', ['Food', 'Travel']);
    fixture.detectChanges();
    let emitted: { type: string; category: string; notes: string } | undefined;
    component.draftChange.subscribe((d) => (emitted = d));
    const select = fixture.nativeElement.querySelector('select');
    select.value = 'income';
    select.dispatchEvent(new Event('change'));
    expect(emitted).toBeDefined();
    expect(emitted!.type).toBe('income');
  });

  it('should return current draft from getDraft() and reflect income when input is income', () => {
    fixture.componentRef.setInput('selectedId', 'tx-1');
    fixture.componentRef.setInput('draftType', 'income');
    fixture.componentRef.setInput('draftCategory', 'Salary');
    fixture.componentRef.setInput('draftNotes', 'Note');
    fixture.componentRef.setInput('categories', ['Salary']);
    fixture.detectChanges();
    const draft = component.getDraft();
    expect(draft.type).toBe('income');
    expect(draft.category).toBe('Salary');
    expect(draft.notes).toBe('Note');
  });

  it('should have getDraft() return income after user changes type to income', () => {
    fixture.componentRef.setInput('selectedId', 'tx-1');
    fixture.componentRef.setInput('draftType', 'expense');
    fixture.componentRef.setInput('draftCategory', 'Food');
    fixture.componentRef.setInput('draftNotes', '');
    fixture.componentRef.setInput('categories', ['Food', 'Travel']);
    fixture.detectChanges();
    const typeSelect = fixture.nativeElement.querySelector('select');
    typeSelect.value = 'income';
    typeSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.getDraft().type).toBe('income');
  });
});
