import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-import-file-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input type="file" accept=".csv" (change)="onFileChange($event)" #fileInput />
    <button type="button" (click)="fileInput.click()">Choose CSV file</button>
  `,
  styles: [
    `
      input[type='file'] {
        display: none;
      }
    `,
  ],
})
export class ImportFilePickerComponent {
  readonly fileSelected = output<File>();

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
    }
    input.value = '';
  }
}
