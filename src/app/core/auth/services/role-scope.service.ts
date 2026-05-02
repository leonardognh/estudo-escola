import { inject, Injectable } from '@angular/core';

import { AuthService } from '@auth/services/auth.service';

interface MateriaPorAnoLike {
  id: string;
  ano: string;
  materiaId: string;
  professorPrincipalId: string;
  professorSubstitutoId?: string | null;
}

interface TurmaLike {
  id: string;
  ano: string;
  alunosIds: string[];
}

interface MateriaLike {
  id: string;
}

interface AlunoLike {
  id: string;
}

interface HorarioLike {
  id: string;
  turmaId: string;
  materiaPorAnoId: string;
}

interface NotaLike {
  turmaId: string;
  materiaId: string;
}

interface AtividadeLike {
  turmaId: string;
  materiaId: string;
}

interface IntervencaoLike {
  turmaId: string;
  materiaId: string;
}

interface RecuperacaoLike {
  turmaId: string;
  materiaId: string;
}

interface PresencaLike {
  horarioAulaId: string;
}

interface ProfessorLike {
  id: string;
}

@Injectable({ providedIn: 'root' })
export class RoleScopeService {
  private readonly authService = inject(AuthService);

  applyScope<TMateriaPorAno extends MateriaPorAnoLike, TTurma extends TurmaLike, TMateria extends MateriaLike, TAluno extends AlunoLike, THorario extends HorarioLike, TNota extends NotaLike, TAtividade extends AtividadeLike, TIntervencao extends IntervencaoLike, TRecuperacao extends RecuperacaoLike, TPresenca extends PresencaLike, TProfessor extends ProfessorLike>(
    data: {
      materiasPorAno: TMateriaPorAno[];
      turmas?: TTurma[];
      materias?: TMateria[];
      alunos?: TAluno[];
      horariosAulas?: THorario[];
      notas?: TNota[];
      atividades?: TAtividade[];
      intervencoes?: TIntervencao[];
      recuperacoes?: TRecuperacao[];
      presencas?: TPresenca[];
      professores?: TProfessor[];
    },
  ): {
    materiasPorAno: TMateriaPorAno[];
    turmas?: TTurma[];
    materias?: TMateria[];
    alunos?: TAluno[];
    horariosAulas?: THorario[];
    notas?: TNota[];
    atividades?: TAtividade[];
    intervencoes?: TIntervencao[];
    recuperacoes?: TRecuperacao[];
    presencas?: TPresenca[];
    professores?: TProfessor[];
  } {
    const user = this.authService.currentUser();
    if (!user || user.role === 'admin') {
      return data;
    }

    const professorId = user.professorId ?? null;
    if (!professorId) {
      return {
        materiasPorAno: [],
        turmas: data.turmas ? [] : undefined,
        materias: data.materias ? [] : undefined,
        alunos: data.alunos ? [] : undefined,
        horariosAulas: data.horariosAulas ? [] : undefined,
        notas: data.notas ? [] : undefined,
        atividades: data.atividades ? [] : undefined,
        intervencoes: data.intervencoes ? [] : undefined,
        recuperacoes: data.recuperacoes ? [] : undefined,
        presencas: data.presencas ? [] : undefined,
        professores: data.professores ? [] : undefined,
      };
    }

    const materiasPorAno = data.materiasPorAno.filter(
      (item) =>
        item.professorPrincipalId === professorId || item.professorSubstitutoId === professorId,
    );

    const allowedMateriaPorAnoIds = new Set(materiasPorAno.map((item) => item.id));
    const allowedMateriaIds = new Set(materiasPorAno.map((item) => item.materiaId));
    const allowedAnos = new Set(materiasPorAno.map((item) => item.ano));
    const allowedProfessorIds = new Set<string>([professorId]);
    materiasPorAno.forEach((item) => {
      allowedProfessorIds.add(item.professorPrincipalId);
      if (item.professorSubstitutoId) {
        allowedProfessorIds.add(item.professorSubstitutoId);
      }
    });

    const turmas = data.turmas?.filter((item) => allowedAnos.has(item.ano));
    const allowedTurmaIds = new Set((turmas ?? []).map((item) => item.id));

    const materias = data.materias?.filter((item) => allowedMateriaIds.has(item.id));
    const alunosIds = new Set((turmas ?? []).flatMap((item) => item.alunosIds));
    const alunos = data.alunos?.filter((item) => alunosIds.has(item.id));

    const horariosAulas = data.horariosAulas?.filter(
      (item) =>
        allowedTurmaIds.has(item.turmaId) &&
        allowedMateriaPorAnoIds.has(item.materiaPorAnoId),
    );

    const allowedHorarioIds = new Set((horariosAulas ?? []).map((item) => item.id));

    const notas = data.notas?.filter(
      (item) => allowedTurmaIds.has(item.turmaId) && allowedMateriaIds.has(item.materiaId),
    );

    const atividades = data.atividades?.filter(
      (item) => allowedTurmaIds.has(item.turmaId) && allowedMateriaIds.has(item.materiaId),
    );

    const intervencoes = data.intervencoes?.filter(
      (item) => allowedTurmaIds.has(item.turmaId) && allowedMateriaIds.has(item.materiaId),
    );

    const recuperacoes = data.recuperacoes?.filter(
      (item) => allowedTurmaIds.has(item.turmaId) && allowedMateriaIds.has(item.materiaId),
    );

    const presencas = data.presencas?.filter((item) =>
      allowedHorarioIds.has(item.horarioAulaId),
    );

    const professores = data.professores?.filter((item) => allowedProfessorIds.has(item.id));

    return {
      materiasPorAno,
      turmas,
      materias,
      alunos,
      horariosAulas,
      notas,
      atividades,
      intervencoes,
      recuperacoes,
      presencas,
      professores,
    };
  }
}
