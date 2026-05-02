import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of, switchMap, take, tap } from 'rxjs';

import { NotasService } from '@notas/services/notas.service';
import { Nota, NotaFormValue } from '@notas/models/nota.model';
import { TurmasService } from '@turmas/services/turmas.service';
import { Turma } from '@turmas/models/turma.model';
import { AlunosService } from '@alunos/services/alunos.service';
import { Aluno } from '@alunos/models/aluno.model';
import { MateriasService } from '@materias/services/materias.service';
import { Materia, MateriaPorAno } from '@materias/models/materia.model';
import { RoleScopeService } from '@auth/services/role-scope.service';

@Injectable()
export class NotasFacade {
  private readonly notasService = inject(NotasService);
  private readonly turmasService = inject(TurmasService);
  private readonly alunosService = inject(AlunosService);
  private readonly materiasService = inject(MateriasService);
  private readonly roleScopeService = inject(RoleScopeService);

  readonly notas = signal<Nota[]>([]);
  readonly turmas = signal<Turma[]>([]);
  readonly alunos = signal<Aluno[]>([]);
  readonly materias = signal<Materia[]>([]);
  readonly materiasPorAno = signal<MateriaPorAno[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly turmaOptions = computed(() =>
    this.turmas().map((turma) => ({
      label: `${turma.ano} ${turma.nome}`,
      value: turma.id,
    })),
  );

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    forkJoin([
      this.notasService.list().pipe(take(1)),
      this.turmasService.list().pipe(take(1)),
      this.alunosService.list().pipe(take(1)),
      this.materiasService.list().pipe(take(1)),
      this.materiasService.listMateriasPorAno().pipe(take(1)),
    ])
      .pipe(
        tap(([notas, turmas, alunos, materias, materiasPorAno]) => {
          const scoped = this.roleScopeService.applyScope({
            notas,
            turmas,
            alunos,
            materias,
            materiasPorAno,
          });
          this.notas.set(scoped.notas ?? []);
          this.turmas.set(scoped.turmas ?? []);
          this.alunos.set(scoped.alunos ?? []);
          this.materias.set(scoped.materias ?? []);
          this.materiasPorAno.set(scoped.materiasPorAno);
        }),
        catchError(() => {
          this.errorMessage.set('errors.notas.load');
          return of([[], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveNota(id: string | null, payload: NotaFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    (id ? this.notasService.update(id, payload) : this.notasService.create(payload))
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([
            this.notasService.list().pipe(take(1)),
            this.turmasService.list().pipe(take(1)),
            this.alunosService.list().pipe(take(1)),
            this.materiasService.list().pipe(take(1)),
            this.materiasService.listMateriasPorAno().pipe(take(1)),
          ]),
        ),
        tap(([notas, turmas, alunos, materias, materiasPorAno]) => {
          const scoped = this.roleScopeService.applyScope({
            notas,
            turmas,
            alunos,
            materias,
            materiasPorAno,
          });
          this.notas.set(scoped.notas ?? []);
          this.turmas.set(scoped.turmas ?? []);
          this.alunos.set(scoped.alunos ?? []);
          this.materias.set(scoped.materias ?? []);
          this.materiasPorAno.set(scoped.materiasPorAno);
        }),
        catchError(() => {
          this.errorMessage.set('errors.notas.save');
          return of([[], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  removeNota(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.notasService
      .remove(id)
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([
            this.notasService.list().pipe(take(1)),
            this.turmasService.list().pipe(take(1)),
            this.alunosService.list().pipe(take(1)),
            this.materiasService.list().pipe(take(1)),
            this.materiasService.listMateriasPorAno().pipe(take(1)),
          ]),
        ),
        tap(([notas, turmas, alunos, materias, materiasPorAno]) => {
          const scoped = this.roleScopeService.applyScope({
            notas,
            turmas,
            alunos,
            materias,
            materiasPorAno,
          });
          this.notas.set(scoped.notas ?? []);
          this.turmas.set(scoped.turmas ?? []);
          this.alunos.set(scoped.alunos ?? []);
          this.materias.set(scoped.materias ?? []);
          this.materiasPorAno.set(scoped.materiasPorAno);
        }),
        catchError(() => {
          this.errorMessage.set('errors.notas.remove');
          return of([[], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  getTurmaById(turmaId: string): Turma | undefined {
    return this.turmas().find((turma) => turma.id === turmaId);
  }

  getAlunoById(alunoId: string): Aluno | undefined {
    return this.alunos().find((aluno) => aluno.id === alunoId);
  }

  getMateriaById(materiaId: string): Materia | undefined {
    return this.materias().find((materia) => materia.id === materiaId);
  }

  getMateriasByTurma(turmaId: string): Materia[] {
    const turma = this.getTurmaById(turmaId);
    if (!turma) {
      return [];
    }
    const materiaIds = new Set(
      this.materiasPorAno()
        .filter((item) => item.ano === turma.ano)
        .map((item) => item.materiaId),
    );
    return this.materias().filter((materia) => materiaIds.has(materia.id));
  }

  getAlunosByTurma(turmaId: string): Aluno[] {
    const turma = this.getTurmaById(turmaId);
    if (!turma) {
      return [];
    }
    return this.alunos().filter((aluno) => turma.alunosIds.includes(aluno.id));
  }
}
