import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TableSearchComponent } from '@shared/components/table-search/table-search.component';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';

import { PeriodosFacade } from '@periodos/facades/periodos.facade';
import { Periodo } from '@periodos/models/periodo.model';

@Component({
  selector: 'app-periodos-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    TooltipModule,
    CardModule,
    InputTextModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    TranslocoPipe,
    PageHeaderComponent,
    TableSearchComponent,
    FormActionsComponent,
  ],
  providers: [PeriodosFacade],
  templateUrl: './periodos-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodosPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly transloco = inject(TranslocoService);
  protected readonly facade = inject(PeriodosFacade);
  protected readonly editingId = signal<string | null>(null);
  protected readonly modalVisible = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    horaInicio: ['08:00', [Validators.required]],
    horaFim: ['12:00', [Validators.required]],
  });

  constructor() {
    this.facade.loadPeriodos();
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

    if (this.form.controls.horaInicio.value >= this.form.controls.horaFim.value) {
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate('common.validation'),
        detail: this.transloco.translate('validation.timeStartBeforeEnd'),
      });
      return;
    }

    this.facade.savePeriodo(this.editingId(), this.form.getRawValue());
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate('common.success'),
      detail: this.transloco.translate(this.editingId() ? 'periodos.toast.updated' : 'periodos.toast.created'),
    });
    this.cancelEdit();
  }

  protected startEdit(periodo: Periodo): void {
    this.editingId.set(periodo.id);
    this.modalVisible.set(true);
    this.form.setValue({
      nome: periodo.nome,
      horaInicio: periodo.horaInicio,
      horaFim: periodo.horaFim,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.modalVisible.set(false);
    this.form.reset({
      nome: '',
      horaInicio: '08:00',
      horaFim: '12:00',
    });
  }

  protected remove(id: string): void {
    this.confirmationService.confirm({
      header: this.transloco.translate('common.confirmRemoveTitle'),
      message: this.transloco.translate('periodos.confirm.message'),
      acceptLabel: this.transloco.translate('common.remove'),
      rejectLabel: this.transloco.translate('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.deletePeriodo(id);
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate('common.success'),
          detail: this.transloco.translate('periodos.toast.removed'),
        });
      },
    });
  }
}
