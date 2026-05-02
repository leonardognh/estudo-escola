import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map, startWith } from 'rxjs';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TableSearchComponent } from '@shared/components/table-search/table-search.component';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';

import { CalendarioFacade } from '@calendario/facades/calendario.facade';
import { DIA_SEMANA_OPTIONS, HorarioAula } from '@calendario/models/horario-aula.model';

@Component({
  selector: 'app-horarios-aulas-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    TooltipModule,
    CardModule,
    SelectModule,
    InputTextModule,
    TableModule,
    TabsModule,
    DialogModule,
    ConfirmDialogModule,
    TranslocoPipe,
    PageHeaderComponent,
    TableSearchComponent,
    FormActionsComponent,
  ],
  providers: [CalendarioFacade],
  templateUrl: './horarios-aulas-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorariosAulasPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly transloco = inject(TranslocoService);
  protected readonly facade = inject(CalendarioFacade);
  protected readonly editingId = signal<string | null>(null);
  protected readonly quickTurmaFilterId = signal<string | null>(null);
  protected readonly modalVisible = signal(false);

  private readonly langTick = toSignal(
    this.transloco.langChanges$.pipe(map(() => this.transloco.getActiveLang())),
    { initialValue: this.transloco.getActiveLang() },
  );

  protected readonly diaSemanaOptions = computed(() => {
    this.langTick();
    return DIA_SEMANA_OPTIONS.map((o) => ({
      value: o.value,
      label: this.transloco.translate('weekdays.' + o.value),
    }));
  });

  protected readonly form = this.formBuilder.nonNullable.group({
    turmaId: ['', [Validators.required]],
    materiaPorAnoId: ['', [Validators.required]],
    diaSemana: [DIA_SEMANA_OPTIONS[0]?.value ?? 'segunda', [Validators.required]],
    horaInicio: ['08:00', [Validators.required]],
    horaFim: ['09:00', [Validators.required]],
  });
  private readonly turmaIdSignal = toSignal(
    this.form.controls.turmaId.valueChanges.pipe(startWith(this.form.controls.turmaId.value)),
    { initialValue: this.form.controls.turmaId.value },
  );

  protected readonly turmasOptions = computed(() => {
    this.langTick();
    return this.facade.turmas().map((turma) => ({
      label: this.transloco.translate('horarios.turmaOption', {
        ano: turma.ano,
        nome: turma.nome,
        periodo:
          this.facade.getPeriodoById(turma.periodoId)?.nome ??
          this.transloco.translate('horarios.fallback.period'),
      }),
      value: turma.id,
    }));
  });
  protected readonly selectedTurmaPeriodo = computed(() => {
    const turma = this.facade.getTurmaById(this.turmaIdSignal());
    if (!turma) {
      return null;
    }
    return this.facade.getPeriodoById(turma.periodoId) ?? null;
  });
  protected readonly quickFilterTurmaPeriodo = computed(() => {
    const turmaId = this.quickTurmaFilterId();
    if (!turmaId) {
      return null;
    }
    const turma = this.facade.getTurmaById(turmaId);
    return turma ? this.facade.getPeriodoById(turma.periodoId) ?? null : null;
  });

  protected readonly materiasPorAnoForSelectedTurma = computed(() => {
    this.langTick();
    const turma = this.facade.getTurmaById(this.turmaIdSignal());
    if (!turma) {
      return [];
    }

    return this.facade
      .materiasPorAno()
      .filter((item) => item.ano === turma.ano)
      .map((item) => ({
        label: this.facade.getMateriaById(item.materiaId)?.nome ?? this.transloco.translate('horarios.fallback.subject'),
        value: item.id,
      }));
  });
  protected readonly horariosFiltrados = computed(() => {
    const turmaId = this.quickTurmaFilterId();
    if (!turmaId) {
      return this.facade.horariosAulas();
    }
    return this.facade.horariosAulas().filter((horario) => horario.turmaId === turmaId);
  });

  protected readonly horariosTableRows = computed(() => {
    this.langTick();
    return this.horariosFiltrados().map((horario) => ({
      ...horario,
      descricao: this.buildDescribeHorario(horario),
      diaSemanaLabel: this.transloco.translate('weekdays.' + horario.diaSemana),
    }));
  });
  protected readonly weekHourColumns = computed(() => {
    const periodo = this.quickFilterTurmaPeriodo();
    const allPeriodos = this.facade.periodos();
    const start = periodo?.horaInicio ?? allPeriodos.map((p) => p.horaInicio).sort()[0] ?? '08:00';
    const end =
      periodo?.horaFim ??
      allPeriodos.map((p) => p.horaFim).sort().at(-1) ??
      '18:00';
    const [startHour] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const columns: string[] = [];
    const lastHour = endMinute > 0 ? endHour : endHour - 1;

    for (let hour = startHour; hour <= lastHour; hour += 1) {
      columns.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return columns;
  });
  protected readonly weekRows = computed(() => {
    this.langTick();
    const dias = DIA_SEMANA_OPTIONS.filter((d) => d.value !== 'domingo').map((d) => ({
      key: d.value,
      label: this.transloco.translate('weekdays.' + d.value),
    }));

    return dias.map((dia) => {
      const cells = this.weekHourColumns().map((hour) => {
        return this.horariosFiltrados()
          .filter((horario) => horario.diaSemana === dia.key && horario.horaInicio === hour)
          .map((item) => {
            const materiaPorAno = this.facade.getMateriaPorAnoById(item.materiaPorAnoId);
            const materia = materiaPorAno ? this.facade.getMateriaById(materiaPorAno.materiaId) : null;
            const turma = this.facade.getTurmaById(item.turmaId);
            return {
              id: item.id,
              titulo: materia?.nome ?? this.transloco.translate('horarios.fallback.subject'),
              subtitulo: turma ? `${turma.ano} ${turma.nome}` : '',
              horario: `${item.horaInicio}-${item.horaFim}`,
            };
          });
      });

      return { dia: dia.label, cells };
    });
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
    const periodo = this.selectedTurmaPeriodo();
    if (!periodo) {
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate('common.validation'),
        detail: this.transloco.translate('horarios.validation.selectTurmaComPeriodo'),
      });
      return;
    }
    if (payload.horaInicio >= payload.horaFim) {
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate('common.validation'),
        detail: this.transloco.translate('horarios.validation.horaInicioMenorFim'),
      });
      return;
    }
    if (payload.horaInicio < periodo.horaInicio || payload.horaFim > periodo.horaFim) {
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate('common.validation'),
        detail: this.transloco.translate('horarios.validation.respeitarPeriodo', {
          nome: periodo.nome,
          inicio: periodo.horaInicio,
          fim: periodo.horaFim,
        }),
      });
      return;
    }

    this.facade.saveHorarioAula(this.editingId(), payload);
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate('common.success'),
      detail: this.transloco.translate(this.editingId() ? 'horarios.toast.updated' : 'horarios.toast.created'),
    });
    this.cancelEdit();
  }

  protected startEdit(horario: HorarioAula): void {
    this.editingId.set(horario.id);
    this.modalVisible.set(true);
    this.form.setValue({
      turmaId: horario.turmaId,
      materiaPorAnoId: horario.materiaPorAnoId,
      diaSemana: horario.diaSemana,
      horaInicio: horario.horaInicio,
      horaFim: horario.horaFim,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.modalVisible.set(false);
    this.form.reset({
      turmaId: '',
      materiaPorAnoId: '',
      diaSemana: DIA_SEMANA_OPTIONS[0]?.value ?? 'segunda',
      horaInicio: '08:00',
      horaFim: '09:00',
    });
  }

  protected remove(id: string): void {
    this.confirmationService.confirm({
      header: this.transloco.translate('common.confirmRemoveTitle'),
      message: this.transloco.translate('horarios.confirm.message'),
      acceptLabel: this.transloco.translate('common.remove'),
      rejectLabel: this.transloco.translate('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.removeHorarioAula(id);
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate('common.success'),
          detail: this.transloco.translate('horarios.toast.removed'),
        });
      },
    });
  }

  protected setQuickTurmaFilter(turmaId: string): void {
    this.quickTurmaFilterId.set(this.quickTurmaFilterId() === turmaId ? null : turmaId);
  }

  private buildDescribeHorario(horario: HorarioAula): string {
    this.langTick();
    const turma = this.facade.getTurmaById(horario.turmaId);
    const materiaPorAno = this.facade.getMateriaPorAnoById(horario.materiaPorAnoId);
    if (!turma || !materiaPorAno) {
      return this.transloco.translate('horarios.incomplete');
    }

    const materia = this.facade.getMateriaById(materiaPorAno.materiaId);
    const principal = this.facade.getProfessorById(materiaPorAno.professorPrincipalId);
    const periodo = this.facade.getPeriodoById(turma.periodoId);
    return this.transloco.translate('horarios.describe', {
      turma: `${turma.ano} ${turma.nome}`,
      periodo: periodo?.nome ?? this.transloco.translate('horarios.fallback.period'),
      materia: materia?.nome ?? this.transloco.translate('horarios.fallback.subject'),
      horas: `${horario.horaInicio}-${horario.horaFim}`,
      profLabel: this.transloco.translate('horarios.profLabel'),
      professor: principal?.nome ?? '-',
    });
  }
}
