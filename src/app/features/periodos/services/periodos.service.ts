import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Periodo, PeriodoFormValue } from '@periodos/models/periodo.model';

@Injectable({ providedIn: 'root' })
export class PeriodosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/periodos';

  list(): Observable<Periodo[]> {
    return this.http.get<Periodo[]>(this.apiUrl);
  }

  create(payload: PeriodoFormValue): Observable<Periodo> {
    return this.http.post<Periodo>(this.apiUrl, payload);
  }

  update(id: string, payload: PeriodoFormValue): Observable<Periodo> {
    return this.http.put<Periodo>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
