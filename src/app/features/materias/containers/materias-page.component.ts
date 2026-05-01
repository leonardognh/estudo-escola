import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TableSearchComponent } from '@shared/components/table-search/table-search.component';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';

import { MateriasFacade } from '@materias/facades/materias.facade';
import { Materia } from '@materias/models/materia.model';

@Component({
  selector: 'app-materias-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    PageHeaderComponent,
    TableSearchComponent,
    FormActionsComponent,
  ],
  providers: [MateriasFacade],
  templateUrl: './materias-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MateriasPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly facade = inject(MateriasFacade);
  protected readonly editingMateriaId = signal<string | null>(null);
  protected readonly modalVisible = signal(false);
  protected readonly labels = {
    title: 'Cadastro de materias',
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    remove: 'Remover',
  };

  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    codigo: ['', [Validators.required]],
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

  protected openCreateModal(): void {
    this.cancelMateriaEdit();
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

    this.facade.saveMateria(this.editingMateriaId(), this.form.getRawValue());
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: this.editingMateriaId() ? 'Materia atualizada.' : 'Materia cadastrada.',
    });
    this.cancelMateriaEdit();
  }

  protected startEdit(materia: Materia): void {
    this.editingMateriaId.set(materia.id);
    this.modalVisible.set(true);
    this.form.setValue({
      nome: materia.nome,
      codigo: materia.codigo,
    });
  }

  protected cancelMateriaEdit(): void {
    this.editingMateriaId.set(null);
    this.modalVisible.set(false);
    this.form.reset({
      nome: '',
      codigo: '',
    });
  }

  protected remove(id: string): void {
    this.confirmationService.confirm({
      header: 'Confirmar remocao',
      message: 'Deseja remover esta materia?',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.deleteMateria(id);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Materia removida.',
        });
      },
    });
  }
}
