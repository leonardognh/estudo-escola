import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { PainelExecutivoFacade } from '@painel-executivo/facades/painel-executivo.facade';

@Component({
  selector: 'app-painel-executivo-page',
  standalone: true,
  imports: [TabsModule, CardModule, TableModule, TranslocoPipe, PageHeaderComponent],
  providers: [PainelExecutivoFacade],
  templateUrl: './painel-executivo-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PainelExecutivoPageComponent {
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);
  protected readonly facade = inject(PainelExecutivoFacade);

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
