import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

import { ConfiguracoesFacade } from '@configuracoes/facades/configuracoes.facade';
import { PERIODIZACAO_OPTIONS } from '@configuracoes/models/configuracao-escola.model';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';
import { LanguageSwitcherComponent } from '@shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-configuracoes-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    InputTextModule,
    TranslocoPipe,
    PageHeaderComponent,
    FormActionsComponent,
    LanguageSwitcherComponent,
  ],
  providers: [ConfiguracoesFacade],
  templateUrl: './configuracoes-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracoesPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);
  protected readonly facade = inject(ConfiguracoesFacade);
  protected readonly periodizacaoOptions = [...PERIODIZACAO_OPTIONS];

  private readonly langTick = toSignal(
    this.transloco.langChanges$.pipe(map(() => this.transloco.getActiveLang())),
    { initialValue: this.transloco.getActiveLang() },
  );

  protected readonly simNaoOptions = computed(() => {
    this.langTick();
    return [
      { label: this.transloco.translate('common.yes'), value: true },
      { label: this.transloco.translate('common.no'), value: false },
    ];
  });

  protected readonly form = this.formBuilder.nonNullable.group({
    nomeEscola: ['', [Validators.required, Validators.minLength(2)]],
    periodizacaoNotas: [this.periodizacaoOptions[0]?.value ?? 'bimestral', [Validators.required]],
    mediaAprovacao: [6, [Validators.required, Validators.min(0)]],
    notaMaxima: [10, [Validators.required, Validators.min(1)]],
    usaRecuperacao: [true, [Validators.required]],
    permiteLancamentoManual: [true, [Validators.required]],
    mostrarRankingTurma: [false, [Validators.required]],
  });

  constructor() {
    this.facade.loadConfiguracao();
    effect(() => {
      const cfg = this.facade.configuracao();
      if (cfg) {
        this.form.reset({
          nomeEscola: cfg.nomeEscola,
          periodizacaoNotas: cfg.periodizacaoNotas,
          mediaAprovacao: cfg.mediaAprovacao,
          notaMaxima: cfg.notaMaxima,
          usaRecuperacao: cfg.usaRecuperacao,
          permiteLancamentoManual: cfg.permiteLancamentoManual,
          mostrarRankingTurma: cfg.mostrarRankingTurma,
        });
      }
    });
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

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate('common.validation'),
        detail: this.transloco.translate('settings.toast.validation'),
      });
      return;
    }
    this.facade.saveConfiguracao(this.form.getRawValue());
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate('common.success'),
      detail: this.transloco.translate('settings.toast.saved'),
    });
  }
}
