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

  it('should add transactions and set result on valid CSV', async () => {
    const csv = `"12/31/2025","-18.12","*","","ONLINE TRANSFER"`;
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    await component.onFileSelected(file);
    fixture.detectChanges();
    const result = component.importResult();
    expect(result).not.toBeNull();
    expect(result?.error).toBeUndefined();
    expect(result?.added).toBe(1);
  });
});
