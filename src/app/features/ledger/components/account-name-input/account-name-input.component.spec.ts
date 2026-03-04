import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountNameInputComponent } from './account-name-input.component';

describe('AccountNameInputComponent', () => {
  let component: AccountNameInputComponent;
  let fixture: ComponentFixture<AccountNameInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountNameInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountNameInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display suggestions in datalist', () => {
    fixture.componentRef.setInput('suggestions', ['Checking', 'Savings']);
    fixture.detectChanges();
    const datalist = fixture.nativeElement.querySelector('#account-suggestions');
    expect(datalist).toBeTruthy();
    const options = datalist.querySelectorAll('option');
    expect(options.length).toBe(2);
    expect(options[0].value).toBe('Checking');
    expect(options[1].value).toBe('Savings');
  });

  it('should emit accountSelected when value is set and blurred', () => {
    let emitted: string | undefined;
    component.accountSelected.subscribe((v) => (emitted = v));
    component.value.set('My Checking');
    component.onBlur();
    expect(emitted).toBe('My Checking');
  });

  it('should not emit when value is empty after trim', () => {
    let emitted = false;
    component.accountSelected.subscribe(() => (emitted = true));
    component.value.set('   ');
    component.onBlur();
    expect(emitted).toBe(false);
  });
});
