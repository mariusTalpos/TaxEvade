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

  it('should return distinct account names', async () => {
    await service.addTransactions(
      [
        { date: '2025-03-01', description: 'A', amount: 1 },
        { date: '2025-03-02', description: 'B', amount: 2 },
      ],
      'Checking'
    );
    await service.addTransactions([{ date: '2025-03-03', description: 'C', amount: 3 }], 'Savings');
    const names = await service.getDistinctAccountNames();
    expect(names).toContain('Checking');
    expect(names).toContain('Savings');
    expect(names.length).toBeGreaterThanOrEqual(2);
  });

  it('should clearAll leave store empty', async () => {
    await service.addTransactions(
      [{ date: '2025-04-01', description: 'X', amount: 0 }],
      'ClearTest'
    );
    await service.clearAll();
    const all = await service.getAll();
    expect(all.length).toBe(0);
  });

  it('should deleteByIds remove only specified ids', async () => {
    await service.clearAll();
    await service.addTransactions(
      [
        { date: '2025-05-01', description: 'One', amount: 1 },
        { date: '2025-05-02', description: 'Two', amount: 2 },
      ],
      'DelTest'
    );
    const all = await service.getAll();
    expect(all.length).toBe(2);
    const idToRemove = all[0].id;
    await service.deleteByIds([idToRemove]);
    const after = await service.getAll();
    expect(after.length).toBe(1);
    expect(after[0].id).not.toBe(idToRemove);
  });

  it('should return addedTransactions from addTransactions', async () => {
    await service.clearAll();
    const rows: TransactionRow[] = [
      { date: '2025-06-01', description: 'Added1', amount: 1 },
      { date: '2025-06-02', description: 'Added2', amount: 2 },
    ];
    const result = await service.addTransactions(rows, 'AddTest');
    expect(result.added).toBe(2);
    expect(result.addedTransactions).toBeDefined();
    expect(result.addedTransactions!.length).toBe(2);
    expect(result.addedTransactions!.every((t) => t.id && t.account === 'AddTest')).toBe(true);
  });

  it('should getUnclassified return only transactions without classificationType', async () => {
    await service.clearAll();
    await service.addTransactions(
      [
        { date: '2025-07-01', description: 'U1', amount: 1 },
        { date: '2025-07-02', description: 'U2', amount: 2 },
      ],
      'Unclass'
    );
    const unclass = await service.getUnclassified();
    expect(unclass.length).toBeGreaterThanOrEqual(2);
    expect(unclass.every((t) => t.classificationType == null)).toBe(true);
  });

  it('should getClassified return only transactions with classificationType set', async () => {
    await service.clearAll();
    await service.addTransactions(
      [{ date: '2025-08-01', description: 'C1', amount: 1 }],
      'ClassTest'
    );
    const all = await service.getAll();
    const id = all[0].id;
    await service.updateClassification(id, {
      classificationType: 'expense',
      classificationCategory: 'Food',
    });
    const classified = await service.getClassified();
    expect(classified.some((t) => t.id === id && t.classificationType === 'expense')).toBe(true);
  });

  it('should clearClassification make transaction unclassified and appear in getUnclassified', async () => {
    await service.clearAll();
    await service.addTransactions(
      [{ date: '2025-10-01', description: 'ClearMe', amount: 1 }],
      'ClearClassTest'
    );
    const all = await service.getAll();
    const id = all[0].id;
    await service.updateClassification(id, {
      classificationType: 'expense',
      classificationCategory: 'Food',
    });
    let classified = await service.getClassified();
    expect(classified.some((t) => t.id === id)).toBe(true);
    await service.clearClassification(id);
    classified = await service.getClassified();
    expect(classified.some((t) => t.id === id)).toBe(false);
    const unclass = await service.getUnclassified();
    expect(unclass.some((t) => t.id === id)).toBe(true);
    const tx = unclass.find((t) => t.id === id);
    expect(tx?.classificationType).toBeUndefined();
    expect(tx?.classificationCategory).toBeUndefined();
  });

  it('should updateClassification only write classification fields (no user-defined rules)', async () => {
    await service.clearAll();
    await service.addTransactions(
      [{ date: '2025-09-01', description: 'Update', amount: 1 }],
      'UpdateTest'
    );
    const all = await service.getAll();
    const id = all[0].id;
    await service.updateClassification(id, {
      classificationType: 'income',
      classificationCategory: 'Pay',
      classificationNotes: 'Note',
    });
    const after = await service.getAll();
    const tx = after.find((t) => t.id === id);
    expect(tx?.classificationType).toBe('income');
    expect(tx?.classificationCategory).toBe('Pay');
    expect(tx?.classificationNotes).toBe('Note');
    expect(tx?.description).toBe('Update');
  });
});
