import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-table-search',
  standalone: true,
  imports: [InputTextModule],
  template: `
    <div class="flex justify-end">
      <input
        pInputText
        type="text"
        [placeholder]="placeholder()"
        (input)="searchChange.emit($any($event.target).value)"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSearchComponent {
  readonly placeholder = input<string>('Pesquisar');
  readonly searchChange = output<string>();
}
