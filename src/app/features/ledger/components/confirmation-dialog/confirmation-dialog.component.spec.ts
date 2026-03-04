import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Confirm action');
    fixture.componentRef.setInput('message', 'Are you sure?');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show title and message', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Confirm action');
    expect(el.textContent).toContain('Are you sure?');
  });

  it('should emit confirmed when Confirm clicked', () => {
    let emitted = false;
    component.confirmed.subscribe(() => (emitted = true));
    const btn = fixture.nativeElement.querySelector('button.primary') as HTMLButtonElement;
    btn.click();
    expect(emitted).toBe(true);
  });

  it('should emit cancelled when Cancel clicked', () => {
    let emitted = false;
    component.cancelled.subscribe(() => (emitted = true));
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const buttonsList = Array.from(buttons) as HTMLButtonElement[];
    const cancelBtn = buttonsList.find((b) => b.textContent?.trim() === 'Cancel');
    cancelBtn?.click();
    expect(emitted).toBe(true);
  });
});
