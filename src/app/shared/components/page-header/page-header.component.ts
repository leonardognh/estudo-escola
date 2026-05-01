import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5">
      <h2 class="text-2xl font-semibold text-color">{{ title() }}</h2>
      @if (actionLabel()) {
        <button pButton type="button" (click)="action.emit()">{{ actionLabel() }}</button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly actionLabel = input<string | null>(null);
  readonly action = output<void>();
}
