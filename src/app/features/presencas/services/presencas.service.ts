import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Presenca, PresencaFormValue } from '@presencas/models/presenca.model';

@Injectable({ providedIn: 'root' })
export class PresencasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/presencas';

  list(): Observable<Presenca[]> {
    return this.http.get<Presenca[]>(this.apiUrl);
  }

  create(payload: PresencaFormValue): Observable<Presenca> {
    return this.http.post<Presenca>(this.apiUrl, payload);
  }

  update(id: string, payload: PresencaFormValue): Observable<Presenca> {
    return this.http.put<Presenca>(`${this.apiUrl}/${id}`, payload);
  }
}
