import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [ButtonModule, TranslocoPipe],
  template: `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5">
      <div class="min-w-0">
        <h2 class="text-2xl font-semibold text-color">{{ titleKey() | transloco }}</h2>
        @if (subtitleKey(); as sk) {
          <p class="mt-1 text-sm text-muted-color">{{ sk | transloco }}</p>
        }
      </div>
      @if (actionLabelKey(); as ak) {
        <button pButton type="button" (click)="action.emit()">{{ ak | transloco }}</button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly titleKey = input.required<string>();
  readonly subtitleKey = input<string | null>(null);
  readonly actionLabelKey = input<string | null>(null);
  readonly action = output<void>();
}
