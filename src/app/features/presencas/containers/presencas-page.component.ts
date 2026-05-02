import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { PresencasFacade } from '@presencas/facades/presencas.facade';
import { STATUS_PRESENCA_OPTIONS, StatusPresenca } from '@presencas/models/presenca.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-presencas-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TabsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    TableModule,
    TranslocoPipe,
    PageHeaderComponent,
  ],
  providers: [PresencasFacade],
  templateUrl: './presencas-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresencasPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);
  protected readonly facade = inject(PresencasFacade);
  protected readonly draft = signal<Record<string, StatusPresenca>>({});

  private readonly langTick = toSignal(
    this.transloco.langChanges$.pipe(map(() => this.transloco.getActiveLang())),
    { initialValue: this.transloco.getActiveLang() },
  );

  protected readonly statusOptions = computed(() => {
    this.langTick();
    return STATUS_PRESENCA_OPTIONS.map((o) => ({
      value: o.value,
      label: this.transloco.translate(`status.${o.value}`),
    }));
  });

  protected readonly filtroForm = this.formBuilder.nonNullable.group({
    turmaId: ['', [Validators.required]],
    data: [new Date(), [Validators.required]],
  });
  private readonly turmaIdSignal = toSignal(
    this.filtroForm.controls.turmaId.valueChanges.pipe(startWith(this.filtroForm.controls.turmaId.value)),
    { initialValue: this.filtroForm.controls.turmaId.value },
  );
  private readonly dataSignal = toSignal(
    this.filtroForm.controls.data.valueChanges.pipe(startWith(this.filtroForm.controls.data.value)),
    { initialValue: this.filtroForm.controls.data.value },
  );

  protected readonly alunosTurma = computed(() => this.facade.getAlunosByTurma(this.turmaIdSignal()));
  protected readonly horariosDia = computed(() =>
    this.facade.getHorariosByTurmaAndDate(this.turmaIdSignal(), this.dataSignal() ?? new Date()),
  );

  protected readonly lancamentoCards = computed(() => {
    const turmaId = this.turmaIdSignal();
    const date = this.dataSignal();
    const horarios = this.horariosDia();
    const alunos = this.facade.getAlunosByTurma(turmaId);
    if (!turmaId || !date || !horarios.length || !alunos.length) {
      return [];
    }
    const dateStr = this.toDateString(date);
    const draft = this.draft();
    return horarios.map((h) => ({
      horario: h,
      titulo: `${this.facade.getMateriaNameByHorario(h.id)} - ${h.horaInicio}-${h.horaFim}`,
      alunos: alunos.map((a) => ({
        id: a.id,
        nome: a.nome,
        status: (draft[this.key(a.id, h.id, dateStr)] ?? 'presente') as StatusPresenca,
      })),
    }));
  });
  protected readonly calendarWeekStart = signal(this.getMonday(new Date()));
  protected readonly weekDays = computed(() => {
    const start = this.calendarWeekStart();
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return d;
    });
  });
  protected readonly weekLabelText = computed(() => {
    this.langTick();
    const days = this.weekDays();
    if (!days.length) {
      return '';
    }
    const start = days[0];
    const end = days[6];
    const loc = this.localeTag();
    return `${start.toLocaleDateString(loc)} - ${end.toLocaleDateString(loc)}`;
  });

  protected readonly weekDayHeaders = computed(() => {
    this.langTick();
    const loc = this.localeTag();
    return this.weekDays().map((date) => ({
      date,
      label: date.toLocaleDateString(loc, { weekday: 'short', day: '2-digit', month: '2-digit' }),
    }));
  });

  protected readonly calendarRows = computed(() => {
    this.langTick();
    const turmaId = this.turmaIdSignal();
    const alunos = this.facade.getAlunosByTurma(turmaId);
    const rows: {
      alunoNome: string;
      days: { date: Date; resumo: string }[];
    }[] = [];

    for (const aluno of alunos) {
      const days = this.weekDays().map((date) => {
        const dateStr = this.toDateString(date);
        const horarios = this.facade.getHorariosByTurmaAndDate(turmaId, date);
        const statuses = horarios
          .map((horario) => this.facade.getPresenca(aluno.id, horario.id, dateStr)?.status ?? 'pendente')
          .filter(Boolean);
        const presentes = statuses.filter((s) => s === 'presente').length;
        const ausentes = statuses.filter((s) => s === 'ausente').length;
        const justificados = statuses.filter((s) => s === 'justificado').length;
        const resumo = statuses.length
          ? this.transloco.translate('presencas.calendar.summary', {
              p: String(presentes),
              a: String(ausentes),
              j: String(justificados),
            })
          : this.transloco.translate('presencas.calendar.noLesson');
        return { date, resumo };
      });
      rows.push({ alunoNome: aluno.nome, days });
    }
    return rows;
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
    effect(() => {
      const turmaId = this.turmaIdSignal();
      const date = this.dataSignal();
      const horarios = this.horariosDia();
      const alunos = this.facade.getAlunosByTurma(turmaId);
      if (!turmaId || !date || !horarios.length || !alunos.length) {
        this.draft.set({});
        return;
      }
      const dateStr = this.toDateString(date);
      const next: Record<string, StatusPresenca> = {};
      for (const aluno of alunos) {
        for (const horario of horarios) {
          const k = this.key(aluno.id, horario.id, dateStr);
          next[k] = this.facade.getPresenca(aluno.id, horario.id, dateStr)?.status ?? 'presente';
        }
      }
      this.draft.set(next);
    });
  }

  protected setStatus(alunoId: string, horarioId: string, status: StatusPresenca): void {
    const date = this.dataSignal();
    if (!date) {
      return;
    }
    const dateStr = this.toDateString(date);
    const k = this.key(alunoId, horarioId, dateStr);
    this.draft.set({ ...this.draft(), [k]: status });
  }

  protected getStatus(alunoId: string, horarioId: string): StatusPresenca {
    const date = this.dataSignal();
    if (!date) {
      return 'presente';
    }
    const dateStr = this.toDateString(date);
    return this.draft()[this.key(alunoId, horarioId, dateStr)] ?? 'presente';
  }

  protected salvarLote(): void {
    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate('common.validation'),
        detail: this.transloco.translate('presencas.validation.select'),
      });
      return;
    }
    const turmaId = this.turmaIdSignal();
    const date = this.dataSignal();
    if (!date) {
      return;
    }
    const dateStr = this.toDateString(date);
    const alunos = this.facade.getAlunosByTurma(turmaId);
    const horarios = this.horariosDia();
    const payloads = alunos.flatMap((aluno) =>
      horarios.map((horario) => ({
        alunoId: aluno.id,
        horarioAulaId: horario.id,
        data: dateStr,
        status: this.getStatus(aluno.id, horario.id),
      })),
    );
    this.facade.savePresencasLote(payloads);
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate('common.success'),
      detail: this.transloco.translate('presencas.toast.saved'),
    });
  }

  protected previousWeek(): void {
    const d = new Date(this.calendarWeekStart());
    d.setDate(d.getDate() - 7);
    this.calendarWeekStart.set(d);
  }

  protected nextWeek(): void {
    const d = new Date(this.calendarWeekStart());
    d.setDate(d.getDate() + 7);
    this.calendarWeekStart.set(d);
  }

  private localeTag(): string {
    return this.transloco.getActiveLang()?.toLowerCase().startsWith('en') ? 'en-US' : 'pt-BR';
  }

  private key(alunoId: string, horarioId: string, date: string): string {
    return `${alunoId}|${horarioId}|${date}`;
  }

  private toDateString(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
