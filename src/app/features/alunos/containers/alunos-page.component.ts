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

import { AlunosFacade } from '@alunos/facades/alunos.facade';

@Component({
  selector: 'app-alunos-page',
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
  providers: [AlunosFacade],
  templateUrl: './alunos-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlunosPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly facade = inject(AlunosFacade);
  protected readonly editingId = signal<string | null>(null);
  protected readonly modalVisible = signal(false);
  protected readonly labels = {
    title: 'Cadastro de alunos',
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar',
    remove: 'Remover',
  };

  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.facade.loadAlunos();
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

    this.facade.saveAluno(this.editingId(), this.form.getRawValue());
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: this.editingId() ? 'Aluno atualizado.' : 'Aluno cadastrado.',
    });
    this.cancelEdit();
  }

  protected startEdit(aluno: { id: string; nome: string; email: string }): void {
    this.editingId.set(aluno.id);
    this.modalVisible.set(true);
    this.form.setValue({
      nome: aluno.nome,
      email: aluno.email,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.modalVisible.set(false);
    this.form.reset();
  }

  protected remove(id: string): void {
    this.confirmationService.confirm({
      header: 'Confirmar remocao',
      message: 'Deseja remover este aluno?',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.deleteAluno(id);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Aluno removido.',
        });
      },
    });
  }
}
