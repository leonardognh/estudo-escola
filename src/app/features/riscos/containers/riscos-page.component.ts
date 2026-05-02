import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { BIMESTRE_OPTIONS } from '@notas/models/nota.model';
import { RiscosFacade } from '@riscos/facades/riscos.facade';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-riscos-page',
  standalone: true,
  imports: [FormsModule, CardModule, SelectModule, TableModule, TagModule, PageHeaderComponent, TranslocoPipe],
  providers: [RiscosFacade],
  templateUrl: './riscos-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RiscosPageComponent {
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);
  protected readonly facade = inject(RiscosFacade);

  private readonly langTick = toSignal(
    this.transloco.langChanges$.pipe(map(() => this.transloco.getActiveLang())),
    { initialValue: this.transloco.getActiveLang() },
  );

  protected readonly semaforoFilter = signal<string>('todos');
  protected readonly bimestreFilter = signal<string>('todos');

  protected readonly bimestreOptions = computed(() => {
    this.langTick();
    return [
      { label: this.transloco.translate('riscos.filter.all'), value: 'todos' },
      ...BIMESTRE_OPTIONS.map((item) => ({
        label: this.transloco.translate('notas.bimestreValue.' + item.value.replace(/\s+/g, '_')),
        value: item.value,
      })),
      { label: this.transloco.translate('riscos.filter.semRef'), value: 'sem_ref' },
    ];
  });

  protected readonly semaforoOptions = computed(() => {
    this.langTick();
    return [
      { label: this.transloco.translate('riscos.filter.all'), value: 'todos' },
      { label: this.transloco.translate('riscos.semaforoOption.alto'), value: 'alto' },
      { label: this.transloco.translate('riscos.semaforoOption.medio'), value: 'medio' },
      { label: this.transloco.translate('riscos.semaforoOption.baixo'), value: 'baixo' },
    ];
  });

  protected readonly rows = computed(() =>
    this.facade.rows().filter((row) => {
      const semaforoOk =
        this.semaforoFilter() === 'todos' || row.semaforo === this.semaforoFilter();
      const bimestreOk =
        this.bimestreFilter() === 'todos' || row.bimestre === this.bimestreFilter();
      return semaforoOk && bimestreOk;
    }),
  );

  protected readonly rowsView = computed(() => {
    this.langTick();
    return this.rows().map((row) => ({
      ...row,
      bimestreLabel:
        row.bimestre === 'sem_ref'
          ? this.transloco.translate('riscos.filter.semRef')
          : this.transloco.translate('notas.bimestreValue.' + row.bimestre.replace(/\s+/g, '_')),
    }));
  });

  constructor() {
    this.facade.loadData();
    effect(() => {
      const error = this.facade.errorMessage();
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: this.transloco.translate('common.error'),
          detail: this.transloco.translate(error),
        });
      }
    });
  }
}
