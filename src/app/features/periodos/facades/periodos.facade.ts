import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, of, switchMap, take, tap } from 'rxjs';

import { Periodo, PeriodoFormValue } from '@periodos/models/periodo.model';
import { PeriodosService } from '@periodos/services/periodos.service';

@Injectable()
export class PeriodosFacade {
  private readonly periodosService = inject(PeriodosService);

  readonly periodos = signal<Periodo[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  loadPeriodos(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.periodosService
      .list()
      .pipe(
        take(1),
        tap((periodos) => this.periodos.set(periodos)),
        catchError(() => {
          this.errorMessage.set('Erro ao carregar periodos.');
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  savePeriodo(id: string | null, payload: PeriodoFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    (id ? this.periodosService.update(id, payload) : this.periodosService.create(payload))
      .pipe(
        take(1),
        switchMap(() => this.periodosService.list().pipe(take(1))),
        tap((periodos) => this.periodos.set(periodos)),
        catchError(() => {
          this.errorMessage.set('Erro ao salvar periodo.');
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  deletePeriodo(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.periodosService
      .remove(id)
      .pipe(
        take(1),
        switchMap(() => this.periodosService.list().pipe(take(1))),
        tap((periodos) => this.periodos.set(periodos)),
        catchError(() => {
          this.errorMessage.set('Erro ao remover periodo.');
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }
}
