import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Materia,
  MateriaFormValue,
  MateriaPorAno,
  MateriaPorAnoFormValue,
} from '@materias/models/materia.model';

@Injectable({ providedIn: 'root' })
export class MateriasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/materias';
  private readonly materiasPorAnoApiUrl = 'http://localhost:3000/materiasPorAno';

  list(): Observable<Materia[]> {
    return this.http.get<Materia[]>(this.apiUrl);
  }

  create(payload: MateriaFormValue): Observable<Materia> {
    return this.http.post<Materia>(this.apiUrl, payload);
  }

  update(id: string, payload: MateriaFormValue): Observable<Materia> {
    return this.http.put<Materia>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listMateriasPorAno(): Observable<MateriaPorAno[]> {
    return this.http.get<MateriaPorAno[]>(this.materiasPorAnoApiUrl);
  }

  createMateriaPorAno(payload: MateriaPorAnoFormValue): Observable<MateriaPorAno> {
    return this.http.post<MateriaPorAno>(this.materiasPorAnoApiUrl, payload);
  }

  updateMateriaPorAno(id: string, payload: MateriaPorAnoFormValue): Observable<MateriaPorAno> {
    return this.http.put<MateriaPorAno>(`${this.materiasPorAnoApiUrl}/${id}`, payload);
  }

  removeMateriaPorAno(id: string): Observable<void> {
    return this.http.delete<void>(`${this.materiasPorAnoApiUrl}/${id}`);
  }
}
