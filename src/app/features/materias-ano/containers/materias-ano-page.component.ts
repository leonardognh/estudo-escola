import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TableSearchComponent } from '@shared/components/table-search/table-search.component';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';

import { MateriasFacade } from '@materias/facades/materias.facade';
import { ANO_OPTIONS, MateriaPorAnoFormValue } from '@materias/models/materia.model';

@Component({
  selector: 'app-materias-ano-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    SelectModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    PageHeaderComponent,
    TableSearchComponent,
    FormActionsComponent,
  ],
  providers: [MateriasFacade],
  templateUrl: './materias-ano-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MateriasAnoPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly facade = inject(MateriasFacade);
  protected readonly anoOptions = [...ANO_OPTIONS];
  protected readonly modalVisible = signal(false);
  protected readonly editingAno = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);

  protected readonly labels = {
    title: 'Atribuicao de materias por ano',
    save: 'Salvar',
    cancel: 'Cancelar',
  };

  protected readonly anoForm = this.formBuilder.nonNullable.group({
    ano: [this.anoOptions[0]?.value ?? '', [Validators.required]],
    itens: this.formBuilder.array([this.createAnoMateriaItemForm()]),
  });

  protected readonly groupedRows = computed(() => {
    const grouped = new Map<string, string[]>();
    for (const item of this.facade.materiasPorAno()) {
      const current = grouped.get(item.ano) ?? [];
      current.push(this.facade.getMateriaNameById(item.materiaId));
      grouped.set(item.ano, current);
    }
    return Array.from(grouped.entries()).map(([ano, materias]) => ({
      ano,
      materias: materias.join(', '),
    }));
  });

  constructor() {
    this.facade.loadMaterias();
    effect(() => {
      const error = this.facade.errorMessage();
      if (error) {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: error });
      }
    });
  }

  protected get anoMateriaItens(): FormArray {
    return this.anoForm.controls.itens as FormArray;
  }

  protected openCreateModal(): void {
    this.resetModalState();
    this.modalVisible.set(true);
  }

  protected openEditModal(ano: string): void {
    this.resetModalState();
    this.editingAno.set(ano);
    this.modalVisible.set(true);

    const items = this.facade.materiasPorAno().filter((item) => item.ano === ano);
    this.anoForm.controls.ano.setValue(ano);
    this.anoForm.setControl(
      'itens',
      this.formBuilder.array(
        items.length
          ? items.map((item) =>
              this.formBuilder.nonNullable.group({
                materiaId: [item.materiaId, [Validators.required]],
                cargaHoraria: [item.cargaHoraria, [Validators.required, Validators.min(1)]],
                professorPrincipalId: [item.professorPrincipalId, [Validators.required]],
                professorSubstitutoId: [item.professorSubstitutoId ?? ''],
              }),
            )
          : [this.createAnoMateriaItemForm()],
      ),
    );
  }

  protected submitAnoMateria(): void {
    if (this.anoForm.invalid) {
      this.anoForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validacao',
        detail: 'Preencha os campos obrigatorios.',
      });
      return;
    }

    this.formError.set(null);
    const ano = this.anoForm.controls.ano.value;
    const itens = this.anoMateriaItens.getRawValue() as {
      materiaId: string;
      cargaHoraria: number;
      professorPrincipalId: string;
      professorSubstitutoId: string;
    }[];

    if (new Set(itens.map((item) => item.materiaId)).size !== itens.length) {
      this.formError.set('Nao repita materia no mesmo ano.');
      return;
    }

    const hasInvalidProfessores = itens.some((item) => {
      if (item.professorSubstitutoId && item.professorPrincipalId === item.professorSubstitutoId) {
        return true;
      }
      const allowed = new Set(this.facade.getProfessoresByMateria(item.materiaId).map((professor) => professor.id));
      return (
        !allowed.has(item.professorPrincipalId) ||
        (item.professorSubstitutoId && !allowed.has(item.professorSubstitutoId))
      );
    });

    if (hasInvalidProfessores) {
      this.formError.set('Professores devem ser validos para a materia e diferentes entre si.');
      return;
    }

    const payloads: MateriaPorAnoFormValue[] = itens.map((item) => ({
      ano,
      materiaId: item.materiaId,
      cargaHoraria: Number(item.cargaHoraria),
      professorPrincipalId: item.professorPrincipalId,
      professorSubstitutoId: item.professorSubstitutoId || null,
    }));

    const originalAno = this.editingAno();
    if (originalAno) {
      this.facade.replaceMateriasPorAnoByAno(originalAno, payloads);
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Atribuicoes do ano atualizadas.',
      });
    } else {
      this.facade.saveMateriasPorAnoLote(payloads);
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Atribuicoes cadastradas.',
      });
    }

    this.closeModal();
  }

  protected addAnoMateriaItem(): void {
    this.anoMateriaItens.push(this.createAnoMateriaItemForm());
  }

  protected removeAnoMateriaItem(index: number): void {
    if (this.anoMateriaItens.length === 1) {
      return;
    }
    this.anoMateriaItens.removeAt(index);
  }

  protected confirmRemoveAno(ano: string): void {
    this.confirmationService.confirm({
      header: 'Confirmar remocao',
      message: `Deseja remover todas as materias atribuidas ao ano ${ano}?`,
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.replaceMateriasPorAnoByAno(ano, []);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Atribuicoes do ano ${ano} removidas.`,
        });
      },
    });
  }

  protected closeModal(): void {
    this.modalVisible.set(false);
    this.resetModalState();
  }

  protected getProfessoresOptionsByMateria(materiaId: string) {
    return this.facade.getProfessoresByMateria(materiaId).map((professor) => ({
      label: professor.nome,
      value: professor.id,
    }));
  }

  private resetModalState(): void {
    this.editingAno.set(null);
    this.formError.set(null);
    this.anoForm.reset({ ano: this.anoOptions[0]?.value ?? '' });
    this.anoForm.setControl('itens', this.formBuilder.array([this.createAnoMateriaItemForm()]));
  }

  private createAnoMateriaItemForm() {
    return this.formBuilder.nonNullable.group({
      materiaId: ['', [Validators.required]],
      cargaHoraria: [40, [Validators.required, Validators.min(1)]],
      professorPrincipalId: ['', [Validators.required]],
      professorSubstitutoId: [''],
    });
  }
}
