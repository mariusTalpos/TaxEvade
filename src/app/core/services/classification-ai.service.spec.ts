import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ClassificationAiService } from './classification-ai.service';
import type { Transaction } from '../models/transaction';

describe('ClassificationAiService', () => {
  let service: ClassificationAiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClassificationAiService],
    });
    service = TestBed.inject(ClassificationAiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isAvailable() returns true when Ollama root responds with "Ollama"', async () => {
    const resultPromise = service.isAvailable();
    const req = httpMock.expectOne('http://127.0.0.1:11434/');
    req.flush('Ollama is running', { status: 200, statusText: 'OK' });
    const result = await resultPromise;
    expect(result).toBe(true);
  });

  it('isAvailable() returns false when request fails', async () => {
    const resultPromise = service.isAvailable();
    const req = httpMock.expectOne('http://127.0.0.1:11434/');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown' });
    const result = await resultPromise;
    expect(result).toBe(false);
  });

  it('suggest() returns null when request fails', async () => {
    const tx: Transaction = {
      id: '1',
      date: '2025-01-01',
      description: 'Test',
      amount: -10,
      account: 'Checking',
    };
    const resultPromise = service.suggest(tx);
    const req = httpMock.expectOne('http://127.0.0.1:11434/api/generate');
    req.flush('error', { status: 500, statusText: 'Server Error' });
    const result = await resultPromise;
    expect(result).toBeNull();
  });

  it('suggest() returns null when response has no parseable type', async () => {
    const tx: Transaction = {
      id: '1',
      date: '2025-01-01',
      description: 'Test',
      amount: -10,
      account: 'Checking',
    };
    const resultPromise = service.suggest(tx);
    const req = httpMock.expectOne('http://127.0.0.1:11434/api/generate');
    req.flush({ response: 'invalid type xyz' });
    const result = await resultPromise;
    expect(result).toBeNull();
  });

  it('suggest() returns suggestion when Ollama responds with type and category', async () => {
    const tx: Transaction = {
      id: '1',
      date: '2025-01-01',
      description: 'Grocery store',
      amount: -50,
      account: 'Checking',
    };
    const resultPromise = service.suggest(tx);
    const req = httpMock.expectOne('http://127.0.0.1:11434/api/generate');
    req.flush({ response: 'expense Food' });
    const result = await resultPromise;
    expect(result).not.toBeNull();
    expect(result?.type).toBe('expense');
    expect(result?.category).toBe('Food');
    expect(result?.confidence).toBe('Medium');
    expect(result?.sourceId).toBe('ollama');
  });
});
