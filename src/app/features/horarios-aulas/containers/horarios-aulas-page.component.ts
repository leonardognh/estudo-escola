import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
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
    CardModule,
    SelectModule,
    InputTextModule,
    TableModule,
    TabsModule,
    DialogModule,
    ConfirmDialogModule,
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
  protected readonly facade = inject(CalendarioFacade);
  protected readonly editingId = signal<string | null>(null);
  protected readonly quickTurmaFilterId = signal<string | null>(null);
  protected readonly modalVisible = signal(false);
  protected readonly diaSemanaOptions = [...DIA_SEMANA_OPTIONS];

  protected readonly form = this.formBuilder.nonNullable.group({
    turmaId: ['', [Validators.required]],
    materiaPorAnoId: ['', [Validators.required]],
    diaSemana: [this.diaSemanaOptions[0]?.value ?? 'segunda', [Validators.required]],
    horaInicio: ['08:00', [Validators.required]],
    horaFim: ['09:00', [Validators.required]],
  });
  private readonly turmaIdSignal = toSignal(
    this.form.controls.turmaId.valueChanges.pipe(startWith(this.form.controls.turmaId.value)),
    { initialValue: this.form.controls.turmaId.value },
  );

  protected readonly turmasOptions = computed(() =>
    this.facade.turmas().map((turma) => ({
      label: `${turma.ano} ${turma.nome} (${this.facade.getPeriodoById(turma.periodoId)?.nome ?? 'Periodo'})`,
      value: turma.id,
    })),
  );
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
    const turma = this.facade.getTurmaById(this.turmaIdSignal());
    if (!turma) {
      return [];
    }

    return this.facade
      .materiasPorAno()
      .filter((item) => item.ano === turma.ano)
      .map((item) => ({
        label: this.facade.getMateriaById(item.materiaId)?.nome ?? 'Materia',
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
    const dias = [
      { key: 'segunda', label: 'Segunda' },
      { key: 'terca', label: 'Terca' },
      { key: 'quarta', label: 'Quarta' },
      { key: 'quinta', label: 'Quinta' },
      { key: 'sexta', label: 'Sexta' },
      { key: 'sabado', label: 'Sabado' },
    ] as const;

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
              titulo: materia?.nome ?? 'Materia',
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

    const payload = this.form.getRawValue();
    const periodo = this.selectedTurmaPeriodo();
    if (!periodo) {
      this.facade.errorMessage.set('Turma sem periodo valido.');
      this.messageService.add({
        severity: 'warn',
        summary: 'Validacao',
        detail: 'Selecione uma turma com periodo valido.',
      });
      return;
    }
    if (payload.horaInicio >= payload.horaFim) {
      this.facade.errorMessage.set('Hora de inicio deve ser menor que hora de fim.');
      this.messageService.add({
        severity: 'warn',
        summary: 'Validacao',
        detail: 'Hora de inicio deve ser menor que hora de fim.',
      });
      return;
    }
    if (payload.horaInicio < periodo.horaInicio || payload.horaFim > periodo.horaFim) {
      this.facade.errorMessage.set(
        `Horario deve respeitar o periodo ${periodo.nome} (${periodo.horaInicio}-${periodo.horaFim}).`,
      );
      this.messageService.add({
        severity: 'warn',
        summary: 'Validacao',
        detail: 'Horario fora do periodo da turma.',
      });
      return;
    }

    this.facade.saveHorarioAula(this.editingId(), payload);
    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: this.editingId() ? 'Horario atualizado.' : 'Horario cadastrado.',
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
      diaSemana: this.diaSemanaOptions[0]?.value ?? 'segunda',
      horaInicio: '08:00',
      horaFim: '09:00',
    });
  }

  protected remove(id: string): void {
    this.confirmationService.confirm({
      header: 'Confirmar remocao',
      message: 'Deseja remover este horario?',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.facade.removeHorarioAula(id);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Horario removido.',
        });
      },
    });
  }

  protected setQuickTurmaFilter(turmaId: string): void {
    this.quickTurmaFilterId.set(this.quickTurmaFilterId() === turmaId ? null : turmaId);
  }

  protected describeHorario(horario: HorarioAula): string {
    const turma = this.facade.getTurmaById(horario.turmaId);
    const materiaPorAno = this.facade.getMateriaPorAnoById(horario.materiaPorAnoId);
    if (!turma || !materiaPorAno) {
      return 'Horario incompleto';
    }

    const materia = this.facade.getMateriaById(materiaPorAno.materiaId);
    const principal = this.facade.getProfessorById(materiaPorAno.professorPrincipalId);
    const periodo = this.facade.getPeriodoById(turma.periodoId);
    return `${turma.ano} ${turma.nome} (${periodo?.nome ?? 'Periodo'}) - ${materia?.nome ?? 'Materia'} - ${horario.horaInicio}-${horario.horaFim} - Prof. ${principal?.nome ?? '-'}`;
  }
}
