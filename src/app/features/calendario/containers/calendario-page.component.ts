import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { startWith } from 'rxjs';

import { CalendarioFacade } from '@calendario/facades/calendario.facade';
import { DiaSemana } from '@calendario/models/horario-aula.model';

@Component({
  selector: 'app-calendario-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    SelectModule,
    ButtonModule,
    DatePickerModule,
    TableModule,
  ],
  providers: [CalendarioFacade],
  templateUrl: './calendario-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarioPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly facade = inject(CalendarioFacade);
  protected readonly mode = signal<'day' | 'week'>('day');
  protected readonly selectedDay = signal<Date>(new Date());
  protected readonly selectedWeekRange = signal<Date[]>(this.getCurrentWeekRange());

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    ano: [''],
    turmaId: [''],
    periodo: [''],
    materiaId: [''],
    professorId: [''],
    alunoId: [''],
  });
  private readonly filtersSignal = toSignal(
    this.filtersForm.valueChanges.pipe(startWith(this.filtersForm.getRawValue())),
    { initialValue: this.filtersForm.getRawValue() },
  );

  protected readonly turmasOptions = computed(() =>
    this.facade.turmas().map((turma) => ({
      label: `${turma.ano} ${turma.nome} (${this.facade.getPeriodoById(turma.periodoId)?.nome ?? 'Periodo'})`,
      value: turma.id,
    })),
  );
  protected readonly periodosOptions = computed(() =>
    this.facade.periodos().map((periodo) => ({ label: periodo.nome, value: periodo.id })),
  );
  protected readonly materiasOptions = computed(() =>
    this.facade.materias().map((materia) => ({ label: materia.nome, value: materia.id })),
  );
  protected readonly professoresOptions = computed(() =>
    this.facade.professores().map((professor) => ({ label: professor.nome, value: professor.id })),
  );
  protected readonly alunosOptions = computed(() =>
    this.facade.alunos().map((aluno) => ({ label: aluno.nome, value: aluno.id })),
  );

  protected readonly filteredHorarios = computed(() => {
    const filters = this.filtersSignal();

    return this.facade.horariosAulas().filter((horario) => {
      const turma = this.facade.getTurmaById(horario.turmaId);
      const materiaPorAno = this.facade.getMateriaPorAnoById(horario.materiaPorAnoId);

      if (!turma || !materiaPorAno) {
        return false;
      }

      if (filters.ano && turma.ano !== filters.ano) {
        return false;
      }
      if (filters.turmaId && turma.id !== filters.turmaId) {
        return false;
      }
      if (filters.periodo && turma.periodoId !== filters.periodo) {
        return false;
      }
      if (filters.materiaId && materiaPorAno.materiaId !== filters.materiaId) {
        return false;
      }
      if (filters.professorId) {
        const isMatch =
          materiaPorAno.professorPrincipalId === filters.professorId ||
          materiaPorAno.professorSubstitutoId === filters.professorId;
        if (!isMatch) {
          return false;
        }
      }
      if (filters.alunoId && !turma.alunosIds.includes(filters.alunoId)) {
        return false;
      }

      return true;
    });
  });

  protected readonly activePeriod = computed(() => {
    const filters = this.filtersSignal();
    const turma = filters.turmaId ? this.facade.getTurmaById(filters.turmaId) : undefined;
    const periodoByTurma = turma ? this.facade.getPeriodoById(turma.periodoId) : undefined;
    if (filters.periodo) {
      return this.facade.getPeriodoById(filters.periodo) ?? periodoByTurma ?? null;
    }
    if (periodoByTurma) {
      return periodoByTurma;
    }

    const all = this.facade.periodos();
    if (!all.length) {
      return null;
    }
    const start = [...all].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))[0].horaInicio;
    const end = [...all].sort((a, b) => a.horaFim.localeCompare(b.horaFim)).at(-1)?.horaFim ?? '18:00';
    return { id: 'all', nome: 'Todos', horaInicio: start, horaFim: end };
  });

  protected readonly timeSlots = computed(() => {
    const period = this.activePeriod();
    const start = period?.horaInicio ?? '08:00';
    const end = period?.horaFim ?? '18:00';
    const [startHour] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const lastHour = endMinute > 0 ? endHour : endHour - 1;
    const slots: string[] = [];

    for (let hour = startHour; hour <= lastHour; hour += 1) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  });

  protected readonly selectedWeekDays = computed(() => {
    const [start, end] = this.getNormalizedWeekRange();
    const days: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  });
  protected readonly selectedWeekDaysWithLabel = computed(() =>
    this.selectedWeekDays().map((day) => ({
      date: day,
      label: day.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      }),
    })),
  );
  protected readonly weeklyGridMinWidth = computed(() => `${Math.max(1200, this.selectedWeekDays().length * 220 + 180)}px`);

  protected readonly headerDayLabel = computed(() =>
    this.selectedDay().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  );

  protected readonly headerWeekLabel = computed(() => {
    const [start, end] = this.getNormalizedWeekRange();
    return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
  });

  protected readonly dailyRows = computed(() =>
    this.timeSlots().map((slot) => ({
      slot,
      items: this.getItemsForDayAndSlot(this.selectedDay(), slot),
    })),
  );

  protected readonly weeklyRows = computed(() =>
    this.timeSlots().map((slot) => ({
      slot,
      dayCells: this.selectedWeekDays().map((day) => this.getItemsForDayAndSlot(day, slot)),
    })),
  );

  constructor() {
    this.facade.loadData();
  }

  protected setMode(mode: 'day' | 'week'): void {
    this.mode.set(mode);
  }

  protected onDayChange(value: Date | null): void {
    if (value) {
      this.selectedDay.set(new Date(value));
    }
  }

  protected onWeekRangeChange(value: Date[] | null): void {
    if (!value || !value[0]) {
      return;
    }

    const start = new Date(value[0]);
    start.setHours(0, 0, 0, 0);
    const rawEnd = value[1] ? new Date(value[1]) : new Date(value[0]);
    rawEnd.setHours(0, 0, 0, 0);
    const maxEnd = new Date(start);
    maxEnd.setDate(start.getDate() + 6);
    const end = rawEnd > maxEnd ? maxEnd : rawEnd;

    this.selectedWeekRange.set([start, end]);
  }

  private getItemsForDayAndSlot(day: Date, slot: string) {
    const dayIndex = this.dayIndexFromDate(day);
    const slotMinutes = this.toMinutes(slot);
    const filtered = this.filteredHorarios();

    return filtered
      .filter((horario) => this.dayOffset(horario.diaSemana) === dayIndex)
      .filter((horario) => {
        const start = this.toMinutes(horario.horaInicio);
        const end = this.toMinutes(horario.horaFim);
        return slotMinutes >= start && slotMinutes < end;
      })
      .map((horario) => {
        const turma = this.facade.getTurmaById(horario.turmaId);
        const materiaPorAno = this.facade.getMateriaPorAnoById(horario.materiaPorAnoId);
        const materia = materiaPorAno ? this.facade.getMateriaById(materiaPorAno.materiaId) : undefined;
        return {
          id: horario.id,
          title: materia?.nome ?? 'Materia',
          subtitle: turma ? `${turma.ano} ${turma.nome}` : '',
          time: `${horario.horaInicio}-${horario.horaFim}`,
        };
      });
  }

  private getNormalizedWeekRange(): [Date, Date] {
    const range = this.selectedWeekRange();
    const start = new Date(range[0] ?? new Date());
    const end = new Date(range[1] ?? range[0] ?? new Date());
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return [start, end];
  }

  private getCurrentWeekRange(): Date[] {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return [monday, sunday];
  }

  private dayIndexFromDate(date: Date): number {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private dayOffset(diaSemana: DiaSemana): number {
    const offsets: Record<DiaSemana, number> = {
      segunda: 0,
      terca: 1,
      quarta: 2,
      quinta: 3,
      sexta: 4,
      sabado: 5,
      domingo: 6,
    };
    return offsets[diaSemana];
  }
}
