import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of, switchMap, take, tap } from 'rxjs';

import { PresencasService } from '@presencas/services/presencas.service';
import { Presenca, PresencaFormValue } from '@presencas/models/presenca.model';
import { TurmasService } from '@turmas/services/turmas.service';
import { Turma } from '@turmas/models/turma.model';
import { AlunosService } from '@alunos/services/alunos.service';
import { Aluno } from '@alunos/models/aluno.model';
import { HorariosAulasService } from '@calendario/services/horarios-aulas.service';
import { HorarioAula } from '@calendario/models/horario-aula.model';
import { MateriasService } from '@materias/services/materias.service';
import { Materia, MateriaPorAno } from '@materias/models/materia.model';

@Injectable()
export class PresencasFacade {
  private readonly presencasService = inject(PresencasService);
  private readonly turmasService = inject(TurmasService);
  private readonly alunosService = inject(AlunosService);
  private readonly horariosAulasService = inject(HorariosAulasService);
  private readonly materiasService = inject(MateriasService);

  readonly presencas = signal<Presenca[]>([]);
  readonly turmas = signal<Turma[]>([]);
  readonly alunos = signal<Aluno[]>([]);
  readonly horariosAulas = signal<HorarioAula[]>([]);
  readonly materias = signal<Materia[]>([]);
  readonly materiasPorAno = signal<MateriaPorAno[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly turmaOptions = computed(() =>
    this.turmas().map((turma) => ({ label: `${turma.ano} ${turma.nome}`, value: turma.id })),
  );

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.fetchAll()
      .pipe(
        tap(([presencas, turmas, alunos, horariosAulas, materias, materiasPorAno]) => {
          this.presencas.set(presencas);
          this.turmas.set(turmas);
          this.alunos.set(alunos);
          this.horariosAulas.set(horariosAulas);
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao carregar dados de presenca.');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  savePresencasLote(payloads: PresencaFormValue[]): void {
    const current = this.presencas();
    const requests = payloads.map((payload) => {
      const existing = current.find(
        (item) =>
          item.alunoId === payload.alunoId &&
          item.horarioAulaId === payload.horarioAulaId &&
          item.data === payload.data,
      );
      return existing
        ? this.presencasService.update(existing.id, payload).pipe(take(1))
        : this.presencasService.create(payload).pipe(take(1));
    });

    this.loading.set(true);
    this.errorMessage.set(null);
    (requests.length ? forkJoin(requests) : of([]))
      .pipe(
        switchMap(() => this.fetchAll()),
        tap(([presencas, turmas, alunos, horariosAulas, materias, materiasPorAno]) => {
          this.presencas.set(presencas);
          this.turmas.set(turmas);
          this.alunos.set(alunos);
          this.horariosAulas.set(horariosAulas);
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao salvar presencas.');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  getAlunosByTurma(turmaId: string): Aluno[] {
    const turma = this.turmas().find((item) => item.id === turmaId);
    if (!turma) {
      return [];
    }
    return this.alunos().filter((aluno) => turma.alunosIds.includes(aluno.id));
  }

  getHorariosByTurmaAndDate(turmaId: string, date: Date): HorarioAula[] {
    const day = this.diaSemanaByDate(date);
    return this.horariosAulas()
      .filter((item) => item.turmaId === turmaId && item.diaSemana === day)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  getMateriaNameByHorario(horarioAulaId: string): string {
    const horario = this.horariosAulas().find((item) => item.id === horarioAulaId);
    if (!horario) {
      return '-';
    }
    const materiaPorAno = this.materiasPorAno().find((item) => item.id === horario.materiaPorAnoId);
    if (!materiaPorAno) {
      return '-';
    }
    return this.materias().find((item) => item.id === materiaPorAno.materiaId)?.nome ?? '-';
  }

  getPresenca(alunoId: string, horarioAulaId: string, data: string): Presenca | undefined {
    return this.presencas().find(
      (item) => item.alunoId === alunoId && item.horarioAulaId === horarioAulaId && item.data === data,
    );
  }

  private diaSemanaByDate(date: Date): HorarioAula['diaSemana'] {
    const day = date.getDay();
    const map: Record<number, HorarioAula['diaSemana']> = {
      0: 'domingo',
      1: 'segunda',
      2: 'terca',
      3: 'quarta',
      4: 'quinta',
      5: 'sexta',
      6: 'sabado',
    };
    return map[day];
  }

  private fetchAll() {
    return forkJoin([
      this.presencasService.list().pipe(take(1)),
      this.turmasService.list().pipe(take(1)),
      this.alunosService.list().pipe(take(1)),
      this.horariosAulasService.list().pipe(take(1)),
      this.materiasService.list().pipe(take(1)),
      this.materiasService.listMateriasPorAno().pipe(take(1)),
    ]);
  }
}
