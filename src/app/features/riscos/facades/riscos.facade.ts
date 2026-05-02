import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, map, of, take, tap } from 'rxjs';

import { AlunosService } from '@alunos/services/alunos.service';
import { AtividadesService } from '@atividades/services/atividades.service';
import { HorariosAulasService } from '@calendario/services/horarios-aulas.service';
import { HorarioAula } from '@calendario/models/horario-aula.model';
import { RoleScopeService } from '@auth/services/role-scope.service';
import { MateriasService } from '@materias/services/materias.service';
import { Materia, MateriaPorAno } from '@materias/models/materia.model';
import { NotasService } from '@notas/services/notas.service';
import { Nota } from '@notas/models/nota.model';
import { PresencasService } from '@presencas/services/presencas.service';
import { Presenca, StatusPresenca } from '@presencas/models/presenca.model';
import { TurmasService } from '@turmas/services/turmas.service';
import { Turma } from '@turmas/models/turma.model';
import { RiscoAlunoRow, SemaforoRisco, SemaforoTagSeverity } from '@riscos/models/risco.model';
import { Aluno } from '@alunos/models/aluno.model';
import { Atividade } from '@atividades/models/atividade.model';

@Injectable()
export class RiscosFacade {
  private readonly alunosService = inject(AlunosService);
  private readonly turmasService = inject(TurmasService);
  private readonly materiasService = inject(MateriasService);
  private readonly notasService = inject(NotasService);
  private readonly presencasService = inject(PresencasService);
  private readonly atividadesService = inject(AtividadesService);
  private readonly horariosAulasService = inject(HorariosAulasService);
  private readonly roleScopeService = inject(RoleScopeService);

  readonly rows = signal<RiscoAlunoRow[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly resumo = computed(() => {
    const rows = this.rows();
    const alto = rows.filter((r) => r.semaforo === 'alto').length;
    const medio = rows.filter((r) => r.semaforo === 'medio').length;
    const baixo = rows.filter((r) => r.semaforo === 'baixo').length;
    const scoreMedio = rows.length
      ? Number((rows.reduce((acc, item) => acc + item.scoreRisco, 0) / rows.length).toFixed(1))
      : 0;
    return { alto, medio, baixo, scoreMedio };
  });

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    forkJoin([
      this.alunosService.list().pipe(take(1)),
      this.turmasService.list().pipe(take(1)),
      this.materiasService.list().pipe(take(1)),
      this.materiasService.listMateriasPorAno().pipe(take(1)),
      this.notasService.list().pipe(take(1)),
      this.presencasService.list().pipe(take(1)),
      this.atividadesService.list().pipe(take(1)),
      this.horariosAulasService.list().pipe(take(1)),
    ])
      .pipe(
        map(([alunos, turmas, materias, materiasPorAno, notas, presencas, atividades, horariosAulas]) =>
          this.roleScopeService.applyScope({
            alunos,
            turmas,
            materias,
            materiasPorAno,
            notas,
            presencas,
            atividades,
            horariosAulas,
          }),
        ),
        map((scoped) => this.buildRows(scoped)),
        tap((rows) => this.rows.set(rows)),
        catchError(() => {
          this.errorMessage.set('errors.riscos.calc');
          this.rows.set([]);
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  private buildRows(scoped: {
    alunos?: Aluno[];
    turmas?: Turma[];
    materias?: Materia[];
    materiasPorAno: MateriaPorAno[];
    notas?: Nota[];
    atividades?: Atividade[];
    presencas?: Presenca[];
    horariosAulas?: HorarioAula[];
  }): RiscoAlunoRow[] {
    const alunos = scoped.alunos ?? [];
    const turmas = scoped.turmas ?? [];
    const materias = scoped.materias ?? [];
    const notas = scoped.notas ?? [];
    const atividades = scoped.atividades ?? [];
    const presencas = scoped.presencas ?? [];
    const horariosAulas = scoped.horariosAulas ?? [];
    const materiasPorAno = scoped.materiasPorAno;

    const materiaById = new Map(materias.map((m) => [m.id, m.nome]));
    const turmaById = new Map(turmas.map((t) => [t.id, `${t.ano} ${t.nome}`]));
    const alunoById = new Map(alunos.map((a) => [a.id, a.nome]));
    const materiaPorAnoById = new Map(materiasPorAno.map((m) => [m.id, m]));

    const rows: RiscoAlunoRow[] = [];
    turmas.forEach((turma) => {
      const materiasDaTurma = materiasPorAno.filter((m) => m.ano === turma.ano);
      turma.alunosIds.forEach((alunoId) => {
        if (!alunoById.has(alunoId)) {
          return;
        }
        materiasDaTurma.forEach((mpa) => {
          const alunoNotas = notas.filter(
            (n) => n.alunoId === alunoId && n.turmaId === turma.id && n.materiaId === mpa.materiaId,
          );
          const alunoAtividades = atividades.filter(
            (a) => a.alunoId === alunoId && a.turmaId === turma.id && a.materiaId === mpa.materiaId,
          );
          const horariosMateria = horariosAulas.filter(
            (h) =>
              h.turmaId === turma.id &&
              materiaPorAnoById.get(h.materiaPorAnoId)?.materiaId === mpa.materiaId,
          );
          const horarioIds = new Set(horariosMateria.map((h) => h.id));
          const alunoPresencas = presencas.filter(
            (p) => p.alunoId === alunoId && horarioIds.has(p.horarioAulaId),
          );

          const mediaNotas = this.calcMedia(alunoNotas.map((n) => n.valor));
          const mediaAtividades = this.calcMedia(alunoAtividades.map((a) => a.notaAtividade));
          const mediaBase = mediaNotas > 0 ? mediaNotas : mediaAtividades;
          const frequencia = this.calcFrequencia(alunoPresencas.map((p) => p.status));
          const score = this.calcScore({
            frequencia,
            mediaBase,
            notas: alunoNotas.map((n) => n.valor),
            atividadesCount: alunoAtividades.length,
          });
          const fatoresKeys = this.buildFatoresKeys({
            frequencia,
            mediaBase,
            notas: alunoNotas.map((n) => n.valor),
            atividadesCount: alunoAtividades.length,
          });
          const semaforo = this.toSemaforo(score);
          rows.push({
            id: `${alunoId}|${turma.id}|${mpa.materiaId}`,
            alunoId,
            alunoNome: alunoById.get(alunoId) ?? '-',
            turmaId: turma.id,
            turmaNome: turmaById.get(turma.id) ?? '-',
            materiaId: mpa.materiaId,
            materiaNome: materiaById.get(mpa.materiaId) ?? '-',
            bimestre: alunoNotas.at(-1)?.bimestre ?? alunoAtividades.at(-1)?.bimestre ?? 'sem_ref',
            mediaNotas: Number(mediaBase.toFixed(2)),
            frequencia: Number(frequencia.toFixed(1)),
            scoreRisco: score,
            semaforo,
            semaforoTagSeverity: this.semaforoTagSeverity(semaforo),
            sugestaoKey: this.buildSugestaoKey(semaforo, fatoresKeys),
            fatoresKeys,
          });
        });
      });
    });
    return rows.sort((a, b) => b.scoreRisco - a.scoreRisco);
  }

  private calcMedia(values: number[]): number {
    if (!values.length) {
      return 0;
    }
    return values.reduce((acc, value) => acc + value, 0) / values.length;
  }

  private calcFrequencia(status: StatusPresenca[]): number {
    if (!status.length) {
      return 100;
    }
    const presencasValidas = status.filter((s) => s === 'presente' || s === 'justificado').length;
    return (presencasValidas / status.length) * 100;
  }

  private calcScore(input: {
    frequencia: number;
    mediaBase: number;
    notas: number[];
    atividadesCount: number;
  }): number {
    let score = 0;
    if (input.frequencia < 75) score += 45;
    else if (input.frequencia < 85) score += 25;

    if (input.mediaBase > 0 && input.mediaBase < 6) score += 35;
    else if (input.mediaBase > 0 && input.mediaBase < 7) score += 15;

    if (input.atividadesCount === 0) score += 10;
    if (input.notas.length >= 2 && input.notas.at(-1)! < input.notas[0]) score += 15;

    return Math.min(100, score);
  }

  private toSemaforo(score: number): SemaforoRisco {
    if (score >= 70) return 'alto';
    if (score >= 40) return 'medio';
    return 'baixo';
  }

  private semaforoTagSeverity(value: SemaforoRisco): SemaforoTagSeverity {
    if (value === 'alto') return 'danger';
    if (value === 'medio') return 'warn';
    return 'success';
  }

  private buildFatoresKeys(input: {
    frequencia: number;
    mediaBase: number;
    notas: number[];
    atividadesCount: number;
  }): string[] {
    const fatores: string[] = [];
    if (input.frequencia < 85) fatores.push('riscos.fator.freq');
    if (input.mediaBase > 0 && input.mediaBase < 7) fatores.push('riscos.fator.media');
    if (input.atividadesCount === 0) fatores.push('riscos.fator.semAtividades');
    if (input.notas.length >= 2 && input.notas.at(-1)! < input.notas[0]) fatores.push('riscos.fator.tendencia');
    return fatores;
  }

  private buildSugestaoKey(semaforo: SemaforoRisco, fatoresKeys: readonly string[]): string {
    if (semaforo === 'alto') {
      return 'riscos.sugestao.alto';
    }
    if (semaforo === 'medio') {
      return fatoresKeys.includes('riscos.fator.freq') ? 'riscos.sugestao.medioFreq' : 'riscos.sugestao.medio';
    }
    return 'riscos.sugestao.baixo';
  }
}
