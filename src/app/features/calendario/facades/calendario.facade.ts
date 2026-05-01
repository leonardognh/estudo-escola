import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of, switchMap, take, tap } from 'rxjs';

import { TurmasService } from '@turmas/services/turmas.service';
import { Turma } from '@turmas/models/turma.model';
import { MateriasService } from '@materias/services/materias.service';
import { Materia, MateriaPorAno } from '@materias/models/materia.model';
import { ProfessoresService } from '@professores/services/professores.service';
import { Professor } from '@professores/models/professor.model';
import { AlunosService } from '@alunos/services/alunos.service';
import { Aluno } from '@alunos/models/aluno.model';
import { HorarioAula, HorarioAulaFormValue } from '@calendario/models/horario-aula.model';
import { HorariosAulasService } from '@calendario/services/horarios-aulas.service';
import { PeriodosService } from '@periodos/services/periodos.service';
import { Periodo } from '@periodos/models/periodo.model';

@Injectable()
export class CalendarioFacade {
  private readonly turmasService = inject(TurmasService);
  private readonly materiasService = inject(MateriasService);
  private readonly professoresService = inject(ProfessoresService);
  private readonly alunosService = inject(AlunosService);
  private readonly horariosAulasService = inject(HorariosAulasService);
  private readonly periodosService = inject(PeriodosService);

  readonly turmas = signal<Turma[]>([]);
  readonly materias = signal<Materia[]>([]);
  readonly materiasPorAno = signal<MateriaPorAno[]>([]);
  readonly professores = signal<Professor[]>([]);
  readonly alunos = signal<Aluno[]>([]);
  readonly horariosAulas = signal<HorarioAula[]>([]);
  readonly periodos = signal<Periodo[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly anosOptions = computed(() => {
    const years = Array.from(new Set(this.turmas().map((turma) => turma.ano)));
    return years.map((ano) => ({ label: ano, value: ano }));
  });

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin([
      this.turmasService.list().pipe(take(1)),
      this.materiasService.list().pipe(take(1)),
      this.materiasService.listMateriasPorAno().pipe(take(1)),
      this.professoresService.list().pipe(take(1)),
      this.alunosService.list().pipe(take(1)),
      this.horariosAulasService.list().pipe(take(1)),
      this.periodosService.list().pipe(take(1)),
    ])
      .pipe(
        tap(([turmas, materias, materiasPorAno, professores, alunos, horariosAulas, periodos]) => {
          this.turmas.set(turmas);
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.professores.set(professores);
          this.alunos.set(alunos);
          this.horariosAulas.set(horariosAulas);
          this.periodos.set(periodos);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao carregar dados do calendario.');
          return of([[], [], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveHorarioAula(id: string | null, payload: HorarioAulaFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    (id ? this.horariosAulasService.update(id, payload) : this.horariosAulasService.create(payload))
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([
            this.turmasService.list().pipe(take(1)),
            this.materiasService.list().pipe(take(1)),
            this.materiasService.listMateriasPorAno().pipe(take(1)),
            this.professoresService.list().pipe(take(1)),
            this.alunosService.list().pipe(take(1)),
            this.horariosAulasService.list().pipe(take(1)),
            this.periodosService.list().pipe(take(1)),
          ]),
        ),
        tap(([turmas, materias, materiasPorAno, professores, alunos, horariosAulas, periodos]) => {
          this.turmas.set(turmas);
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.professores.set(professores);
          this.alunos.set(alunos);
          this.horariosAulas.set(horariosAulas);
          this.periodos.set(periodos);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao salvar horario de aula.');
          return of([[], [], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  removeHorarioAula(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.horariosAulasService
      .remove(id)
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([
            this.turmasService.list().pipe(take(1)),
            this.materiasService.list().pipe(take(1)),
            this.materiasService.listMateriasPorAno().pipe(take(1)),
            this.professoresService.list().pipe(take(1)),
            this.alunosService.list().pipe(take(1)),
            this.horariosAulasService.list().pipe(take(1)),
            this.periodosService.list().pipe(take(1)),
          ]),
        ),
        tap(([turmas, materias, materiasPorAno, professores, alunos, horariosAulas, periodos]) => {
          this.turmas.set(turmas);
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.professores.set(professores);
          this.alunos.set(alunos);
          this.horariosAulas.set(horariosAulas);
          this.periodos.set(periodos);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao remover horario de aula.');
          return of([[], [], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  getTurmaById(turmaId: string): Turma | undefined {
    return this.turmas().find((turma) => turma.id === turmaId);
  }

  getMateriaPorAnoById(materiaPorAnoId: string): MateriaPorAno | undefined {
    return this.materiasPorAno().find((item) => item.id === materiaPorAnoId);
  }

  getMateriaById(materiaId: string): Materia | undefined {
    return this.materias().find((materia) => materia.id === materiaId);
  }

  getProfessorById(professorId?: string | null): Professor | undefined {
    if (!professorId) {
      return undefined;
    }
    return this.professores().find((professor) => professor.id === professorId);
  }

  getAlunoById(alunoId: string): Aluno | undefined {
    return this.alunos().find((aluno) => aluno.id === alunoId);
  }

  getPeriodoById(periodoId: string): Periodo | undefined {
    return this.periodos().find((periodo) => periodo.id === periodoId);
  }
}
