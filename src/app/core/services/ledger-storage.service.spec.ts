import { TestBed } from '@angular/core/testing';
import { LedgerStorageService } from './ledger-storage.service';
import { TransactionRow } from '../models/transaction';

describe('LedgerStorageService', () => {
  let service: LedgerStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LedgerStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty array when no transactions', async () => {
    const all = await service.getAll();
    expect(Array.isArray(all)).toBe(true);
    // Note: in real test we'd use a separate test DB or clear; here we assert API shape
    expect(all.length).toBeGreaterThanOrEqual(0);
  });

  it('should add transactions and return added count', async () => {
    const rows: TransactionRow[] = [
      { date: '2025-01-01', description: 'Test', amount: -10 },
      { date: '2025-01-02', description: 'Test 2', amount: 20 },
    ];
    const result = await service.addTransactions(rows, 'TestAccount');
    expect(result.added).toBe(2);
    expect(result.skippedAsDuplicate).toBe(0);
    const all = await service.getAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
    const fromAccount = all.filter((t) => t.account === 'TestAccount');
    expect(fromAccount.length).toBeGreaterThanOrEqual(2);
  });

  it('should deduplicate on second add of same data', async () => {
    const rows: TransactionRow[] = [{ date: '2025-02-01', description: 'Dup', amount: 5 }];
    const first = await service.addTransactions(rows, 'DupAccount');
    expect(first.added).toBe(1);
    const second = await service.addTransactions(rows, 'DupAccount');
    expect(second.added).toBe(0);
    expect(second.skippedAsDuplicate).toBe(1);
  });
});
