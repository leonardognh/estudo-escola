import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

import { ConfiguracoesFacade } from '@configuracoes/facades/configuracoes.facade';
import { PERIODIZACAO_OPTIONS } from '@configuracoes/models/configuracao-escola.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';

@Component({
  selector: 'app-configuracoes-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    InputTextModule,
    PageHeaderComponent,
    FormActionsComponent,
  ],
  providers: [ConfiguracoesFacade],
  templateUrl: './configuracoes-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracoesPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  protected readonly facade = inject(ConfiguracoesFacade);
  protected readonly periodizacaoOptions = [...PERIODIZACAO_OPTIONS];
  protected readonly simNaoOptions = [
    { label: 'Sim', value: true },
    { label: 'Nao', value: false },
  ];

  protected readonly form = this.formBuilder.nonNullable.group({
    nomeEscola: ['', [Validators.required, Validators.minLength(2)]],
    periodizacaoNotas: [this.periodizacaoOptions[0]?.value ?? 'bimestral', [Validators.required]],
    mediaAprovacao: [6, [Validators.required, Validators.min(0)]],
    notaMaxima: [10, [Validators.required, Validators.min(1)]],
    usaRecuperacao: [true, [Validators.required]],
    permiteLancamentoManual: [true, [Validators.required]],
    mostrarRankingTurma: [false, [Validators.required]],
  });

  protected readonly suggestions = [
    'Definir escala de nota e media de aprovacao para todos os modulos.',
    'Escolher a periodizacao (bimestral, trimestral, semestral ou anual) para guiar filtros e boletim.',
    'Configurar politica de recuperacao para apoiar calculo final e fluxo pedagogico.',
    'Permitir ou bloquear lancamento manual de notas quando quiser usar somente geracao automatica por atividades.',
    'Controlar exibicao de ranking para estrategias pedagógicas e transparencia por turma.',
  ];

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
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: error });
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validacao',
        detail: 'Preencha os campos obrigatorios.',
      });
      return;
    }
    this.facade.saveConfiguracao(this.form.getRawValue());
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Configuracoes da escola salvas.',
    });
  }
}
