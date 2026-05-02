import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, map, of, take, tap } from 'rxjs';

import type { AuthUser } from '@auth/models/auth-user.model';
import { AlunosService } from '@alunos/services/alunos.service';
import { Aluno } from '@alunos/models/aluno.model';
import { TurmasService } from '@turmas/services/turmas.service';
import { Turma } from '@turmas/models/turma.model';
import { NotasService } from '@notas/services/notas.service';
import { Nota } from '@notas/models/nota.model';
import { MateriasService } from '@materias/services/materias.service';
import { PresencasService } from '@presencas/services/presencas.service';
import { Presenca, StatusPresenca } from '@presencas/models/presenca.model';
import { HorariosAulasService } from '@calendario/services/horarios-aulas.service';
import { DIA_SEMANA_OPTIONS, HorarioAula } from '@calendario/models/horario-aula.model';
import { AtividadesService } from '@atividades/services/atividades.service';
import { Atividade } from '@atividades/models/atividade.model';
import {
  FamilyPortalDataService,
  type PortalAlunoOption,
} from '@app/core/family-portal/family-portal-data.service';

export type PortalAtividadeRow = Atividade & { materiaNome: string };

export type { PortalAlunoOption };

export interface PortalBoletimRow extends Nota {
  materiaNome: string;
  turmaNome: string;
}

export type PresencaTagSeverity = 'success' | 'danger' | 'warn' | 'secondary';

export interface PortalPresencaRow extends Presenca {
  resumoAula: string;
  /** Severidade do p-tag (evita função no template). */
  statusTagSeverity: PresencaTagSeverity;
}

export interface PortalAgendaRow {
  diaSemana: string;
  diaLabel: string;
  horaInicio: string;
  horaFim: string;
  materiaNome: string;
  turmaNome: string;
}

@Injectable()
export class PortalFacade {
  private readonly alunosService = inject(AlunosService);
  private readonly turmasService = inject(TurmasService);
  private readonly notasService = inject(NotasService);
  private readonly materiasService = inject(MateriasService);
  private readonly presencasService = inject(PresencasService);
  private readonly horariosAulasService = inject(HorariosAulasService);
  private readonly atividadesService = inject(AtividadesService);
  private readonly familyPortalData = inject(FamilyPortalDataService);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly aluno = signal<Aluno | null>(null);
  readonly turmas = signal<Turma[]>([]);
  readonly notas = signal<PortalBoletimRow[]>([]);
  readonly presencas = signal<PortalPresencaRow[]>([]);
  readonly agenda = signal<PortalAgendaRow[]>([]);
  readonly atividades = signal<PortalAtividadeRow[]>([]);

  readonly portalAlunoOpcoes = signal<PortalAlunoOption[]>([]);
  readonly selectedPortalAlunoId = signal<string | null>(null);
  private familyContextKey = '';

  readonly mediaGeral = computed(() => {
    const valores = this.notas().map((n) => n.valor);
    if (!valores.length) return 0;
    return Number((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2));
  });

  readonly frequenciaPercent = computed(() => {
    const lista = this.presencas();
    if (!lista.length) return 100;
    const ok = lista.filter((p) => p.status === 'presente' || p.status === 'justificado').length;
    return Number(((ok / lista.length) * 100).toFixed(1));
  });

  initFamilyContext(user: AuthUser | null): void {
    if (!user) {
      this.familyContextKey = '';
      this.portalAlunoOpcoes.set([]);
      this.selectedPortalAlunoId.set(null);
      this.loadPortal(null);
      return;
    }
    const key = `${user.id}|${user.role}|${user.responsavelId ?? ''}|${user.alunoId ?? ''}`;
    if (key === this.familyContextKey) {
      return;
    }
    this.familyContextKey = key;

    if (user.role === 'aluno') {
      this.portalAlunoOpcoes.set([]);
      this.selectedPortalAlunoId.set(null);
      this.loadPortal(user.alunoId ?? null);
      return;
    }

    if (user.role !== 'responsavel' || !user.responsavelId) {
      this.portalAlunoOpcoes.set([]);
      this.selectedPortalAlunoId.set(null);
      this.loadPortal(null);
      return;
    }

    this.familyPortalData
      .loadResponsavelComOpcoesAlunos(user.responsavelId)
      .pipe(
        take(1),
        tap(({ responsavel, alunosOptions }) => {
          if (!alunosOptions.length || !responsavel?.alunosIds.length) {
            this.portalAlunoOpcoes.set([]);
            this.selectedPortalAlunoId.set(null);
            this.loadPortal(null);
            return;
          }
          this.portalAlunoOpcoes.set(alunosOptions);
          const effective = responsavel.alunosIds[0];
          this.selectedPortalAlunoId.set(effective);
          this.loadPortal(effective);
        }),
        catchError(() => {
          this.errorMessage.set('errors.portal.responsavel');
          this.portalAlunoOpcoes.set([]);
          this.loadPortal(null);
          return of(null);
        }),
      )
      .subscribe();
  }

  selectPortalAluno(alunoId: string): void {
    this.selectedPortalAlunoId.set(alunoId);
    this.loadPortal(alunoId);
  }

  loadPortal(alunoId: string | null | undefined): void {
    if (!alunoId) {
      this.aluno.set(null);
      this.turmas.set([]);
      this.notas.set([]);
      this.presencas.set([]);
      this.agenda.set([]);
      this.atividades.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin([
      this.alunosService.list().pipe(take(1)),
      this.turmasService.list().pipe(take(1)),
      this.notasService.list().pipe(take(1)),
      this.materiasService.list().pipe(take(1)),
      this.materiasService.listMateriasPorAno().pipe(take(1)),
      this.presencasService.list().pipe(take(1)),
      this.horariosAulasService.list().pipe(take(1)),
      this.atividadesService.list().pipe(take(1)),
    ])
      .pipe(
        map(
          ([alunos, turmas, notas, materias, materiasPorAno, presencas, horarios, atividades]) => {
            const aluno = alunos.find((a) => a.id === alunoId) ?? null;
            const turmasAluno = turmas.filter((t) => t.alunosIds.includes(alunoId));
            const turmaIds = new Set(turmasAluno.map((t) => t.id));
            const turmaById = new Map(turmasAluno.map((t) => [t.id, `${t.ano} ${t.nome}`]));
            const materiaById = new Map(materias.map((m) => [m.id, m.nome]));
            const mpaById = new Map(materiasPorAno.map((m) => [m.id, m]));

            const notasAluno = notas.filter((n) => n.alunoId === alunoId && turmaIds.has(n.turmaId));
            const boletim: PortalBoletimRow[] = notasAluno.map((n) => ({
              ...n,
              materiaNome: materiaById.get(n.materiaId) ?? '-',
              turmaNome: turmaById.get(n.turmaId) ?? '-',
            }));

            const horariosTurma = horarios.filter((h) => turmaIds.has(h.turmaId));
            const horarioIds = new Set(horariosTurma.map((h) => h.id));

            const presencasAluno = presencas.filter(
              (p) => p.alunoId === alunoId && horarioIds.has(p.horarioAulaId),
            );
            const diaLabel = (d: HorarioAula['diaSemana']) =>
              DIA_SEMANA_OPTIONS.find((o) => o.value === d)?.label ?? d;

            const presencaRows: PortalPresencaRow[] = presencasAluno.map((p) => {
              const h = horariosTurma.find((x) => x.id === p.horarioAulaId);
              const mpa = h ? mpaById.get(h.materiaPorAnoId) : undefined;
              const matNome = mpa ? materiaById.get(mpa.materiaId) ?? '-' : '-';
              const resumo = h
                ? `${diaLabel(h.diaSemana)} ${h.horaInicio}–${h.horaFim} · ${matNome}`
                : 'Aula';
              return {
                ...p,
                resumoAula: resumo,
                statusTagSeverity: this.presencaStatusTagSeverity(p.status),
              };
            });

            const agendaRows: PortalAgendaRow[] = horariosTurma.map((h) => {
              const turma = turmasAluno.find((t) => t.id === h.turmaId);
              const mpa = mpaById.get(h.materiaPorAnoId);
              const matNome = mpa ? materiaById.get(mpa.materiaId) ?? '-' : '-';
              return {
                diaSemana: h.diaSemana,
                diaLabel: diaLabel(h.diaSemana),
                horaInicio: h.horaInicio,
                horaFim: h.horaFim,
                materiaNome: matNome,
                turmaNome: turma ? `${turma.ano} ${turma.nome}` : '-',
              };
            });

            const ordemDia = DIA_SEMANA_OPTIONS.map((o) => o.value);
            agendaRows.sort((a, b) => {
              const ia = ordemDia.indexOf(a.diaSemana as (typeof ordemDia)[number]);
              const ib = ordemDia.indexOf(b.diaSemana as (typeof ordemDia)[number]);
              if (ia !== ib) return ia - ib;
              return a.horaInicio.localeCompare(b.horaInicio);
            });

            const atividadesAluno: PortalAtividadeRow[] = atividades
              .filter((a) => a.alunoId === alunoId && turmaIds.has(a.turmaId))
              .map((a) => ({
                ...a,
                materiaNome: materiaById.get(a.materiaId) ?? '-',
              }));

            return {
              aluno,
              turmas: turmasAluno,
              notas: boletim,
              presencas: presencaRows,
              agenda: agendaRows,
              atividades: atividadesAluno,
            };
          },
        ),
        tap((data) => {
          this.aluno.set(data.aluno);
          this.turmas.set(data.turmas);
          this.notas.set(data.notas);
          this.presencas.set(data.presencas);
          this.agenda.set(data.agenda);
          this.atividades.set(data.atividades);
        }),
        catchError(() => {
          this.errorMessage.set('errors.portal.portal');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  private presencaStatusTagSeverity(status: StatusPresenca): PresencaTagSeverity {
    if (status === 'presente') return 'success';
    if (status === 'ausente') return 'danger';
    if (status === 'justificado') return 'warn';
    return 'secondary';
  }
}
