import { TestBed } from '@angular/core/testing';
import { CsvParserService } from './csv-parser.service';

describe('CsvParserService', () => {
  let service: CsvParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should parse valid 5-column quoted CSV and normalize date/amount/description', () => {
    const csv = `"12/31/2025","-18.12","*","","ONLINE TRANSFER REF #IB0W9MQXF8"
"12/26/2025","1929.21","*","","Beacon Hill Solu PAYROLL"`;
    const result = service.parse(csv);
    expect(result.error).toBeUndefined();
    expect(result.rows.length).toBe(2);
    expect(result.rows[0]).toEqual({
      date: '2025-12-31',
      description: 'ONLINE TRANSFER REF #IB0W9MQXF8',
      amount: -18.12,
    });
    expect(result.rows[1]).toEqual({
      date: '2025-12-26',
      description: 'Beacon Hill Solu PAYROLL',
      amount: 1929.21,
    });
  });

  it('should reject invalid format with error when no valid rows', () => {
    const csv = `not,a,date,here,row`;
    const result = service.parse(csv);
    expect(result.rows.length).toBe(0);
    expect(result.error).toContain('Unsupported CSV format');
  });

  it('should return error for empty file', () => {
    const result = service.parse('');
    expect(result.rows.length).toBe(0);
    expect(result.error).toContain('empty');
  });

  it('should skip malformed rows and count skippedInvalid', () => {
    const csv = `"12/31/2025","-18.12","*","","Valid"
"bad"
"12/30/2025","10.00","*","","Also valid"`;
    const result = service.parse(csv);
    expect(result.rows.length).toBe(2);
    expect(result.skippedInvalid).toBe(1);
  });
});
