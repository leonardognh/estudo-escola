import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Aluno, AlunoFormValue } from '@alunos/models/aluno.model';

@Injectable({ providedIn: 'root' })
export class AlunosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/alunos';

  list(): Observable<Aluno[]> {
    return this.http.get<Aluno[]>(this.apiUrl);
  }

  create(payload: AlunoFormValue): Observable<Aluno> {
    return this.http.post<Aluno>(this.apiUrl, payload);
  }

  update(id: string, payload: AlunoFormValue): Observable<Aluno> {
    return this.http.put<Aluno>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
