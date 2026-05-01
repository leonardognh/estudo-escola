import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ConfiguracaoEscola,
  ConfiguracaoEscolaFormValue,
} from '@configuracoes/models/configuracao-escola.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracoesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/configuracoesEscola';

  list(): Observable<ConfiguracaoEscola[]> {
    return this.http.get<ConfiguracaoEscola[]>(this.apiUrl);
  }

  create(payload: ConfiguracaoEscolaFormValue): Observable<ConfiguracaoEscola> {
    return this.http.post<ConfiguracaoEscola>(this.apiUrl, payload);
  }

  update(id: string, payload: ConfiguracaoEscolaFormValue): Observable<ConfiguracaoEscola> {
    return this.http.put<ConfiguracaoEscola>(`${this.apiUrl}/${id}`, payload);
  }
}
