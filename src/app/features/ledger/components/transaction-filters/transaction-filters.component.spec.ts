import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionFiltersComponent } from './transaction-filters.component';

describe('TransactionFiltersComponent', () => {
  let component: TransactionFiltersComponent;
  let fixture: ComponentFixture<TransactionFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit filtersChange when search input changes', (done) => {
    component.filtersChange.subscribe((f) => {
      expect(f.search).toBe('test');
      done();
    });
    const input = fixture.nativeElement.querySelector('input[type="text"]');
    input.value = 'test';
    input.dispatchEvent(new Event('input'));
  });

  it('should emit full state on clear', (done) => {
    component.filtersChange.subscribe((f) => {
      expect(f.search).toBe('');
      expect(f.flow).toBe('all');
      done();
    });
    const btn = fixture.nativeElement.querySelector('button');
    btn?.click();
  });
});
