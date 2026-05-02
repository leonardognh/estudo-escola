import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Intervencao,
  IntervencaoFormValue,
  RecuperacaoAcademica,
  RecuperacaoFormValue,
} from '@intervencoes/models/intervencao.model';

@Injectable({ providedIn: 'root' })
export class IntervencoesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/intervencoes';
  private readonly recuperacoesApiUrl = 'http://localhost:3000/recuperacoesAcademicas';

  list(): Observable<Intervencao[]> {
    return this.http.get<Intervencao[]>(this.apiUrl);
  }

  create(payload: IntervencaoFormValue): Observable<Intervencao> {
    return this.http.post<Intervencao>(this.apiUrl, payload);
  }

  update(id: string, payload: IntervencaoFormValue): Observable<Intervencao> {
    return this.http.put<Intervencao>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listRecuperacoes(): Observable<RecuperacaoAcademica[]> {
    return this.http.get<RecuperacaoAcademica[]>(this.recuperacoesApiUrl);
  }

  createRecuperacao(payload: RecuperacaoFormValue): Observable<RecuperacaoAcademica> {
    return this.http.post<RecuperacaoAcademica>(this.recuperacoesApiUrl, payload);
  }

  updateRecuperacao(id: string, payload: RecuperacaoFormValue): Observable<RecuperacaoAcademica> {
    return this.http.put<RecuperacaoAcademica>(`${this.recuperacoesApiUrl}/${id}`, payload);
  }

  removeRecuperacao(id: string): Observable<void> {
    return this.http.delete<void>(`${this.recuperacoesApiUrl}/${id}`);
  }
}
