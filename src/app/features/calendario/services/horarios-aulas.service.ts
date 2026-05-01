import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { HorarioAula, HorarioAulaFormValue } from '@calendario/models/horario-aula.model';

@Injectable({ providedIn: 'root' })
export class HorariosAulasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/horariosAulas';

  list(): Observable<HorarioAula[]> {
    return this.http.get<HorarioAula[]>(this.apiUrl);
  }

  create(payload: HorarioAulaFormValue): Observable<HorarioAula> {
    return this.http.post<HorarioAula>(this.apiUrl, payload);
  }

  update(id: string, payload: HorarioAulaFormValue): Observable<HorarioAula> {
    return this.http.put<HorarioAula>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
