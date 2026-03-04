import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportFilePickerComponent } from './import-file-picker.component';

describe('ImportFilePickerComponent', () => {
  let component: ImportFilePickerComponent;
  let fixture: ComponentFixture<ImportFilePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportFilePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportFilePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit file when file is selected', (done) => {
    component.fileSelected.subscribe((file: File) => {
      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe('test.csv');
      done();
    });
    const input = fixture.nativeElement.querySelector('input[type="file"]');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([''], 'test.csv', { type: 'text/csv' }));
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event('change'));
  });
});
