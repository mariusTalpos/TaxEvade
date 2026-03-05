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
  let getUnclassifiedSpy: jasmine.Spy;
  let loadConfigSpy: jasmine.Spy;

  const mockUnclassified: Transaction[] = [
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
      imports: [ClassificationPageComponent, HttpClientTestingModule],
      providers: [
        LedgerStorageService,
        ClassificationConfigService,
        provideRouter([]),
      ],
    }).compileComponents();

    const storage = TestBed.inject(LedgerStorageService);
    const config = TestBed.inject(ClassificationConfigService);
    getUnclassifiedSpy = spyOn(storage, 'getUnclassified').and.returnValue(
      Promise.resolve(mockUnclassified)
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

  it('should load unclassified list on init', async () => {
    expect(loadConfigSpy).toHaveBeenCalled();
    expect(getUnclassifiedSpy).toHaveBeenCalled();
    expect(component.unclassifiedList().length).toBe(1);
    expect(component.unclassifiedList()[0].id).toBe('tx-1');
    expect(component.loading()).toBe(false);
  });
});
