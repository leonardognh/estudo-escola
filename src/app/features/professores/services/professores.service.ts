import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Professor, ProfessorFormValue } from '@professores/models/professor.model';

@Injectable({ providedIn: 'root' })
export class ProfessoresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/professores';

  list(): Observable<Professor[]> {
    return this.http.get<Professor[]>(this.apiUrl);
  }

  create(payload: ProfessorFormValue): Observable<Professor> {
    return this.http.post<Professor>(this.apiUrl, payload);
  }

  update(id: string, payload: ProfessorFormValue): Observable<Professor> {
    return this.http.put<Professor>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
