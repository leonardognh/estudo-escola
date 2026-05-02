import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Responsavel, ResponsavelFormValue } from '@responsaveis/models/responsavel.model';

@Injectable({ providedIn: 'root' })
export class ResponsaveisService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/responsaveis';

  list(): Observable<Responsavel[]> {
    return this.http.get<Responsavel[]>(this.apiUrl);
  }

  create(payload: ResponsavelFormValue): Observable<Responsavel> {
    return this.http.post<Responsavel>(this.apiUrl, payload);
  }

  update(id: string, payload: ResponsavelFormValue): Observable<Responsavel> {
    return this.http.put<Responsavel>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
