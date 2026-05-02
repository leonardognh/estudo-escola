import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, of, switchMap, take, tap } from 'rxjs';

import { Aluno, AlunoFormValue } from '@alunos/models/aluno.model';
import { AlunosService } from '@alunos/services/alunos.service';

@Injectable()
export class AlunosFacade {
  private readonly alunosService = inject(AlunosService);

  readonly alunos = signal<Aluno[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  loadAlunos(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.alunosService
      .list()
      .pipe(
        take(1),
        tap((alunos) => this.alunos.set(alunos)),
        catchError(() => {
          this.errorMessage.set('errors.alunos.load');
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveAluno(id: string | null, payload: AlunoFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    (id ? this.alunosService.update(id, payload) : this.alunosService.create(payload))
      .pipe(
        take(1),
        switchMap(() => this.alunosService.list().pipe(take(1))),
        tap((alunos) => this.alunos.set(alunos)),
        catchError(() => {
          this.errorMessage.set('errors.alunos.save');
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  deleteAluno(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.alunosService
      .remove(id)
      .pipe(
        take(1),
        switchMap(() => this.alunosService.list().pipe(take(1))),
        tap((alunos) => this.alunos.set(alunos)),
        catchError(() => {
          this.errorMessage.set('errors.alunos.remove');
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }
}
