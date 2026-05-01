import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of, switchMap, take, tap } from 'rxjs';

import { Professor, ProfessorFormValue } from '@professores/models/professor.model';
import { ProfessoresService } from '@professores/services/professores.service';
import { MateriasService } from '@materias/services/materias.service';

@Injectable()
export class ProfessoresFacade {
  private readonly professoresService = inject(ProfessoresService);
  private readonly materiasService = inject(MateriasService);

  readonly professores = signal<Professor[]>([]);
  readonly materias = signal<{ id: string; nome: string; codigo: string }[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly materiaOptions = computed(() =>
    this.materias().map((materia) => ({
      label: `${materia.nome} (${materia.codigo})`,
      value: materia.id,
    })),
  );

  loadProfessores(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    forkJoin([this.professoresService.list().pipe(take(1)), this.materiasService.list().pipe(take(1))])
      .pipe(
        tap(([professores, materias]) => {
          this.professores.set(professores);
          this.materias.set(materias);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao carregar professores.');
          return of([[], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveProfessor(id: string | null, payload: ProfessorFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    (id ? this.professoresService.update(id, payload) : this.professoresService.create(payload))
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([this.professoresService.list().pipe(take(1)), this.materiasService.list().pipe(take(1))]),
        ),
        tap(([professores, materias]) => {
          this.professores.set(professores);
          this.materias.set(materias);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao salvar professor.');
          return of([[], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  deleteProfessor(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.professoresService
      .remove(id)
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([this.professoresService.list().pipe(take(1)), this.materiasService.list().pipe(take(1))]),
        ),
        tap(([professores, materias]) => {
          this.professores.set(professores);
          this.materias.set(materias);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao remover professor.');
          return of([[], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  getMateriaNomeById(id: string): string {
    return this.materias().find((materia) => materia.id === id)?.nome ?? 'Materia nao encontrada';
  }
}
