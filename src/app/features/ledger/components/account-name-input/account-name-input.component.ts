import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-account-name-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <label for="account-name">Account name</label>
    <input
      id="account-name"
      type="text"
      list="account-suggestions"
      [ngModel]="value()"
      (ngModelChange)="onValueChange($event)"
      (blur)="onBlur()"
      (keydown.enter)="onBlur()"
      placeholder="e.g. Checking, Wells Fargo Checking"
      autocomplete="off"
    />
    <datalist id="account-suggestions">
      @for (s of suggestions(); track s) {
        <option [value]="s"></option>
      }
    </datalist>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      label {
        display: block;
        margin-bottom: 0.25rem;
      }
      input {
        width: 100%;
        max-width: 20rem;
        padding: 0.5rem;
      }
    `,
  ],
})
export class AccountNameInputComponent {
  readonly suggestions = input<string[]>([]);
  readonly accountSelected = output<string>();

  readonly value = signal<string>('');

  onValueChange(v: string): void {
    this.value.set(v);
    this.accountSelected.emit(v);
  }

  onBlur(): void {
    const v = this.value().trim();
    if (v) {
      this.accountSelected.emit(v);
    }
  }
}
