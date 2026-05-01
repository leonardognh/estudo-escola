import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of, switchMap, take, tap } from 'rxjs';

import { Aluno } from '@alunos/models/aluno.model';
import { AlunosService } from '@alunos/services/alunos.service';
import { Turma, TurmaFormValue } from '@turmas/models/turma.model';
import { TurmasService } from '@turmas/services/turmas.service';
import { PeriodosService } from '@periodos/services/periodos.service';
import { Periodo } from '@periodos/models/periodo.model';

@Injectable()
export class TurmasFacade {
  private readonly turmasService = inject(TurmasService);
  private readonly alunosService = inject(AlunosService);
  private readonly periodosService = inject(PeriodosService);

  readonly turmas = signal<Turma[]>([]);
  readonly alunos = signal<Aluno[]>([]);
  readonly periodos = signal<Periodo[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly alunosOptions = computed(() =>
    this.alunos().map((aluno) => ({
      label: `${aluno.nome} (${aluno.email})`,
      value: aluno.id,
    })),
  );
  readonly periodosOptions = computed(() =>
    this.periodos().map((periodo) => ({
      label: `${periodo.nome} (${periodo.horaInicio}-${periodo.horaFim})`,
      value: periodo.id,
    })),
  );

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    forkJoin([
      this.turmasService.list().pipe(take(1)),
      this.alunosService.list().pipe(take(1)),
      this.periodosService.list().pipe(take(1)),
    ])
      .pipe(
        tap(([turmas, alunos, periodos]) => {
          this.turmas.set(turmas);
          this.alunos.set(alunos);
          this.periodos.set(periodos);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao carregar turmas.');
          return of([[], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveTurma(id: string | null, payload: TurmaFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    (id ? this.turmasService.update(id, payload) : this.turmasService.create(payload))
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([
            this.turmasService.list().pipe(take(1)),
            this.alunosService.list().pipe(take(1)),
            this.periodosService.list().pipe(take(1)),
          ]),
        ),
        tap(([turmas, alunos, periodos]) => {
          this.turmas.set(turmas);
          this.alunos.set(alunos);
          this.periodos.set(periodos);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao salvar turma.');
          return of([[], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  deleteTurma(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.turmasService
      .remove(id)
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([
            this.turmasService.list().pipe(take(1)),
            this.alunosService.list().pipe(take(1)),
            this.periodosService.list().pipe(take(1)),
          ]),
        ),
        tap(([turmas, alunos, periodos]) => {
          this.turmas.set(turmas);
          this.alunos.set(alunos);
          this.periodos.set(periodos);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao remover turma.');
          return of([[], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  getAlunosNamesByIds(ids: string[]): string {
    const alunosMap = new Map(this.alunos().map((aluno) => [aluno.id, aluno.nome]));
    return ids.map((id) => alunosMap.get(id)).filter(Boolean).join(', ');
  }

  getPeriodoLabelById(periodoId: string): string {
    const periodo = this.periodos().find((item) => item.id === periodoId);
    return periodo ? `${periodo.nome} (${periodo.horaInicio}-${periodo.horaFim})` : 'Periodo nao definido';
  }
}
