import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-form-actions',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="flex justify-end gap-2 pt-5">
      <button pButton type="submit" [disabled]="loading()">{{ saveLabel() }}</button>
      @if (showCancel()) {
        <button pButton type="button" severity="secondary" (click)="cancel.emit()">
          {{ cancelLabel() }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormActionsComponent {
  readonly loading = input<boolean>(false);
  readonly saveLabel = input<string>('Salvar');
  readonly cancelLabel = input<string>('Cancelar');
  readonly showCancel = input<boolean>(true);
  readonly cancel = output<void>();
}
