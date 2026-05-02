import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TableSearchComponent } from '@shared/components/table-search/table-search.component';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';

import { ResponsaveisFacade } from '@responsaveis/facades/responsaveis.facade';
import { Responsavel } from '@responsaveis/models/responsavel.model';

function alunosIdsObrigatorios(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string[] | null | undefined;
  return v && v.length > 0 ? null : { alunosObrigatorios: true };
}

@Component({
  selector: 'app-responsaveis-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    MultiSelectModule,
    TranslocoPipe,
    PageHeaderComponent,
    TableSearchComponent,
    FormActionsComponent,
  ],
  providers: [ResponsaveisFacade],
  templateUrl: './responsaveis-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsaveisPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly transloco = inject(TranslocoService);
  protected readonly facade = inject(ResponsaveisFacade);
  protected readonly editingId = signal<string | null>(null);
  protected readonly modalVisible = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: [''],
    alunosIds: [[] as string[], [Validators.required, alunosIdsObrigatorios]],
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
        detail: this.transloco.translate('responsaveis.validation.submit'),
      });
      return;
    }
    this.facade.saveResponsavel(this.editingId(), this.form.getRawValue());
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate('common.success'),
      detail: this.transloco.translate(
        this.editingId() ? 'responsaveis.toast.updated' : 'responsaveis.toast.created',
      ),
    });
    this.cancelEdit();
  }

  protected startEdit(row: Responsavel): void {
    this.editingId.set(row.id);
    this.modalVisible.set(true);
    this.form.setValue({
      nome: row.nome,
      email: row.email,
      telefone: row.telefone ?? '',
      alunosIds: [...row.alunosIds],
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.modalVisible.set(false);
    this.form.reset({
      nome: '',
      email: '',
      telefone: '',
      alunosIds: [],
    });
  }

  protected remove(id: string): void {
    this.confirmationService.confirm({
      header: this.transloco.translate('common.confirmRemoveTitle'),
      message: this.transloco.translate('responsaveis.confirm.message'),
      acceptLabel: this.transloco.translate('common.remove'),
      rejectLabel: this.transloco.translate('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.deleteResponsavel(id);
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate('common.success'),
          detail: this.transloco.translate('responsaveis.toast.removed'),
        });
      },
    });
  }
}
