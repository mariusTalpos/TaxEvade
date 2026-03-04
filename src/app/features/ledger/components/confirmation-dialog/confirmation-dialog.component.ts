import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog" role="dialog" aria-labelledby="confirm-title" aria-modal="true">
      <h2 id="confirm-title">{{ title() }}</h2>
      <p class="message">{{ message() }}</p>
      <div class="actions">
        <button type="button" (click)="onCancel()">Cancel</button>
        <button type="button" class="primary" (click)="onConfirm()">Confirm</button>
      </div>
    </div>
  `,
  styles: [
    `
      .dialog {
        padding: 1.5rem;
        min-width: 20rem;
        max-width: 28rem;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      h2 {
        margin: 0 0 0.75rem 0;
        font-size: 1.25rem;
      }
      .message {
        margin: 0 0 1.25rem 0;
        color: #333;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }
      button {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #f5f5f5;
        cursor: pointer;
      }
      button.primary {
        background: #1976d2;
        color: #fff;
        border-color: #1976d2;
      }
    `,
  ],
})
export class ConfirmationDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
