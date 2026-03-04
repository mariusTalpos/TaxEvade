import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LedgerPageComponent } from './ledger-page.component';
import { LedgerStorageService } from '../../../../core/services/ledger-storage.service';
import { CsvParserService } from '../../../../core/services/csv-parser.service';

describe('LedgerPageComponent', () => {
  let component: LedgerPageComponent;
  let fixture: ComponentFixture<LedgerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LedgerPageComponent],
      providers: [LedgerStorageService, CsvParserService],
    }).compileComponents();

    fixture = TestBed.createComponent(LedgerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display error on invalid file content', async () => {
    const file = new File(['not,csv,date,here,row'], 'bad.csv', { type: 'text/csv' });
    await component.onFileSelected(file);
    fixture.detectChanges();
    const result = component.importResult();
    expect(result).not.toBeNull();
    expect(result?.error).toBeDefined();
  });

  it('should add transactions and set result on valid CSV when account name set', async () => {
    component.accountName.set('TestAccount');
    const csv = `"12/31/2025","-18.12","*","","ONLINE TRANSFER"`;
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    await component.onFileSelected(file);
    fixture.detectChanges();
    const result = component.importResult();
    expect(result).not.toBeNull();
    expect(result?.error).toBeUndefined();
    expect(result?.added).toBe(1);
  });

  it('should show error when file selected without account name', async () => {
    const csv = `"12/31/2025","-18.12","*","","ONLINE TRANSFER"`;
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    await component.onFileSelected(file);
    fixture.detectChanges();
    const result = component.importResult();
    expect(result?.error).toBe('Please enter an account name first.');
    expect(result?.added).toBe(0);
  });

  it('should clear all and refresh list when doClearAll called', async () => {
    const storage = TestBed.inject(LedgerStorageService);
    await storage.clearAll();
    await storage.addTransactions([{ date: '2025-01-01', description: 'X', amount: 0 }], 'Acc');
    const all = await storage.getAll();
    component.transactions.set(all);
    fixture.detectChanges();
    expect(component.transactions().length).toBe(1);
    await component.doClearAll();
    fixture.detectChanges();
    expect(component.transactions().length).toBe(0);
    expect(component.selectedIds().length).toBe(0);
  });

  it('should delete selected ids and refresh list when doDeleteByIds called', async () => {
    const storage = TestBed.inject(LedgerStorageService);
    await storage.clearAll();
    await storage.addTransactions(
      [
        { date: '2025-01-01', description: 'A', amount: 1 },
        { date: '2025-01-02', description: 'B', amount: 2 },
      ],
      'Acc'
    );
    const all = await storage.getAll();
    const idToDelete = all[0].id;
    component.transactions.set(all);
    await component.doDeleteByIds([idToDelete]);
    fixture.detectChanges();
    expect(component.transactions().length).toBe(1);
    expect(component.transactions()[0].id).not.toBe(idToDelete);
    expect(component.selectedIds().length).toBe(0);
  });
});
