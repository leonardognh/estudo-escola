import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Atividade, AtividadeFormValue } from '@atividades/models/atividade.model';

@Injectable({ providedIn: 'root' })
export class AtividadesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/atividades';

  list(): Observable<Atividade[]> {
    return this.http.get<Atividade[]>(this.apiUrl);
  }

  create(payload: AtividadeFormValue): Observable<Atividade> {
    return this.http.post<Atividade>(this.apiUrl, payload);
  }

  update(id: string, payload: AtividadeFormValue): Observable<Atividade> {
    return this.http.put<Atividade>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
