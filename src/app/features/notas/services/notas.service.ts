import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Nota, NotaFormValue } from '@notas/models/nota.model';

@Injectable({ providedIn: 'root' })
export class NotasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/notas';

  list(): Observable<Nota[]> {
    return this.http.get<Nota[]>(this.apiUrl);
  }

  create(payload: NotaFormValue): Observable<Nota> {
    return this.http.post<Nota>(this.apiUrl, payload);
  }

  update(id: string, payload: NotaFormValue): Observable<Nota> {
    return this.http.put<Nota>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
