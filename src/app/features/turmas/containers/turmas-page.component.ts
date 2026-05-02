import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
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
    TooltipModule,
    CardModule,
    SelectModule,
    MultiSelectModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    TranslocoPipe,
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
  private readonly transloco = inject(TranslocoService);
  protected readonly facade = inject(TurmasFacade);
  protected readonly editingId = signal<string | null>(null);
  protected readonly modalVisible = signal(false);

  private readonly langTick = toSignal(
    this.transloco.langChanges$.pipe(map(() => this.transloco.getActiveLang())),
    { initialValue: this.transloco.getActiveLang() },
  );

  protected readonly anoOptionsDisplay = computed(() => {
    this.langTick();
    return ANO_OPTIONS.map((o) => ({
      value: o.value,
      label: this.transloco.translate('turmas.ano.' + o.value.replace(/\s+/g, '_')),
    }));
  });

  protected readonly divisaoNotasOptionsDisplay = computed(() => {
    this.langTick();
    return DIVISAO_NOTAS_OPTIONS.map((o) => ({
      value: o.value,
      label: this.transloco.translate('turmas.grading.' + o.value),
    }));
  });

  protected readonly form = this.formBuilder.nonNullable.group({
    ano: [ANO_OPTIONS[0]?.value ?? '', [Validators.required]],
    nome: ['', [Validators.required, Validators.minLength(1)]],
    periodoId: ['', [Validators.required]],
    divisaoNotas: [DIVISAO_NOTAS_OPTIONS[0]?.value ?? 'bimestral', [Validators.required]],
    alunosIds: [[] as string[]],
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

    this.facade.saveTurma(this.editingId(), this.form.getRawValue());
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate('common.success'),
      detail: this.transloco.translate(this.editingId() ? 'turmas.toast.updated' : 'turmas.toast.created'),
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
      divisaoNotas: turma.divisaoNotas ?? DIVISAO_NOTAS_OPTIONS[0]?.value ?? 'bimestral',
      alunosIds: turma.alunosIds,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.modalVisible.set(false);
    this.form.reset({
      ano: ANO_OPTIONS[0]?.value ?? '',
      nome: '',
      periodoId: '',
      divisaoNotas: DIVISAO_NOTAS_OPTIONS[0]?.value ?? 'bimestral',
      alunosIds: [],
    });
  }

  protected remove(id: string): void {
    this.confirmationService.confirm({
      header: this.transloco.translate('common.confirmRemoveTitle'),
      message: this.transloco.translate('turmas.confirm.message'),
      acceptLabel: this.transloco.translate('common.remove'),
      rejectLabel: this.transloco.translate('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.deleteTurma(id);
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate('common.success'),
          detail: this.transloco.translate('turmas.toast.removed'),
        });
      },
    });
  }
}
