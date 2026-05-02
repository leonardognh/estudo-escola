import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';

export interface ResponsavelCadastro {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  alunosIds: string[];
}

export interface PortalAlunoOption {
  label: string;
  value: string;
}

interface AlunoNomeDto {
  id: string;
  nome: string;
}

/**
 * Dados de portal família (responsável + alunos) sem depender da feature `@responsaveis`.
 */
@Injectable({ providedIn: 'root' })
export class FamilyPortalDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000';

  loadResponsavelComOpcoesAlunos(responsavelId: string): Observable<{
    responsavel: ResponsavelCadastro | null;
    alunosOptions: PortalAlunoOption[];
  }> {
    return forkJoin({
      responsaveis: this.http.get<ResponsavelCadastro[]>(`${this.baseUrl}/responsaveis`),
      alunos: this.http.get<AlunoNomeDto[]>(`${this.baseUrl}/alunos`),
    }).pipe(
      map(({ responsaveis, alunos }) => {
        const resp = responsaveis.find((r) => r.id === responsavelId) ?? null;
        if (!resp?.alunosIds.length) {
          return { responsavel: resp, alunosOptions: [] };
        }
        const nomePorId = new Map(alunos.map((a) => [a.id, a.nome]));
        const opts: PortalAlunoOption[] = resp.alunosIds.map((id) => ({
          label: nomePorId.get(id) ?? id,
          value: id,
        }));
        return { responsavel: resp, alunosOptions: opts };
      }),
    );
  }
}
