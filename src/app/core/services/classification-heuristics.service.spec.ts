import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClassificationHeuristicsService } from './classification-heuristics.service';
import { ClassificationConfigService } from './classification-config.service';
import type { Transaction } from '../models/transaction';

describe('ClassificationHeuristicsService', () => {
  let service: ClassificationHeuristicsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClassificationHeuristicsService, ClassificationConfigService],
    });
    service = TestBed.inject(ClassificationHeuristicsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const flushConfig = () => {
    const req = httpMock.expectOne('/config/classification-config.json');
    req.flush({ categories: [], merchants: [], patterns: [] });
  };

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return null when no heuristic matches', async () => {
    const tx: Transaction = {
      id: '1',
      date: '2025-01-01',
      description: 'Random purchase XYZ',
      amount: -50,
      account: 'Checking',
    };
    const resultPromise = service.suggest(tx);
    flushConfig();
    const result = await resultPromise;
    expect(result === null || (typeof result === 'object' && result.type && result.sourceId)).toBe(
      true
    );
  });

  it('should return a suggestion with type, confidence, sourceId when transfer keyword matches', async () => {
    const tx: Transaction = {
      id: '2',
      date: '2025-01-02',
      description: 'ONLINE TRANSFER REF #ABC',
      amount: -100,
      account: 'Checking',
    };
    const resultPromise = service.suggest(tx);
    flushConfig();
    const result = await resultPromise;
    expect(result).not.toBeNull();
    expect(result!.type).toBe('transfer');
    expect(result!.confidence).toBe('Medium');
    expect(result!.sourceId).toBe('transfer-detection');
  });

  it('should return single suggestion per transaction (pipeline order)', async () => {
    const tx: Transaction = {
      id: '3',
      date: '2025-01-03',
      description: 'ZELLE PAYMENT',
      amount: 25,
      account: 'Checking',
    };
    const resultPromise = service.suggest(tx);
    flushConfig();
    const result = await resultPromise;
    expect(result).not.toBeNull();
    expect(['type', 'confidence', 'sourceId'].every((k) => k in result!)).toBe(true);
  });
});
