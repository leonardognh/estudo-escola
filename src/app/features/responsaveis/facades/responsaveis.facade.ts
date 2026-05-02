import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, finalize, forkJoin, switchMap, take, tap } from 'rxjs';

import { Aluno } from '@alunos/models/aluno.model';
import { AlunosService } from '@alunos/services/alunos.service';
import { Responsavel, ResponsavelFormValue } from '@responsaveis/models/responsavel.model';
import { ResponsaveisService } from '@responsaveis/services/responsaveis.service';

@Injectable()
export class ResponsaveisFacade {
  private readonly responsaveisService = inject(ResponsaveisService);
  private readonly alunosService = inject(AlunosService);

  readonly responsaveis = signal<Responsavel[]>([]);
  readonly alunos = signal<Aluno[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly alunosOptions = computed(() =>
    this.alunos().map((a) => ({ label: a.nome, value: a.id })),
  );

  readonly responsaveisRows = computed(() => {
    const alunoById = new Map(this.alunos().map((a) => [a.id, a.nome]));
    return this.responsaveis().map((r) => ({
      ...r,
      alunosResumo: r.alunosIds.map((id) => alunoById.get(id) ?? id).join(', ') || '—',
    }));
  });

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    forkJoin([
      this.responsaveisService.list().pipe(take(1)),
      this.alunosService.list().pipe(take(1)),
    ])
      .pipe(
        tap(([responsaveis, alunos]) => {
          this.responsaveis.set(responsaveis);
          this.alunos.set(alunos);
        }),
        catchError(() => {
          this.errorMessage.set('errors.responsaveis.load');
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveResponsavel(id: string | null, payload: ResponsavelFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    (id ? this.responsaveisService.update(id, payload) : this.responsaveisService.create(payload))
      .pipe(
        take(1),
        catchError(() => {
          this.errorMessage.set('errors.responsaveis.save');
          return EMPTY;
        }),
        switchMap(() =>
          forkJoin([
            this.responsaveisService.list().pipe(take(1)),
            this.alunosService.list().pipe(take(1)),
          ]),
        ),
        tap(([responsaveis, alunos]) => {
          this.responsaveis.set(responsaveis);
          this.alunos.set(alunos);
        }),
        catchError(() => {
          this.errorMessage.set('errors.responsaveis.reload');
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  deleteResponsavel(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.responsaveisService
      .remove(id)
      .pipe(
        take(1),
        catchError(() => {
          this.errorMessage.set('errors.responsaveis.remove');
          return EMPTY;
        }),
        switchMap(() =>
          forkJoin([
            this.responsaveisService.list().pipe(take(1)),
            this.alunosService.list().pipe(take(1)),
          ]),
        ),
        tap(([responsaveis, alunos]) => {
          this.responsaveis.set(responsaveis);
          this.alunos.set(alunos);
        }),
        catchError(() => {
          this.errorMessage.set('errors.responsaveis.reload');
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }
}
