import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TableSearchComponent } from '@shared/components/table-search/table-search.component';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';
import { IntervencoesFacade } from '@intervencoes/facades/intervencoes.facade';
import {
  Intervencao,
  RISCO_OPTIONS,
  STATUS_INTERVENCAO_OPTIONS,
  STATUS_RECUPERACAO_OPTIONS,
  RecuperacaoAcademica,
} from '@intervencoes/models/intervencao.model';
import { BIMESTRE_OPTIONS } from '@notas/models/nota.model';

@Component({
  selector: 'app-intervencoes-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TabsModule,
    TooltipModule,
    TranslocoPipe,
    PageHeaderComponent,
    TableSearchComponent,
    FormActionsComponent,
  ],
  providers: [IntervencoesFacade],
  templateUrl: './intervencoes-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntervencoesPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly transloco = inject(TranslocoService);
  protected readonly facade = inject(IntervencoesFacade);

  private readonly langTick = toSignal(
    this.transloco.langChanges$.pipe(map(() => this.transloco.getActiveLang())),
    { initialValue: this.transloco.getActiveLang() },
  );

  protected readonly modalVisible = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly simulacaoVisible = signal(false);
  protected readonly currentRecuperacaoId = signal<string | null>(null);
  protected readonly searchIntervencoes = signal('');
  protected readonly searchRecuperacoes = signal('');

  protected readonly bimestreOptionsDisplay = computed(() => {
    this.langTick();
    return BIMESTRE_OPTIONS.map((o) => ({
      value: o.value,
      label: this.transloco.translate('notas.bimestreValue.' + o.value.replace(/\s+/g, '_')),
    }));
  });

  protected readonly riscoOptionsDisplay = computed(() => {
    this.langTick();
    return RISCO_OPTIONS.map((o) => ({
      value: o.value,
      label: this.transloco.translate('intervencoes.risco.' + o.value),
    }));
  });

  protected readonly statusIntervencaoOptionsDisplay = computed(() => {
    this.langTick();
    return STATUS_INTERVENCAO_OPTIONS.map((o) => ({
      value: o.value,
      label: this.transloco.translate('intervencoes.statusIntervencao.' + o.value),
    }));
  });

  protected readonly statusRecuperacaoOptionsDisplay = computed(() => {
    this.langTick();
    return STATUS_RECUPERACAO_OPTIONS.map((o) => ({
      value: o.value,
      label: this.transloco.translate('intervencoes.statusRec.' + o.value),
    }));
  });

  protected readonly form = this.formBuilder.nonNullable.group({
    alunoId: ['', [Validators.required]],
    turmaId: ['', [Validators.required]],
    materiaId: ['', [Validators.required]],
    bimestre: [BIMESTRE_OPTIONS[0]?.value ?? '1o bimestre', [Validators.required]],
    risco: [(RISCO_OPTIONS[1]?.value ?? 'medio') as Intervencao['risco'], [Validators.required]],
    status: [(STATUS_INTERVENCAO_OPTIONS[0]?.value ?? 'aberto') as Intervencao['status'], [Validators.required]],
    objetivo: ['', [Validators.required, Validators.minLength(4)]],
    descricao: ['', [Validators.required, Validators.minLength(4)]],
    responsavel: ['', [Validators.required, Validators.minLength(2)]],
    prazo: ['', [Validators.required]],
  });

  protected readonly simulacaoForm = this.formBuilder.nonNullable.group({
    alunoId: ['', [Validators.required]],
    turmaId: ['', [Validators.required]],
    materiaId: ['', [Validators.required]],
    bimestre: [BIMESTRE_OPTIONS[0]?.value ?? '1o bimestre', [Validators.required]],
    notaAtual: [4, [Validators.required, Validators.min(0), Validators.max(10)]],
    notaAlvo: [6, [Validators.required, Validators.min(0), Validators.max(10)]],
    status: [
      (STATUS_RECUPERACAO_OPTIONS[0]?.value ?? 'pendente') as RecuperacaoAcademica['status'],
      [Validators.required],
    ],
  });

  protected readonly alunosOptions = computed(() =>
    this.facade.alunos().map((item) => ({ label: item.nome, value: item.id })),
  );
  protected readonly turmasOptions = this.facade.turmaOptions;
  protected readonly materiasOptions = computed(() =>
    this.facade.materias().map((item) => ({ label: item.nome, value: item.id })),
  );

  protected readonly intervencoesRows = computed(() => {
    this.langTick();
    return this.facade
      .intervencoes()
      .map((item) => ({
        ...item,
        alunoNome: this.facade.getAlunoNomeById(item.alunoId),
        turmaNome: this.facade.getTurmaNomeById(item.turmaId),
        materiaNome: this.facade.getMateriaNomeById(item.materiaId),
        bimestreLabel: this.transloco.translate('notas.bimestreValue.' + item.bimestre.replace(/\s+/g, '_')),
        riscoLabel: this.transloco.translate('intervencoes.risco.' + item.risco),
        statusLabel: this.transloco.translate('intervencoes.statusIntervencao.' + item.status),
      }))
      .filter((item) =>
        `${item.alunoNome} ${item.turmaNome} ${item.materiaNome} ${item.status} ${item.risco} ${item.statusLabel} ${item.riscoLabel} ${item.bimestreLabel}`
          .toLowerCase()
          .includes(this.searchIntervencoes().trim().toLowerCase()),
      );
  });

  protected readonly recuperacoesRows = computed(() => {
    this.langTick();
    return this.facade
      .recuperacoes()
      .map((item) => ({
        ...item,
        alunoNome: this.facade.getAlunoNomeById(item.alunoId),
        turmaNome: this.facade.getTurmaNomeById(item.turmaId),
        materiaNome: this.facade.getMateriaNomeById(item.materiaId),
        bimestreLabel: this.transloco.translate('notas.bimestreValue.' + item.bimestre.replace(/\s+/g, '_')),
        statusLabel: this.transloco.translate('intervencoes.statusRec.' + item.status),
      }))
      .filter((item) =>
        `${item.alunoNome} ${item.turmaNome} ${item.materiaNome} ${item.status} ${item.statusLabel} ${item.bimestreLabel}`
          .toLowerCase()
          .includes(this.searchRecuperacoes().trim().toLowerCase()),
      );
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

  protected openCreateModal(): void {
    this.cancelEdit();
    this.modalVisible.set(true);
  }

  protected startEdit(item: Intervencao): void {
    this.editingId.set(item.id);
    this.modalVisible.set(true);
    this.form.setValue({
      alunoId: item.alunoId,
      turmaId: item.turmaId,
      materiaId: item.materiaId,
      bimestre: item.bimestre,
      risco: item.risco,
      status: item.status,
      objetivo: item.objetivo,
      descricao: item.descricao,
      responsavel: item.responsavel,
      prazo: item.prazo,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.modalVisible.set(false);
    this.form.reset({
      alunoId: '',
      turmaId: '',
      materiaId: '',
      bimestre: BIMESTRE_OPTIONS[0]?.value ?? '1o bimestre',
      risco: RISCO_OPTIONS[1]?.value ?? 'medio',
      status: STATUS_INTERVENCAO_OPTIONS[0]?.value ?? 'aberto',
      objetivo: '',
      descricao: '',
      responsavel: '',
      prazo: '',
    });
  }

  protected submitIntervencao(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate('common.validation'),
        detail: this.transloco.translate('intervencoes.validation.intervencao'),
      });
      return;
    }
    const wasEdit = !!this.editingId();
    this.facade.saveIntervencao(this.editingId(), this.form.getRawValue());
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate('common.success'),
      detail: this.transloco.translate(
        wasEdit ? 'intervencoes.toast.intervencaoUpdated' : 'intervencoes.toast.intervencaoCreated',
      ),
    });
    this.cancelEdit();
  }

  protected confirmRemoveIntervencao(id: string): void {
    this.confirmationService.confirm({
      header: this.transloco.translate('common.confirmRemoveTitle'),
      message: this.transloco.translate('intervencoes.confirm.removeIntervencao'),
      acceptLabel: this.transloco.translate('common.remove'),
      rejectLabel: this.transloco.translate('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.removeIntervencao(id);
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate('common.success'),
          detail: this.transloco.translate('intervencoes.toast.intervencaoRemoved'),
        });
      },
    });
  }

  protected openSimulacao(row?: RecuperacaoAcademica): void {
    this.simulacaoVisible.set(true);
    this.currentRecuperacaoId.set(row?.id ?? null);
    this.simulacaoForm.reset({
      alunoId: row?.alunoId ?? '',
      turmaId: row?.turmaId ?? '',
      materiaId: row?.materiaId ?? '',
      bimestre: row?.bimestre ?? BIMESTRE_OPTIONS[0]?.value ?? '1o bimestre',
      notaAtual: row?.notaAtual ?? 4,
      notaAlvo: row?.notaAlvo ?? 6,
      status: (row?.status ?? STATUS_RECUPERACAO_OPTIONS[0]?.value ?? 'pendente') as RecuperacaoAcademica['status'],
    });
  }

  protected closeSimulacao(): void {
    this.currentRecuperacaoId.set(null);
    this.simulacaoVisible.set(false);
  }

  protected confirmarSimulacao(): void {
    if (this.simulacaoForm.invalid) {
      this.simulacaoForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate('common.validation'),
        detail: this.transloco.translate('intervencoes.validation.recuperacao'),
      });
      return;
    }
    const wasEdit = !!this.currentRecuperacaoId();
    const value = this.simulacaoForm.getRawValue();
    const notaNecessaria = this.facade.simularNotaNecessaria(value.notaAtual, value.notaAlvo);
    this.facade.saveRecuperacao(this.currentRecuperacaoId(), {
      ...value,
      notaNecessaria,
    });
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate('common.success'),
      detail: this.transloco.translate(
        wasEdit ? 'intervencoes.toast.recuperacaoUpdated' : 'intervencoes.toast.recuperacaoSimGerada',
      ),
    });
    this.closeSimulacao();
  }

  protected confirmRemoveRecuperacao(id: string): void {
    this.confirmationService.confirm({
      header: this.transloco.translate('common.confirmRemoveTitle'),
      message: this.transloco.translate('intervencoes.confirm.removeRecuperacao'),
      acceptLabel: this.transloco.translate('common.remove'),
      rejectLabel: this.transloco.translate('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.removeRecuperacao(id);
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate('common.success'),
          detail: this.transloco.translate('intervencoes.toast.recuperacaoRemoved'),
        });
      },
    });
  }
}
