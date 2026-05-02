import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, map, of, take, tap } from 'rxjs';

import { AlunosService } from '@alunos/services/alunos.service';
import { HorariosAulasService } from '@calendario/services/horarios-aulas.service';
import { IntervencoesService } from '@intervencoes/services/intervencoes.service';
import { NotasService } from '@notas/services/notas.service';
import { PresencasService } from '@presencas/services/presencas.service';
import { TurmasService } from '@turmas/services/turmas.service';
import { BIMESTRE_OPTIONS, Nota } from '@notas/models/nota.model';
import { Presenca } from '@presencas/models/presenca.model';
import { Turma } from '@turmas/models/turma.model';
import { HorarioAula } from '@calendario/models/horario-aula.model';
import { Intervencao } from '@intervencoes/models/intervencao.model';

interface TurmaIndicadorRow {
  turmaId: string;
  turmaNome: string;
  alunos: number;
  mediaNotas: number;
  frequencia: number;
  aprovacao: number;
  intervencoesAbertas: number;
}

interface AnoIndicadorRow {
  ano: string;
  turmas: number;
  alunos: number;
  mediaNotas: number;
  frequencia: number;
  aprovacao: number;
}

interface BimestreTrendRow {
  bimestre: string;
  mediaNotas: number;
  totalLancamentos: number;
}

interface MesFrequenciaRow {
  mes: string;
  frequencia: number;
}

@Injectable()
export class PainelExecutivoFacade {
  private readonly alunosService = inject(AlunosService);
  private readonly turmasService = inject(TurmasService);
  private readonly notasService = inject(NotasService);
  private readonly presencasService = inject(PresencasService);
  private readonly horariosAulasService = inject(HorariosAulasService);
  private readonly intervencoesService = inject(IntervencoesService);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly totalAlunos = signal(0);
  readonly mediaGeralNotas = signal(0);
  readonly frequenciaMedia = signal(0);
  readonly taxaAprovacao = signal(0);
  readonly totalIntervencoesAbertas = signal(0);

  readonly turmaRows = signal<TurmaIndicadorRow[]>([]);
  readonly anoRows = signal<AnoIndicadorRow[]>([]);
  readonly bimestreRows = signal<BimestreTrendRow[]>([]);
  readonly mesRows = signal<MesFrequenciaRow[]>([]);

  readonly temDados = computed(
    () => this.turmaRows().length > 0 || this.anoRows().length > 0 || this.bimestreRows().length > 0,
  );

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    forkJoin([
      this.alunosService.list().pipe(take(1)),
      this.turmasService.list().pipe(take(1)),
      this.notasService.list().pipe(take(1)),
      this.presencasService.list().pipe(take(1)),
      this.horariosAulasService.list().pipe(take(1)),
      this.intervencoesService.list().pipe(take(1)),
    ])
      .pipe(
        map(([alunos, turmas, notas, presencas, horarios, intervencoes]) => ({
          alunos,
          turmas,
          notas,
          presencas,
          horarios,
          intervencoes,
        })),
        tap((data) => this.buildKpis(data.alunos.length, data.notas, data.presencas, data.intervencoes)),
        tap((data) => this.turmaRows.set(this.buildTurmaRows(data.turmas, data.notas, data.presencas, data.horarios, data.intervencoes))),
        tap((data) => this.anoRows.set(this.buildAnoRows(data.turmas, data.notas, data.presencas, data.horarios))),
        tap((data) => this.bimestreRows.set(this.buildBimestreRows(data.notas))),
        tap((data) => this.mesRows.set(this.buildMesRows(data.presencas))),
        catchError(() => {
          this.errorMessage.set('errors.painel.load');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  private buildKpis(
    totalAlunos: number,
    notas: Nota[],
    presencas: Presenca[],
    intervencoes: Intervencao[],
  ): void {
    this.totalAlunos.set(totalAlunos);
    this.mediaGeralNotas.set(this.media(notas.map((item) => item.valor)));
    this.frequenciaMedia.set(this.calcFrequencia(presencas));
    this.taxaAprovacao.set(this.calcAprovacao(notas));
    this.totalIntervencoesAbertas.set(intervencoes.filter((item) => item.status !== 'concluido').length);
  }

  private buildTurmaRows(
    turmas: Turma[],
    notas: Nota[],
    presencas: Presenca[],
    horarios: HorarioAula[],
    intervencoes: Intervencao[],
  ): TurmaIndicadorRow[] {
    return turmas
      .map((turma) => {
        const notasTurma = notas.filter((item) => item.turmaId === turma.id);
        const horarioIds = new Set(horarios.filter((item) => item.turmaId === turma.id).map((item) => item.id));
        const presencasTurma = presencas.filter((item) => horarioIds.has(item.horarioAulaId));
        const intervencoesAbertas = intervencoes.filter(
          (item) => item.turmaId === turma.id && item.status !== 'concluido',
        ).length;
        return {
          turmaId: turma.id,
          turmaNome: `${turma.ano} ${turma.nome}`,
          alunos: turma.alunosIds.length,
          mediaNotas: this.media(notasTurma.map((item) => item.valor)),
          frequencia: this.calcFrequencia(presencasTurma),
          aprovacao: this.calcAprovacao(notasTurma),
          intervencoesAbertas,
        };
      })
      .sort((a, b) => a.aprovacao - b.aprovacao);
  }

  private buildAnoRows(
    turmas: Turma[],
    notas: Nota[],
    presencas: Presenca[],
    horarios: HorarioAula[],
  ): AnoIndicadorRow[] {
    const anos = [...new Set(turmas.map((item) => item.ano))];
    return anos.map((ano) => {
      const turmasAno = turmas.filter((item) => item.ano === ano);
      const turmaIds = new Set(turmasAno.map((item) => item.id));
      const notasAno = notas.filter((item) => turmaIds.has(item.turmaId));
      const horarioIds = new Set(horarios.filter((item) => turmaIds.has(item.turmaId)).map((item) => item.id));
      const presencasAno = presencas.filter((item) => horarioIds.has(item.horarioAulaId));
      const alunos = turmasAno.reduce((acc, turma) => acc + turma.alunosIds.length, 0);
      return {
        ano,
        turmas: turmasAno.length,
        alunos,
        mediaNotas: this.media(notasAno.map((item) => item.valor)),
        frequencia: this.calcFrequencia(presencasAno),
        aprovacao: this.calcAprovacao(notasAno),
      };
    });
  }

  private buildBimestreRows(notas: Nota[]): BimestreTrendRow[] {
    return BIMESTRE_OPTIONS.map((item) => {
      const notasBimestre = notas.filter((nota) => nota.bimestre === item.value);
      return {
        bimestre: item.label,
        mediaNotas: this.media(notasBimestre.map((nota) => nota.valor)),
        totalLancamentos: notasBimestre.length,
      };
    });
  }

  private buildMesRows(presencas: Presenca[]): MesFrequenciaRow[] {
    const groups = new Map<string, Presenca[]>();
    presencas.forEach((item) => {
      const mes = item.data.slice(0, 7);
      const list = groups.get(mes) ?? [];
      list.push(item);
      groups.set(mes, list);
    });
    return [...groups.entries()]
      .map(([mes, list]) => ({
        mes,
        frequencia: this.calcFrequencia(list),
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }

  private media(values: number[]): number {
    if (!values.length) return 0;
    return Number((values.reduce((acc, value) => acc + value, 0) / values.length).toFixed(2));
  }

  private calcFrequencia(presencas: Presenca[]): number {
    if (!presencas.length) return 100;
    const positivas = presencas.filter(
      (item) => item.status === 'presente' || item.status === 'justificado',
    ).length;
    return Number(((positivas / presencas.length) * 100).toFixed(1));
  }

  private calcAprovacao(notas: Nota[]): number {
    if (!notas.length) return 0;
    const mediasPorAlunoMateria = new Map<string, number[]>();
    notas.forEach((item) => {
      const key = `${item.alunoId}|${item.turmaId}|${item.materiaId}`;
      const list = mediasPorAlunoMateria.get(key) ?? [];
      list.push(item.valor);
      mediasPorAlunoMateria.set(key, list);
    });
    const medias = [...mediasPorAlunoMateria.values()].map(
      (values) => values.reduce((acc, value) => acc + value, 0) / values.length,
    );
    const aprovados = medias.filter((media) => media >= 6).length;
    return Number(((aprovados / medias.length) * 100).toFixed(1));
  }
}
