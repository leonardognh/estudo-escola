import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-form-actions',
  standalone: true,
  imports: [ButtonModule, TranslocoPipe],
  template: `
    <div class="flex justify-end gap-2 pt-5">
      <button pButton type="submit" [disabled]="loading()">{{ saveKey() | transloco }}</button>
      @if (showCancel()) {
        <button pButton type="button" severity="secondary" (click)="cancel.emit()">
          {{ cancelKey() | transloco }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormActionsComponent {
  readonly loading = input<boolean>(false);
  readonly saveKey = input<string>('common.save');
  readonly cancelKey = input<string>('common.cancel');
  readonly showCancel = input<boolean>(true);
  readonly cancel = output<void>();
}
