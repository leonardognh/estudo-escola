import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AtividadesFacade } from '@atividades/facades/atividades.facade';
import { Atividade, TIPO_ATIVIDADE_OPTIONS } from '@atividades/models/atividade.model';
import { BIMESTRE_OPTIONS } from '@notas/models/nota.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TableSearchComponent } from '@shared/components/table-search/table-search.component';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';

@Component({
  selector: 'app-atividades-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    ConfirmDialogModule,
    TabsModule,
    SelectModule,
    InputTextModule,
    TableModule,
    PageHeaderComponent,
    TableSearchComponent,
    FormActionsComponent,
  ],
  providers: [AtividadesFacade],
  templateUrl: './atividades-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtividadesPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  protected readonly facade = inject(AtividadesFacade);
  protected readonly modalVisible = signal(false);
  protected readonly calculoModalVisible = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly calculoContext = signal<{
    alunoId: string;
    turmaId: string;
    materiaId: string;
    bimestre: string;
    alunoNome: string;
    turmaNome: string;
    materiaNome: string;
  } | null>(null);
  protected readonly calculoItens = signal<{ id: string; nome: string; notaAtividade: number; peso: number }[]>([]);
  protected readonly notaFinalEditavel = signal(0);
  protected readonly tipoOptions = [...TIPO_ATIVIDADE_OPTIONS];
  protected readonly bimestreOptions = [...BIMESTRE_OPTIONS];

  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    descricao: ['', [Validators.required, Validators.minLength(5)]],
    tipo: [this.tipoOptions[0]?.value ?? 'prova', [Validators.required]],
    turmaId: ['', [Validators.required]],
    alunoId: ['', [Validators.required]],
    materiaId: ['', [Validators.required]],
    bimestre: [this.bimestreOptions[0]?.value ?? '1o bimestre', [Validators.required]],
    peso: [1, [Validators.required, Validators.min(0.1)]],
    notaAtividade: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
  });
  private readonly turmaIdSignal = toSignal(
    this.form.controls.turmaId.valueChanges.pipe(startWith(this.form.controls.turmaId.value)),
    { initialValue: this.form.controls.turmaId.value },
  );

  protected readonly alunosOptions = computed(() =>
    this.facade.getAlunosByTurma(this.turmaIdSignal()).map((aluno) => ({ label: aluno.nome, value: aluno.id })),
  );
  protected readonly materiasOptions = computed(() =>
    this.facade
      .getMateriasByTurma(this.turmaIdSignal())
      .map((materia) => ({ label: materia.nome, value: materia.id })),
  );
  protected readonly atividadesRows = computed(() =>
    this.facade.atividades().map((atividade) => ({
      ...atividade,
      turmaNome: this.facade.getTurmaNomeById(atividade.turmaId),
      alunoNome: this.facade.getAlunoNomeById(atividade.alunoId),
      materiaNome: this.facade.getMateriaNomeById(atividade.materiaId),
    })),
  );
  protected readonly atividadeGroups = computed(() => {
    const groups = new Map<
      string,
      {
        key: string;
        alunoId: string;
        turmaId: string;
        materiaId: string;
        bimestre: string;
        alunoNome: string;
        turmaNome: string;
        materiaNome: string;
        atividades: { id: string; nome: string; notaAtividade: number; peso: number }[];
      }
    >();

    for (const row of this.atividadesRows()) {
      const key = `${row.alunoId}|${row.turmaId}|${row.materiaId}|${row.bimestre}`;
      const current = groups.get(key) ?? {
        key,
        alunoId: row.alunoId,
        turmaId: row.turmaId,
        materiaId: row.materiaId,
        bimestre: row.bimestre,
        alunoNome: row.alunoNome,
        turmaNome: row.turmaNome,
        materiaNome: row.materiaNome,
        atividades: [],
      };
      current.atividades.push({
        id: row.id,
        nome: row.nome,
        notaAtividade: row.notaAtividade,
        peso: row.peso,
      });
      groups.set(key, current);
    }
    return Array.from(groups.values());
  });

  constructor() {
    this.facade.loadData();
    effect(() => {
      const error = this.facade.errorMessage();
      if (error) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: error });
      }
    });
  }

  protected openCreateModal(): void {
    this.cancelEdit();
    this.modalVisible.set(true);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validacao',
        detail: 'Preencha os campos obrigatorios corretamente.',
      });
      return;
    }
    this.facade.saveAtividade(this.editingId(), this.form.getRawValue());
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: this.editingId() ? 'Atividade atualizada.' : 'Atividade cadastrada.',
    });
    this.cancelEdit();
  }

  protected startEdit(atividade: Atividade): void {
    this.editingId.set(atividade.id);
    this.modalVisible.set(true);
    this.form.setValue({
      nome: atividade.nome,
      descricao: atividade.descricao,
      tipo: atividade.tipo,
      turmaId: atividade.turmaId,
      alunoId: atividade.alunoId,
      materiaId: atividade.materiaId,
      bimestre: atividade.bimestre,
      peso: atividade.peso,
      notaAtividade: atividade.notaAtividade,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.modalVisible.set(false);
    this.form.reset({
      nome: '',
      descricao: '',
      tipo: this.tipoOptions[0]?.value ?? 'prova',
      turmaId: '',
      alunoId: '',
      materiaId: '',
      bimestre: this.bimestreOptions[0]?.value ?? '1o bimestre',
      peso: 1,
      notaAtividade: 0,
    });
  }

  protected confirmRemove(id: string): void {
    this.confirmationService.confirm({
      header: 'Confirmar remocao',
      message: 'Deseja remover esta atividade?',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.removeAtividade(id);
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Atividade removida.' });
      },
    });
  }

  protected gerarNota(group: {
    alunoId: string;
    turmaId: string;
    materiaId: string;
    bimestre: string;
    alunoNome: string;
    turmaNome: string;
    materiaNome: string;
    atividades: { id: string; nome: string; notaAtividade: number; peso: number }[];
  }): void {
    this.calculoContext.set({
      alunoId: group.alunoId,
      turmaId: group.turmaId,
      materiaId: group.materiaId,
      bimestre: group.bimestre,
      alunoNome: group.alunoNome,
      turmaNome: group.turmaNome,
      materiaNome: group.materiaNome,
    });
    const itens = group.atividades.map((item) => ({ ...item }));
    this.calculoItens.set(itens);
    this.notaFinalEditavel.set(this.calcularMediaPonderada(itens));
    this.calculoModalVisible.set(true);
  }

  protected atualizarItem(index: number, field: 'notaAtividade' | 'peso', value: number): void {
    const parsedValue = Number(value);
    const next = this.calculoItens().map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: parsedValue } : item,
    );
    this.calculoItens.set(next);
    this.notaFinalEditavel.set(this.calcularMediaPonderada(next));
  }

  protected confirmarGerarNota(): void {
    const context = this.calculoContext();
    if (!context) {
      return;
    }
    this.facade.gerarNotaFinalPorGrupoComDetalhes(
      context.alunoId,
      context.turmaId,
      context.materiaId,
      context.bimestre,
      this.calculoItens(),
      Number(this.notaFinalEditavel()),
    );
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Nota gerada/atualizada a partir das atividades.',
    });
    this.calculoModalVisible.set(false);
    this.calculoContext.set(null);
    this.calculoItens.set([]);
  }

  protected cancelarGerarNota(): void {
    this.calculoModalVisible.set(false);
    this.calculoContext.set(null);
    this.calculoItens.set([]);
  }

  private calcularMediaPonderada(items: { notaAtividade: number; peso: number }[]): number {
    const somaPesos = items.reduce((acc, item) => acc + Number(item.peso || 0), 0);
    if (somaPesos <= 0) {
      return 0;
    }
    const media = items.reduce(
      (acc, item) => acc + Number(item.notaAtividade || 0) * Number(item.peso || 0),
      0,
    ) / somaPesos;
    return Number(media.toFixed(2));
  }
}
