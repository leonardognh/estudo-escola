import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';
import { startWith } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TableSearchComponent } from '@shared/components/table-search/table-search.component';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';

import { NotasFacade } from '@notas/facades/notas.facade';
import { BIMESTRE_OPTIONS, Nota } from '@notas/models/nota.model';

@Component({
  selector: 'app-notas-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    TooltipModule,
    CardModule,
    DialogModule,
    ConfirmDialogModule,
    TabsModule,
    SelectModule,
    MultiSelectModule,
    InputTextModule,
    TableModule,
    TranslocoPipe,
    PageHeaderComponent,
    TableSearchComponent,
    FormActionsComponent,
  ],
  providers: [NotasFacade],
  templateUrl: './notas-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotasPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);
  protected readonly facade = inject(NotasFacade);
  protected readonly modalVisible = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly bimestreOptions = [...BIMESTRE_OPTIONS];
  protected readonly boletimAlunoIds = signal<string[]>([]);
  protected readonly boletimBimestres = signal<string[]>([]);

  protected readonly form = this.formBuilder.nonNullable.group({
    turmaId: ['', [Validators.required]],
    alunoId: ['', [Validators.required]],
    materiaId: ['', [Validators.required]],
    bimestre: [this.bimestreOptions[0]?.value ?? '1o bimestre', [Validators.required]],
    valor: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
  });
  private readonly turmaIdSignal = toSignal(
    this.form.controls.turmaId.valueChanges.pipe(startWith(this.form.controls.turmaId.value)),
    { initialValue: this.form.controls.turmaId.value },
  );

  protected readonly alunosOptions = computed(() =>
    this.facade.getAlunosByTurma(this.turmaIdSignal()).map((aluno) => ({
      label: aluno.nome,
      value: aluno.id,
    })),
  );

  protected readonly materiasOptions = computed(() =>
    this.facade.getMateriasByTurma(this.turmaIdSignal()).map((materia) => ({
      label: materia.nome,
      value: materia.id,
    })),
  );

  protected readonly boletimRows = computed(() =>
    this.facade.notas().map((nota) => ({
      ...nota,
      turmaNome: this.facade.getTurmaById(nota.turmaId)?.nome ?? '-',
      alunoNome: this.facade.getAlunoById(nota.alunoId)?.nome ?? '-',
      materiaNome: this.facade.getMateriaById(nota.materiaId)?.nome ?? '-',
    })),
  );
  protected readonly boletimFilteredRows = computed(() =>
    this.boletimRows().filter((row) => {
      const selectedAlunos = this.boletimAlunoIds();
      const selectedBimestres = this.boletimBimestres();
      const alunoMatch = !selectedAlunos.length || selectedAlunos.includes(row.alunoId);
      const bimestreMatch = !selectedBimestres.length || selectedBimestres.includes(row.bimestre);
      return alunoMatch && bimestreMatch;
    }),
  );
  protected readonly boletimAlunoOptions = computed(() =>
    this.facade.alunos().map((aluno) => ({
      label: aluno.nome,
      value: aluno.id,
    })),
  );
  protected readonly boletimGroups = computed(() => {
    const groups = new Map<
      string,
      {
        alunoNome: string;
        turmaNome: string;
        bimestre: string;
        items: { materiaNome: string; valor: number }[];
      }
    >();

    for (const row of this.boletimFilteredRows()) {
      const key = `${row.alunoId}|${row.turmaId}|${row.bimestre}`;
      const current = groups.get(key) ?? {
        alunoNome: row.alunoNome,
        turmaNome: row.turmaNome,
        bimestre: row.bimestre,
        items: [],
      };
      current.items.push({ materiaNome: row.materiaNome, valor: row.valor });
      groups.set(key, current);
    }

    return Array.from(groups.values());
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

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate('common.validation'),
        detail: this.transloco.translate('validation.fillFields'),
      });
      return;
    }

    const payload = this.form.getRawValue();
    const duplicate = this.facade
      .notas()
      .find(
        (nota) =>
          nota.alunoId === payload.alunoId &&
          nota.turmaId === payload.turmaId &&
          nota.materiaId === payload.materiaId &&
          nota.bimestre === payload.bimestre &&
          nota.id !== this.editingId(),
      );
    if (duplicate) {
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate('notas.duplicate.summary'),
        detail: this.transloco.translate('notas.duplicate.detail'),
      });
      return;
    }

    this.facade.saveNota(this.editingId(), payload);
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate('common.success'),
      detail: this.transloco.translate(this.editingId() ? 'notas.toast.updated' : 'notas.toast.created'),
    });
    this.cancelEdit();
  }

  protected startEdit(nota: Nota): void {
    this.editingId.set(nota.id);
    this.modalVisible.set(true);
    this.form.setValue({
      turmaId: nota.turmaId,
      alunoId: nota.alunoId,
      materiaId: nota.materiaId,
      bimestre: nota.bimestre,
      valor: nota.valor,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.modalVisible.set(false);
    this.form.reset({
      turmaId: '',
      alunoId: '',
      materiaId: '',
      bimestre: this.bimestreOptions[0]?.value ?? '1o bimestre',
      valor: 0,
    });
  }

  protected confirmRemove(id: string): void {
    this.confirmationService.confirm({
      header: this.transloco.translate('common.confirmRemoveTitle'),
      message: this.transloco.translate('notas.confirm.message'),
      acceptLabel: this.transloco.translate('common.remove'),
      rejectLabel: this.transloco.translate('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.removeNota(id);
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate('common.success'),
          detail: this.transloco.translate('notas.toast.removed'),
        });
      },
    });
  }
}
