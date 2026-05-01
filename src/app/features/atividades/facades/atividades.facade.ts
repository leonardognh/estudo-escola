import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of, switchMap, take, tap } from 'rxjs';

import { AtividadesService } from '@atividades/services/atividades.service';
import { Atividade, AtividadeFormValue } from '@atividades/models/atividade.model';
import { TurmasService } from '@turmas/services/turmas.service';
import { Turma } from '@turmas/models/turma.model';
import { AlunosService } from '@alunos/services/alunos.service';
import { Aluno } from '@alunos/models/aluno.model';
import { MateriasService } from '@materias/services/materias.service';
import { Materia, MateriaPorAno } from '@materias/models/materia.model';
import { NotasService } from '@notas/services/notas.service';
import { Nota } from '@notas/models/nota.model';

@Injectable()
export class AtividadesFacade {
  private readonly atividadesService = inject(AtividadesService);
  private readonly turmasService = inject(TurmasService);
  private readonly alunosService = inject(AlunosService);
  private readonly materiasService = inject(MateriasService);
  private readonly notasService = inject(NotasService);

  readonly atividades = signal<Atividade[]>([]);
  readonly turmas = signal<Turma[]>([]);
  readonly alunos = signal<Aluno[]>([]);
  readonly materias = signal<Materia[]>([]);
  readonly materiasPorAno = signal<MateriaPorAno[]>([]);
  readonly notas = signal<Nota[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly turmaOptions = computed(() =>
    this.turmas().map((turma) => ({ label: `${turma.ano} ${turma.nome}`, value: turma.id })),
  );

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin([
      this.atividadesService.list().pipe(take(1)),
      this.turmasService.list().pipe(take(1)),
      this.alunosService.list().pipe(take(1)),
      this.materiasService.list().pipe(take(1)),
      this.materiasService.listMateriasPorAno().pipe(take(1)),
      this.notasService.list().pipe(take(1)),
    ])
      .pipe(
        tap(([atividades, turmas, alunos, materias, materiasPorAno, notas]) => {
          this.atividades.set(atividades);
          this.turmas.set(turmas);
          this.alunos.set(alunos);
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.notas.set(notas);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao carregar atividades.');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  saveAtividade(id: string | null, payload: AtividadeFormValue): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    (id ? this.atividadesService.update(id, payload) : this.atividadesService.create(payload))
      .pipe(
        take(1),
        switchMap(() => this.fetchAll()),
        tap(([atividades, turmas, alunos, materias, materiasPorAno, notas]) => {
          this.atividades.set(atividades);
          this.turmas.set(turmas);
          this.alunos.set(alunos);
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.notas.set(notas);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao salvar atividade.');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  removeAtividade(id: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.atividadesService
      .remove(id)
      .pipe(
        take(1),
        switchMap(() => this.fetchAll()),
        tap(([atividades, turmas, alunos, materias, materiasPorAno, notas]) => {
          this.atividades.set(atividades);
          this.turmas.set(turmas);
          this.alunos.set(alunos);
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.notas.set(notas);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao remover atividade.');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  gerarNotaFinalPorGrupo(alunoId: string, turmaId: string, materiaId: string, bimestre: string): void {
    const relacionadas = this.atividades().filter(
      (item) =>
        item.alunoId === alunoId &&
        item.turmaId === turmaId &&
        item.materiaId === materiaId &&
        item.bimestre === bimestre,
    );
    if (!relacionadas.length) {
      return;
    }

    const somaPesos = relacionadas.reduce((acc, item) => acc + Number(item.peso || 0), 0);
    if (somaPesos <= 0) {
      this.errorMessage.set('Peso total das atividades deve ser maior que zero.');
      return;
    }
    const mediaPonderada =
      relacionadas.reduce((acc, item) => acc + Number(item.notaAtividade || 0) * Number(item.peso || 0), 0) /
      somaPesos;
    const valorNota = Number(mediaPonderada.toFixed(2));

    const existente = this.notas().find(
      (nota) =>
        nota.alunoId === alunoId &&
        nota.turmaId === turmaId &&
        nota.materiaId === materiaId &&
        nota.bimestre === bimestre,
    );
    const payload = {
      alunoId,
      turmaId,
      materiaId,
      bimestre,
      valor: valorNota,
    };

    this.loading.set(true);
    this.errorMessage.set(null);
    (existente ? this.notasService.update(existente.id, payload) : this.notasService.create(payload))
      .pipe(
        take(1),
        switchMap(() => this.fetchAll()),
        tap(([atividades, turmas, alunos, materias, materiasPorAno, notas]) => {
          this.atividades.set(atividades);
          this.turmas.set(turmas);
          this.alunos.set(alunos);
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.notas.set(notas);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao gerar nota pela atividade.');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  gerarNotaFinalPorGrupoComDetalhes(
    alunoId: string,
    turmaId: string,
    materiaId: string,
    bimestre: string,
    atividadesEditadas: { id: string; notaAtividade: number; peso: number }[],
    valorFinalOverride: number | null,
  ): void {
    const relacionadas = this.atividades().filter(
      (item) =>
        item.alunoId === alunoId &&
        item.turmaId === turmaId &&
        item.materiaId === materiaId &&
        item.bimestre === bimestre,
    );
    if (!relacionadas.length) {
      return;
    }

    const editMap = new Map(atividadesEditadas.map((item) => [item.id, item]));
    const atividadesAtualizadas = relacionadas.map((item) => {
      const edited = editMap.get(item.id);
      if (!edited) {
        return item;
      }
      return {
        ...item,
        notaAtividade: Number(edited.notaAtividade),
        peso: Number(edited.peso),
      };
    });

    const somaPesos = atividadesAtualizadas.reduce((acc, item) => acc + Number(item.peso || 0), 0);
    if (somaPesos <= 0) {
      this.errorMessage.set('Peso total das atividades deve ser maior que zero.');
      return;
    }

    const mediaPonderada =
      atividadesAtualizadas.reduce((acc, item) => acc + Number(item.notaAtividade || 0) * Number(item.peso || 0), 0) /
      somaPesos;
    const valorNota = Number((valorFinalOverride ?? mediaPonderada).toFixed(2));

    const existingMap = new Map(this.atividades().map((item) => [item.id, item]));
    const updateRequests = atividadesAtualizadas
      .filter((item) => {
        const current = existingMap.get(item.id);
        return !!current && (Number(current.peso) !== Number(item.peso) || Number(current.notaAtividade) !== Number(item.notaAtividade));
      })
      .map((item) => {
        const payload: AtividadeFormValue = {
          nome: item.nome,
          descricao: item.descricao,
          tipo: item.tipo,
          turmaId: item.turmaId,
          alunoId: item.alunoId,
          materiaId: item.materiaId,
          bimestre: item.bimestre,
          peso: Number(item.peso),
          notaAtividade: Number(item.notaAtividade),
        };
        return this.atividadesService.update(item.id, payload).pipe(take(1));
      });

    const existente = this.notas().find(
      (nota) =>
        nota.alunoId === alunoId &&
        nota.turmaId === turmaId &&
        nota.materiaId === materiaId &&
        nota.bimestre === bimestre,
    );
    const notaPayload = {
      alunoId,
      turmaId,
      materiaId,
      bimestre,
      valor: valorNota,
    };

    this.loading.set(true);
    this.errorMessage.set(null);
    (updateRequests.length ? forkJoin(updateRequests) : of([]))
      .pipe(
        switchMap(() => (existente ? this.notasService.update(existente.id, notaPayload) : this.notasService.create(notaPayload))),
        take(1),
        switchMap(() => this.fetchAll()),
        tap(([atividades, turmas, alunos, materias, materiasPorAno, notas]) => {
          this.atividades.set(atividades);
          this.turmas.set(turmas);
          this.alunos.set(alunos);
          this.materias.set(materias);
          this.materiasPorAno.set(materiasPorAno);
          this.notas.set(notas);
        }),
        catchError(() => {
          this.errorMessage.set('Erro ao gerar nota pela atividade.');
          return of([[], [], [], [], [], []]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  getAlunosByTurma(turmaId: string): Aluno[] {
    const turma = this.turmas().find((item) => item.id === turmaId);
    if (!turma) {
      return [];
    }
    return this.alunos().filter((aluno) => turma.alunosIds.includes(aluno.id));
  }

  getMateriasByTurma(turmaId: string): Materia[] {
    const turma = this.turmas().find((item) => item.id === turmaId);
    if (!turma) {
      return [];
    }
    const ids = new Set(
      this.materiasPorAno()
        .filter((item) => item.ano === turma.ano)
        .map((item) => item.materiaId),
    );
    return this.materias().filter((materia) => ids.has(materia.id));
  }

  getAlunoNomeById(id: string): string {
    return this.alunos().find((item) => item.id === id)?.nome ?? '-';
  }

  getTurmaNomeById(id: string): string {
    const turma = this.turmas().find((item) => item.id === id);
    return turma ? `${turma.ano} ${turma.nome}` : '-';
  }

  getMateriaNomeById(id: string): string {
    return this.materias().find((item) => item.id === id)?.nome ?? '-';
  }

  private fetchAll() {
    return forkJoin([
      this.atividadesService.list().pipe(take(1)),
      this.turmasService.list().pipe(take(1)),
      this.alunosService.list().pipe(take(1)),
      this.materiasService.list().pipe(take(1)),
      this.materiasService.listMateriasPorAno().pipe(take(1)),
      this.notasService.list().pipe(take(1)),
    ]);
  }
}
