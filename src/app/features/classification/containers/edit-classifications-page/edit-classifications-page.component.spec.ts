import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EditClassificationsPageComponent } from './edit-classifications-page.component';
import { LedgerStorageService } from '../../../../core/services/ledger-storage.service';
import { ClassificationConfigService } from '../../../../core/services/classification-config.service';
import type { Transaction } from '../../../../core/models/transaction';

describe('EditClassificationsPageComponent', () => {
  let component: EditClassificationsPageComponent;
  let fixture: ComponentFixture<EditClassificationsPageComponent>;
  let getClassifiedSpy: jasmine.Spy;
  let updateClassificationSpy: jasmine.Spy;
  let clearClassificationSpy: jasmine.Spy;

  const mockClassified: Transaction[] = [
    {
      id: 'tx-1',
      date: '2025-01-15',
      description: 'Coffee',
      amount: -5.5,
      account: 'Checking',
      classificationType: 'expense',
      classificationCategory: 'Food',
      classificationNotes: '',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditClassificationsPageComponent, HttpClientTestingModule],
      providers: [LedgerStorageService, ClassificationConfigService],
    }).compileComponents();

    const storage = TestBed.inject(LedgerStorageService);
    const config = TestBed.inject(ClassificationConfigService);
    getClassifiedSpy = spyOn(storage, 'getClassified').and.returnValue(
      Promise.resolve([...mockClassified])
    );
    updateClassificationSpy = spyOn(storage, 'updateClassification').and.returnValue(Promise.resolve());
    clearClassificationSpy = spyOn(storage, 'clearClassification').and.returnValue(Promise.resolve());
    spyOn(config, 'load').and.returnValue(
      Promise.resolve({ categories: ['Food', 'Travel'], merchants: [], patterns: [] } as never)
    );
    spyOn(config, 'getCategories').and.returnValue(['Food', 'Travel']);

    fixture = TestBed.createComponent(EditClassificationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load classified list on init', async () => {
    expect(getClassifiedSpy).toHaveBeenCalled();
    expect(component.classifiedList().length).toBe(1);
    expect(component.classifiedList()[0].id).toBe('tx-1');
    expect(component.classifiedList()[0].classificationType).toBe('expense');
    expect(component.loading()).toBe(false);
  });

  it('should show empty state when getClassified returns empty', async () => {
    getClassifiedSpy.and.returnValue(Promise.resolve([]));
    fixture = TestBed.createComponent(EditClassificationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.classifiedList().length).toBe(0);
    expect(component.sortedList().length).toBe(0);
  });

  it('should set draft when selection changes', () => {
    component.onSelectionChange('tx-1');
    expect(component.draftType()).toBe('expense');
    expect(component.draftCategory()).toBe('Food');
    expect(component.draftNotes()).toBe('');
    component.onSelectionChange(null);
    expect(component.draftType()).toBe('');
    expect(component.draftCategory()).toBe('');
  });

  it('should set draft to income when selected transaction has classificationType income', async () => {
    getClassifiedSpy.and.returnValue(
      Promise.resolve([
        {
          id: 'tx-income',
          date: '2025-01-10',
          description: 'Salary',
          amount: 3000,
          account: 'Checking',
          classificationType: 'income',
          classificationCategory: 'Salary',
          classificationNotes: '',
        },
      ])
    );
    fixture = TestBed.createComponent(EditClassificationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    component.onSelectionChange('tx-income');
    expect(component.draftType()).toBe('income');
    expect(component.draftCategory()).toBe('Salary');
  });

  it('should call updateClassification with classificationType income when saving as income', async () => {
    component.onSelectionChange('tx-1');
    component.onDraftChange({ type: 'income', category: 'Salary', notes: 'Monthly' });
    fixture.detectChanges(); // so table's getDraft() sees the draft
    await component.onSave();
    expect(updateClassificationSpy).toHaveBeenCalledWith('tx-1', {
      classificationType: 'income',
      classificationCategory: 'Salary',
      classificationNotes: 'Monthly',
    });
  });

  it('should save and refresh list when valid', async () => {
    component.onSelectionChange('tx-1');
    component.onDraftChange({ type: 'expense', category: 'Food', notes: 'x' });
    fixture.detectChanges(); // so table's getDraft() sees the draft
    await component.onSave();
    expect(updateClassificationSpy).toHaveBeenCalledWith('tx-1', {
      classificationType: 'expense',
      classificationCategory: 'Food',
      classificationNotes: 'x',
    });
    expect(component.selectedTransactionId()).toBeNull();
    expect(getClassifiedSpy).toHaveBeenCalledTimes(2);
  });

  it('should not persist when income/expense without category', async () => {
    component.onSelectionChange('tx-1');
    component.onDraftChange({ type: 'expense', category: '', notes: '' });
    fixture.detectChanges(); // so table's getDraft() sees the draft
    await component.onSave();
    expect(updateClassificationSpy).not.toHaveBeenCalled();
    expect(component.validationMessage()).toContain('Category is required');
  });

  it('should clear classification and refresh list', async () => {
    component.onSelectionChange('tx-1');
    await component.onClearClassification();
    expect(clearClassificationSpy).toHaveBeenCalledWith('tx-1');
    expect(component.selectedTransactionId()).toBeNull();
    expect(getClassifiedSpy).toHaveBeenCalledTimes(2);
  });

  it('should paginate and preserve sort order across pages', async () => {
    getClassifiedSpy.and.returnValue(
      Promise.resolve(
        Array.from({ length: 30 }, (_, i) => ({
          id: `tx-${i}`,
          date: '2025-01-15',
          description: `Item ${i}`,
          amount: -i,
          account: 'Checking',
          classificationType: 'expense' as const,
          classificationCategory: 'Food',
        }))
      )
    );
    fixture = TestBed.createComponent(EditClassificationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.pageSize()).toBe(25);
    expect(component.paginatedList().length).toBe(25);
    expect(component.totalPages()).toBe(2);
    component.onNextPage();
    expect(component.currentPage()).toBe(2);
    expect(component.paginatedList().length).toBe(5);
  });
});
