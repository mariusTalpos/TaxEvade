import { Injectable } from '@angular/core';
import { Transaction, ImportResult, TransactionRow } from '../models/transaction';

const DB_NAME = 'TaxEvadeLedger';
const STORE_NAME = 'transactions';
const DB_VERSION = 1;

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function dedupeKey(t: {
  date: string;
  amount: number;
  description: string;
  account: string;
}): string {
  return `${t.date}|${t.amount}|${t.description}|${t.account}`;
}

@Injectable({ providedIn: 'root' })
export class LedgerStorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async openDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) {
      await this.initPromise;
      return this.db!;
    }
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('account', 'account', { unique: false });
        }
      };
    });
    await this.initPromise;
    return this.db!;
  }

  async getAll(): Promise<Transaction[]> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Transaction[]);
      request.onerror = () => reject(request.error);
    });
  }

  async addTransactions(rows: TransactionRow[], account: string): Promise<ImportResult> {
    const db = await this.openDb();
    const existing = await this.getAll();
    const keySet = new Set(existing.map((t) => dedupeKey(t)));
    const toAdd: Transaction[] = [];
    let skippedAsDuplicate = 0;
    const importedAt = new Date().toISOString();

    for (const row of rows) {
      const key = dedupeKey({ ...row, account });
      if (keySet.has(key)) {
        skippedAsDuplicate++;
        continue;
      }
      keySet.add(key);
      toAdd.push({
        id: generateId(),
        date: row.date,
        description: row.description,
        amount: row.amount,
        account,
        importedAt,
      });
    }

    if (toAdd.length === 0) {
      return { added: 0, skippedAsDuplicate };
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const t of toAdd) {
        store.add(t);
      }
      tx.oncomplete = () =>
        resolve({
          added: toAdd.length,
          skippedAsDuplicate,
        });
      tx.onerror = () => reject(tx.error);
    });
  }
}
