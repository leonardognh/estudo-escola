import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of, switchMap, take, tap } from 'rxjs';

import { IntervencoesService } from '@intervencoes/services/intervencoes.service';
import {
  Intervencao,
  IntervencaoFormValue,
  RecuperacaoAcademica,
  RecuperacaoFormValue,
} from '@intervencoes/models/intervencao.model';
import { TurmasService } from '@turmas/services/turmas.service';
import { Turma } from '@turmas/models/turma.model';
import { AlunosService } from '@alunos/services/alunos.service';
import { Aluno } from '@alunos/models/aluno.model';
import { MateriasService } from '@materias/services/materias.service';
import { Materia, MateriaPorAno } from '@materias/models/materia.model';
import { RoleScopeService } from '@auth/services/role-scope.service';

@Injectable()
export class IntervencoesFacade {
  private readonly intervencoesService = inject(IntervencoesService);
  private readonly turmasService = inject(TurmasService);
  private readonly alunosService = inject(AlunosService);
  private readonly materiasService = inject(MateriasService);
  private readonly roleScopeService = inject(RoleScopeService);

  readonly intervencoes = signal<Intervencao[]>([]);
  readonly recuperacoes = signal<RecuperacaoAcademica[]>([]);
  readonly turmas = signal<Turma[]>([]);
  readonly alunos = signal<Aluno[]>([]);
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
        tap(([intervencoes, recuperacoes, turmas, alunos, materias, materiasPorAno]) => {
          const scoped = this.roleScopeService.applyScope({
            intervencoes,
            recuperacoes,
            turmas,
            alunos,
            materias,
            materiasPorAno,
          });
          this.intervencoes.set(scoped.intervencoes ?? []);
          this.recuperacoes.set(scoped.recuperacoes ?? []);
          this.turmas.set(scoped.turmas ?? []);
          this.alunos.set(scoped.alunos ?? []);
          this.materias.set(scoped.materias ?? []);
          this.materiasPorAno.set(scoped.materiasPorAno);
        }),
        catchError(() => {
          this.errorMessage.set('errors.intervencoes.load');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveIntervencao(id: string | null, payload: IntervencaoFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    (id ? this.intervencoesService.update(id, payload) : this.intervencoesService.create(payload))
      .pipe(
        take(1),
        switchMap(() => this.fetchAll()),
        tap(([intervencoes, recuperacoes, turmas, alunos, materias, materiasPorAno]) => {
          const scoped = this.roleScopeService.applyScope({
            intervencoes,
            recuperacoes,
            turmas,
            alunos,
            materias,
            materiasPorAno,
          });
          this.intervencoes.set(scoped.intervencoes ?? []);
          this.recuperacoes.set(scoped.recuperacoes ?? []);
          this.turmas.set(scoped.turmas ?? []);
          this.alunos.set(scoped.alunos ?? []);
          this.materias.set(scoped.materias ?? []);
          this.materiasPorAno.set(scoped.materiasPorAno);
        }),
        catchError(() => {
          this.errorMessage.set('errors.intervencoes.save');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  removeIntervencao(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.intervencoesService
      .remove(id)
      .pipe(
        take(1),
        switchMap(() => this.fetchAll()),
        tap(([intervencoes, recuperacoes, turmas, alunos, materias, materiasPorAno]) => {
          const scoped = this.roleScopeService.applyScope({
            intervencoes,
            recuperacoes,
            turmas,
            alunos,
            materias,
            materiasPorAno,
          });
          this.intervencoes.set(scoped.intervencoes ?? []);
          this.recuperacoes.set(scoped.recuperacoes ?? []);
          this.turmas.set(scoped.turmas ?? []);
          this.alunos.set(scoped.alunos ?? []);
          this.materias.set(scoped.materias ?? []);
          this.materiasPorAno.set(scoped.materiasPorAno);
        }),
        catchError(() => {
          this.errorMessage.set('errors.intervencoes.remove');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveRecuperacao(id: string | null, payload: RecuperacaoFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    (id
      ? this.intervencoesService.updateRecuperacao(id, payload)
      : this.intervencoesService.createRecuperacao(payload))
      .pipe(
        take(1),
        switchMap(() => this.fetchAll()),
        tap(([intervencoes, recuperacoes, turmas, alunos, materias, materiasPorAno]) => {
          const scoped = this.roleScopeService.applyScope({
            intervencoes,
            recuperacoes,
            turmas,
            alunos,
            materias,
            materiasPorAno,
          });
          this.intervencoes.set(scoped.intervencoes ?? []);
          this.recuperacoes.set(scoped.recuperacoes ?? []);
          this.turmas.set(scoped.turmas ?? []);
          this.alunos.set(scoped.alunos ?? []);
          this.materias.set(scoped.materias ?? []);
          this.materiasPorAno.set(scoped.materiasPorAno);
        }),
        catchError(() => {
          this.errorMessage.set('errors.intervencoes.saveRec');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  removeRecuperacao(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.intervencoesService
      .removeRecuperacao(id)
      .pipe(
        take(1),
        switchMap(() => this.fetchAll()),
        tap(([intervencoes, recuperacoes, turmas, alunos, materias, materiasPorAno]) => {
          const scoped = this.roleScopeService.applyScope({
            intervencoes,
            recuperacoes,
            turmas,
            alunos,
            materias,
            materiasPorAno,
          });
          this.intervencoes.set(scoped.intervencoes ?? []);
          this.recuperacoes.set(scoped.recuperacoes ?? []);
          this.turmas.set(scoped.turmas ?? []);
          this.alunos.set(scoped.alunos ?? []);
          this.materias.set(scoped.materias ?? []);
          this.materiasPorAno.set(scoped.materiasPorAno);
        }),
        catchError(() => {
          this.errorMessage.set('errors.intervencoes.removeRec');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  simularNotaNecessaria(notaAtual: number, notaAlvo: number): number {
    const restante = Number((notaAlvo - notaAtual).toFixed(2));
    return Math.max(0, restante);
  }

  getAlunosByTurma(turmaId: string): Aluno[] {
    const turma = this.turmas().find((item) => item.id === turmaId);
    if (!turma) {
      return [];
    }
    return this.alunos().filter((aluno) => turma.alunosIds.includes(aluno.id));
  }

  getMateriasByTurma(turmaId: string): Materia[] {
    const turma = this.turmas().find((item) => item.id === turmaId);
    if (!turma) {
      return [];
    }
    const ids = new Set(
      this.materiasPorAno()
        .filter((item) => item.ano === turma.ano)
        .map((item) => item.materiaId),
    );
    return this.materias().filter((materia) => ids.has(materia.id));
  }

  getAlunoNomeById(id: string): string {
    return this.alunos().find((item) => item.id === id)?.nome ?? '-';
  }

  getTurmaNomeById(id: string): string {
    const turma = this.turmas().find((item) => item.id === id);
    return turma ? `${turma.ano} ${turma.nome}` : '-';
  }

  getMateriaNomeById(id: string): string {
    return this.materias().find((item) => item.id === id)?.nome ?? '-';
  }

  private fetchAll() {
    return forkJoin([
      this.intervencoesService.list().pipe(take(1)),
      this.intervencoesService.listRecuperacoes().pipe(take(1)),
      this.turmasService.list().pipe(take(1)),
      this.alunosService.list().pipe(take(1)),
      this.materiasService.list().pipe(take(1)),
      this.materiasService.listMateriasPorAno().pipe(take(1)),
    ]);
  }
}
