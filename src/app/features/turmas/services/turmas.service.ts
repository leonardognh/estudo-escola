import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Turma, TurmaFormValue } from '@turmas/models/turma.model';

@Injectable({ providedIn: 'root' })
export class TurmasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/turmas';

  list(): Observable<Turma[]> {
    return this.http.get<Turma[]>(this.apiUrl);
  }

  create(payload: TurmaFormValue): Observable<Turma> {
    return this.http.post<Turma>(this.apiUrl, payload);
  }

  update(id: string, payload: TurmaFormValue): Observable<Turma> {
    return this.http.put<Turma>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
