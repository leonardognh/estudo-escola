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

import { ProfessoresFacade } from '@professores/facades/professores.facade';
import { Professor } from '@professores/models/professor.model';

@Component({
  selector: 'app-professores-page',
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
  providers: [ProfessoresFacade],
  templateUrl: './professores-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessoresPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly facade = inject(ProfessoresFacade);
  protected readonly editingId = signal<string | null>(null);
  protected readonly modalVisible = signal(false);
  protected readonly labels = {
    title: 'Cadastro de professores',
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    remove: 'Remover',
  };

  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    materiaPrincipalId: ['', [Validators.required]],
    outrasMateriasIds: [[] as string[]],
  });

  constructor() {
    this.facade.loadProfessores();
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

    const rawValue = this.form.getRawValue();
    const payload = {
      ...rawValue,
      outrasMateriasIds: rawValue.outrasMateriasIds.filter(
        (materiaId) => materiaId !== rawValue.materiaPrincipalId,
      ),
    };

    this.facade.saveProfessor(this.editingId(), payload);
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: this.editingId() ? 'Professor atualizado.' : 'Professor cadastrado.',
    });
    this.cancelEdit();
  }

  protected startEdit(professor: Professor): void {
    this.editingId.set(professor.id);
    this.modalVisible.set(true);
    this.form.setValue({
      nome: professor.nome,
      email: professor.email,
      materiaPrincipalId: professor.materiaPrincipalId,
      outrasMateriasIds: professor.outrasMateriasIds,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.modalVisible.set(false);
    this.form.reset({
      nome: '',
      email: '',
      materiaPrincipalId: '',
      outrasMateriasIds: [],
    });
  }

  protected remove(id: string): void {
    this.confirmationService.confirm({
      header: 'Confirmar remocao',
      message: 'Deseja remover este professor?',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.deleteProfessor(id);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Professor removido.',
        });
      },
    });
  }

  protected getOutrasMateriasOptions(principalId: string) {
    return this.facade.materiaOptions().filter((option) => option.value !== principalId);
  }
}
