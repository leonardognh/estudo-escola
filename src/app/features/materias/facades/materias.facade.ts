import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of, switchMap, take, tap } from 'rxjs';

import {
  Materia,
  MateriaFormValue,
  MateriaPorAno,
  MateriaPorAnoFormValue,
} from '@materias/models/materia.model';
import { MateriasService } from '@materias/services/materias.service';
import { ProfessoresService } from '@professores/services/professores.service';
import { Professor } from '@professores/models/professor.model';

@Injectable()
export class MateriasFacade {
  private readonly materiasService = inject(MateriasService);
  private readonly professoresService = inject(ProfessoresService);

  readonly materias = signal<Materia[]>([]);
  readonly materiasPorAno = signal<MateriaPorAno[]>([]);
  readonly professores = signal<Professor[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly materiaOptions = computed(() =>
    this.materias().map((materia) => ({
      label: `${materia.nome} (${materia.codigo})`,
      value: materia.id,
    })),
  );
  readonly materiasPorAnoAgrupadas = computed(() => {
    const grouped = new Map<string, MateriaPorAno[]>();
    for (const item of this.materiasPorAno()) {
      const current = grouped.get(item.ano) ?? [];
      current.push(item);
      grouped.set(item.ano, current);
    }
    return Array.from(grouped.entries()).map(([ano, itens]) => ({ ano, itens }));
  });

  loadMaterias(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    forkJoin([
      this.materiasService.list().pipe(take(1)),
      this.materiasService.listMateriasPorAno().pipe(take(1)),
      this.professoresService.list().pipe(take(1)),
    ])
      .pipe(
        tap(([materias, materiasPorAno, professores]) => {
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.professores.set(professores);
        }),
        catchError(() => {
          this.errorMessage.set('errors.materias.load');
          return of([[], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveMateria(id: string | null, payload: MateriaFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    (id ? this.materiasService.update(id, payload) : this.materiasService.create(payload))
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([
            this.materiasService.list().pipe(take(1)),
            this.materiasService.listMateriasPorAno().pipe(take(1)),
            this.professoresService.list().pipe(take(1)),
          ]),
        ),
        tap(([materias, materiasPorAno, professores]) => {
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.professores.set(professores);
        }),
        catchError(() => {
          this.errorMessage.set('errors.materias.save');
          return of([[], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  deleteMateria(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.materiasService
      .remove(id)
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([
            this.materiasService.list().pipe(take(1)),
            this.materiasService.listMateriasPorAno().pipe(take(1)),
            this.professoresService.list().pipe(take(1)),
          ]),
        ),
        tap(([materias, materiasPorAno, professores]) => {
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.professores.set(professores);
        }),
        catchError(() => {
          this.errorMessage.set('errors.materias.remove');
          return of([[], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveMateriaPorAno(id: string | null, payload: MateriaPorAnoFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    (id
      ? this.materiasService.updateMateriaPorAno(id, payload)
      : this.materiasService.createMateriaPorAno(payload))
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([
            this.materiasService.list().pipe(take(1)),
            this.materiasService.listMateriasPorAno().pipe(take(1)),
            this.professoresService.list().pipe(take(1)),
          ]),
        ),
        tap(([materias, materiasPorAno, professores]) => {
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.professores.set(professores);
        }),
        catchError(() => {
          this.errorMessage.set('errors.materias.saveMpa');
          return of([[], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveMateriasPorAnoLote(payloads: MateriaPorAnoFormValue[]): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin(payloads.map((payload) => this.materiasService.createMateriaPorAno(payload).pipe(take(1))))
      .pipe(
        switchMap(() =>
          forkJoin([
            this.materiasService.list().pipe(take(1)),
            this.materiasService.listMateriasPorAno().pipe(take(1)),
            this.professoresService.list().pipe(take(1)),
          ]),
        ),
        tap(([materias, materiasPorAno, professores]) => {
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.professores.set(professores);
        }),
        catchError(() => {
          this.errorMessage.set('errors.materias.saveMpas');
          return of([[], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  deleteMateriaPorAno(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.materiasService
      .removeMateriaPorAno(id)
      .pipe(
        take(1),
        switchMap(() =>
          forkJoin([
            this.materiasService.list().pipe(take(1)),
            this.materiasService.listMateriasPorAno().pipe(take(1)),
            this.professoresService.list().pipe(take(1)),
          ]),
        ),
        tap(([materias, materiasPorAno, professores]) => {
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.professores.set(professores);
        }),
        catchError(() => {
          this.errorMessage.set('errors.materias.removeMpa');
          return of([[], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  replaceMateriasPorAnoByAno(originalAno: string, payloads: MateriaPorAnoFormValue[]): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const idsToRemove = this.materiasPorAno()
      .filter((item) => item.ano === originalAno)
      .map((item) => item.id);
    const removeRequests = idsToRemove.length
      ? forkJoin(idsToRemove.map((id) => this.materiasService.removeMateriaPorAno(id).pipe(take(1))))
      : of([]);
    const createRequests = payloads.length
      ? forkJoin(payloads.map((payload) => this.materiasService.createMateriaPorAno(payload).pipe(take(1))))
      : of([]);

    removeRequests
      .pipe(
        switchMap(() => createRequests),
        switchMap(() =>
          forkJoin([
            this.materiasService.list().pipe(take(1)),
            this.materiasService.listMateriasPorAno().pipe(take(1)),
            this.professoresService.list().pipe(take(1)),
          ]),
        ),
        tap(([materias, materiasPorAno, professores]) => {
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.professores.set(professores);
        }),
        catchError(() => {
          this.errorMessage.set('errors.materias.updateMpas');
          return of([[], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  getMateriaNameById(materiaId: string): string {
    const materia = this.materias().find((item) => item.id === materiaId);
    return materia ? materia.nome : 'Materia nao encontrada';
  }

  getProfessorNameById(professorId: string): string {
    const professor = this.professores().find((item) => item.id === professorId);
    return professor ? professor.nome : 'Professor nao encontrado';
  }

  getProfessoresByMateria(materiaId: string): Professor[] {
    return this.professores().filter(
      (professor) =>
        professor.materiaPrincipalId === materiaId ||
        professor.outrasMateriasIds.includes(materiaId),
    );
  }
}
