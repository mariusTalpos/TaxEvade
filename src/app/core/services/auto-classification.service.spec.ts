import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AutoClassificationService } from './auto-classification.service';
import { LedgerStorageService } from './ledger-storage.service';
import { ClassificationHeuristicsService } from './classification-heuristics.service';
import { ClassificationAiService } from './classification-ai.service';
import type { Transaction } from '../models/transaction';

describe('AutoClassificationService', () => {
  let service: AutoClassificationService;
  let storage: jasmine.SpyObj<Pick<LedgerStorageService, 'updateTransaction'>>;
  let heuristics: jasmine.SpyObj<Pick<ClassificationHeuristicsService, 'suggest'>>;
  let ai: jasmine.SpyObj<Pick<ClassificationAiService, 'suggest'>>;

  beforeEach(() => {
    const storageSpy = jasmine.createSpyObj('LedgerStorageService', ['updateTransaction']);
    storageSpy.updateTransaction.and.returnValue(Promise.resolve());
    const heuristicsSpy = jasmine.createSpyObj('ClassificationHeuristicsService', ['suggest']);
    const aiSpy = jasmine.createSpyObj('ClassificationAiService', ['suggest']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AutoClassificationService,
        { provide: LedgerStorageService, useValue: storageSpy },
        { provide: ClassificationHeuristicsService, useValue: heuristicsSpy },
        { provide: ClassificationAiService, useValue: aiSpy },
      ],
    });
    service = TestBed.inject(AutoClassificationService);
    storage = TestBed.inject(LedgerStorageService) as unknown as jasmine.SpyObj<
      Pick<LedgerStorageService, 'updateTransaction'>
    >;
    heuristics = TestBed.inject(ClassificationHeuristicsService) as unknown as jasmine.SpyObj<
      Pick<ClassificationHeuristicsService, 'suggest'>
    >;
    ai = TestBed.inject(ClassificationAiService) as unknown as jasmine.SpyObj<
      Pick<ClassificationAiService, 'suggest'>
    >;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('runAndPersist applies heuristics result and persists classification', async () => {
    const tx: Transaction = {
      id: 'tid-1',
      date: '2025-01-01',
      description: 'TRANSFER TO SAVINGS',
      amount: -100,
      account: 'Checking',
    };
    heuristics.suggest.and.returnValue(
      Promise.resolve({
        type: 'transfer',
        confidence: 'Medium',
        sourceId: 'transfer-detection',
      })
    );
    ai.suggest.and.returnValue(Promise.resolve(null));

    await service.runAndPersist([tx]);

    expect(storage.updateTransaction).toHaveBeenCalledWith(
      'tid-1',
      jasmine.objectContaining({
        classificationType: 'transfer',
        suggestionType: 'transfer',
        suggestionConfidence: 'Medium',
        suggestionSourceId: 'transfer-detection',
      })
    );
  });

  it('runAndPersist falls back to AI when heuristics return null', async () => {
    const tx: Transaction = {
      id: 'tid-2',
      date: '2025-01-02',
      description: 'Grocery',
      amount: -30,
      account: 'Checking',
    };
    heuristics.suggest.and.returnValue(Promise.resolve(null));
    ai.suggest.and.returnValue(
      Promise.resolve({
        type: 'expense',
        category: 'Food',
        confidence: 'Medium',
        sourceId: 'ollama',
      })
    );

    await service.runAndPersist([tx]);

    expect(storage.updateTransaction).toHaveBeenCalledWith(
      'tid-2',
      jasmine.objectContaining({
        classificationType: 'expense',
        classificationCategory: 'Food',
        suggestionType: 'expense',
        suggestionSourceId: 'ollama',
      })
    );
  });

  it('runAndPersist does not call update when heuristics and AI both return null', async () => {
    const tx: Transaction = {
      id: 'tid-3',
      date: '2025-01-03',
      description: 'Unknown XYZ',
      amount: -25,
      account: 'Checking',
    };
    heuristics.suggest.and.returnValue(Promise.resolve(null));
    ai.suggest.and.returnValue(Promise.resolve(null));

    await service.runAndPersist([tx]);

    expect(storage.updateTransaction).not.toHaveBeenCalled();
  });

  it('runAndPersist with multiple transactions completes and each receives at most one classification', async () => {
    const txs: Transaction[] = [
      { id: 'id-a', date: '2025-01-01', description: 'Transfer', amount: -50, account: 'A' },
      { id: 'id-b', date: '2025-01-02', description: 'Grocery', amount: -20, account: 'A' },
      { id: 'id-c', date: '2025-01-03', description: 'Unknown', amount: -10, account: 'A' },
    ];
    heuristics.suggest.and.callFake((t: Transaction) =>
      Promise.resolve(
        t.id === 'id-a'
          ? { type: 'transfer' as const, confidence: 'Medium' as const, sourceId: 'transfer-detection' }
          : null
      )
    );
    ai.suggest.and.callFake((t: Transaction) =>
      Promise.resolve(
        t.id === 'id-b'
          ? { type: 'expense' as const, category: 'Food', confidence: 'Medium' as const, sourceId: 'ollama' }
          : null
      )
    );

    await service.runAndPersist(txs);

    expect(storage.updateTransaction).toHaveBeenCalledTimes(2);
    const ids = (storage.updateTransaction as jasmine.Spy).calls.all().map((c) => c.args[0]);
    expect(ids).toContain('id-a');
    expect(ids).toContain('id-b');
    expect(ids).not.toContain('id-c');
    const idCalls = ids.filter((id) => id === 'id-a').length;
    expect(idCalls).toBe(1);
    const idBCalls = ids.filter((id) => id === 'id-b').length;
    expect(idBCalls).toBe(1);
  });
});
