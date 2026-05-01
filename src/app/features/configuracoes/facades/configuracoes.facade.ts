import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, of, switchMap, take, tap } from 'rxjs';

import { ConfiguracoesService } from '@configuracoes/services/configuracoes.service';
import {
  ConfiguracaoEscola,
  ConfiguracaoEscolaFormValue,
} from '@configuracoes/models/configuracao-escola.model';

@Injectable()
export class ConfiguracoesFacade {
  private readonly configuracoesService = inject(ConfiguracoesService);

  readonly configuracao = signal<ConfiguracaoEscola | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  loadConfiguracao(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.configuracoesService
      .list()
      .pipe(
        take(1),
        tap((items) => this.configuracao.set(items[0] ?? null)),
        catchError(() => {
          this.errorMessage.set('Erro ao carregar configuracoes da escola.');
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveConfiguracao(payload: ConfiguracaoEscolaFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const existing = this.configuracao();

    (existing
      ? this.configuracoesService.update(existing.id, payload)
      : this.configuracoesService.create(payload))
      .pipe(
        take(1),
        switchMap(() => this.configuracoesService.list().pipe(take(1))),
        tap((items) => this.configuracao.set(items[0] ?? null)),
        catchError(() => {
          this.errorMessage.set('Erro ao salvar configuracoes da escola.');
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }
}
