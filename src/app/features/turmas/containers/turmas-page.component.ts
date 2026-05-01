import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TableSearchComponent } from '@shared/components/table-search/table-search.component';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';

import { TurmasFacade } from '@turmas/facades/turmas.facade';
import { ANO_OPTIONS, DIVISAO_NOTAS_OPTIONS, Turma } from '@turmas/models/turma.model';

@Component({
  selector: 'app-turmas-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    SelectModule,
    MultiSelectModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    PageHeaderComponent,
    TableSearchComponent,
    FormActionsComponent,
  ],
  providers: [TurmasFacade],
  templateUrl: './turmas-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurmasPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly facade = inject(TurmasFacade);
  protected readonly editingId = signal<string | null>(null);
  protected readonly modalVisible = signal(false);
  protected readonly labels = {
    title: 'Cadastro de turmas',
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    remove: 'Remover',
  };
  protected readonly anoOptions = [...ANO_OPTIONS];
  protected readonly divisaoNotasOptions = [...DIVISAO_NOTAS_OPTIONS];

  protected readonly form = this.formBuilder.nonNullable.group({
    ano: [this.anoOptions[0]?.value ?? '', [Validators.required]],
    nome: ['', [Validators.required, Validators.minLength(1)]],
    periodoId: ['', [Validators.required]],
    divisaoNotas: [this.divisaoNotasOptions[0]?.value ?? 'bimestral', [Validators.required]],
    alunosIds: [[] as string[]],
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

    this.facade.saveTurma(this.editingId(), this.form.getRawValue());
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: this.editingId() ? 'Turma atualizada.' : 'Turma cadastrada.',
    });
    this.cancelEdit();
  }

  protected startEdit(turma: Turma): void {
    this.editingId.set(turma.id);
    this.modalVisible.set(true);
    this.form.setValue({
      ano: turma.ano,
      nome: turma.nome,
      periodoId: turma.periodoId,
      divisaoNotas: turma.divisaoNotas ?? this.divisaoNotasOptions[0]?.value ?? 'bimestral',
      alunosIds: turma.alunosIds,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.modalVisible.set(false);
    this.form.reset({
      ano: this.anoOptions[0]?.value ?? '',
      nome: '',
      periodoId: '',
      divisaoNotas: this.divisaoNotasOptions[0]?.value ?? 'bimestral',
      alunosIds: [],
    });
  }

  protected remove(id: string): void {
    this.confirmationService.confirm({
      header: 'Confirmar remocao',
      message: 'Deseja remover esta turma?',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.deleteTurma(id);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Turma removida.',
        });
      },
    });
  }
}
