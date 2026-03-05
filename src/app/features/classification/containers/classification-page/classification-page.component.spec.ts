import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ClassificationPageComponent } from './classification-page.component';
import { LedgerStorageService } from '../../../../core/services/ledger-storage.service';
import { ClassificationConfigService } from '../../../../core/services/classification-config.service';
import type { Transaction } from '../../../../core/models/transaction';

describe('ClassificationPageComponent', () => {
  let component: ClassificationPageComponent;
  let fixture: ComponentFixture<ClassificationPageComponent>;
  let getAllSpy: jasmine.Spy;
  let loadConfigSpy: jasmine.Spy;

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      date: '2025-01-15',
      description: 'Coffee',
      amount: -5.5,
      account: 'Checking',
      classificationType: 'expense',
      classificationCategory: 'Food',
      suggestionSourceId: 'merchant',
      suggestionConfidence: 'High',
    },
    {
      id: 'tx-2',
      date: '2025-01-16',
      description: 'Unknown',
      amount: -10,
      account: 'Checking',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassificationPageComponent, HttpClientTestingModule],
      providers: [
        LedgerStorageService,
        ClassificationConfigService,
        provideRouter([]),
      ],
    }).compileComponents();

    const storage = TestBed.inject(LedgerStorageService);
    const config = TestBed.inject(ClassificationConfigService);
    getAllSpy = spyOn(storage, 'getAll').and.returnValue(
      Promise.resolve(mockTransactions)
    );
    loadConfigSpy = spyOn(config, 'load').and.returnValue(
      Promise.resolve({ categories: ['Food', 'Travel'], merchants: [], patterns: [] })
    );
    spyOn(config, 'getCategories').and.returnValue(['Food', 'Travel']);

    fixture = TestBed.createComponent(ClassificationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all transactions on init', async () => {
    expect(loadConfigSpy).toHaveBeenCalled();
    expect(getAllSpy).toHaveBeenCalled();
    expect(component.allTransactions().length).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('should filter by unclassified when filterOption is unclassified', () => {
    component.filterOption.set('unclassified');
    fixture.detectChanges();
    const sorted = component.sortedList();
    expect(sorted.length).toBe(1);
    expect(sorted[0].id).toBe('tx-2');
  });

  it('should filter by type when filterOption is expense', () => {
    component.filterOption.set('expense');
    fixture.detectChanges();
    const sorted = component.sortedList();
    expect(sorted.length).toBe(1);
    expect(sorted[0].id).toBe('tx-1');
  });

  it('should show all when filterOption is all', () => {
    component.filterOption.set('all');
    fixture.detectChanges();
    expect(component.sortedList().length).toBe(2);
  });

  it('should accept all high confidence when onAcceptHighConfidence called', async () => {
    const storage = TestBed.inject(LedgerStorageService);
    const updateSpy = spyOn(storage, 'updateClassification').and.returnValue(Promise.resolve());
    const unclassifiedHigh: Transaction[] = [
      {
        id: 'tx-high',
        date: '2025-01-10',
        description: 'Netflix',
        amount: -15,
        account: 'Checking',
        suggestionType: 'expense',
        suggestionCategory: 'Subscriptions',
        suggestionConfidence: 'High',
        suggestionSourceId: 'merchant',
      },
    ];
    component.allTransactions.set([...component.allTransactions(), ...unclassifiedHigh]);
    component.filterOption.set('unclassified');
    fixture.detectChanges();
    await component.onAcceptHighConfidence();
    expect(updateSpy).toHaveBeenCalledWith(
      'tx-high',
      jasmine.objectContaining({
        classificationType: 'expense',
        classificationCategory: 'Subscriptions',
      })
    );
  });
});
