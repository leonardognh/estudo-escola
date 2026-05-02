export type SemaforoRisco = 'baixo' | 'medio' | 'alto';

export type SemaforoTagSeverity = 'success' | 'warn' | 'danger' | 'secondary';

export interface RiscoAlunoRow {
  id: string;
  alunoId: string;
  alunoNome: string;
  turmaId: string;
  turmaNome: string;
  materiaId: string;
  materiaNome: string;
  bimestre: string;
  mediaNotas: number;
  frequencia: number;
  scoreRisco: number;
  semaforo: SemaforoRisco;
  /** Severidade do p-tag (evita função no template). */
  semaforoTagSeverity: SemaforoTagSeverity;
  /** Chaves i18n para `TranslocoPipe`. */
  sugestaoKey: string;
  fatoresKeys: readonly string[];
}
