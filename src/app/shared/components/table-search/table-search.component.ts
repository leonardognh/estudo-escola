import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-table-search',
  standalone: true,
  imports: [InputTextModule, TranslocoPipe],
  template: `
    <div class="flex w-full min-w-0">
      <input
        pInputText
        type="text"
        class="w-full max-w-full"
        [placeholder]="placeholderKey() | transloco"
        (input)="searchChange.emit($any($event.target).value)"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSearchComponent {
  readonly placeholderKey = input<string>('common.search');
  readonly searchChange = output<string>();
}
