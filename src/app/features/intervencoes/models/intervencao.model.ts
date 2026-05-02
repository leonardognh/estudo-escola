export interface Intervencao {
  id: string;
  alunoId: string;
  turmaId: string;
  materiaId: string;
  bimestre: string;
  risco: 'baixo' | 'medio' | 'alto';
  status: 'aberto' | 'em_andamento' | 'concluido';
  objetivo: string;
  descricao: string;
  responsavel: string;
  prazo: string;
}

export type IntervencaoFormValue = Omit<Intervencao, 'id'>;

export interface RecuperacaoAcademica {
  id: string;
  alunoId: string;
  turmaId: string;
  materiaId: string;
  bimestre: string;
  notaAtual: number;
  notaAlvo: number;
  notaNecessaria: number;
  status: 'pendente' | 'realizada';
}

export type RecuperacaoFormValue = Omit<RecuperacaoAcademica, 'id'>;

export const RISCO_OPTIONS = [
  { label: 'Baixo', value: 'baixo' },
  { label: 'Médio', value: 'medio' },
  { label: 'Alto', value: 'alto' },
] as const;

export const STATUS_INTERVENCAO_OPTIONS = [
  { label: 'Aberto', value: 'aberto' },
  { label: 'Em andamento', value: 'em_andamento' },
  { label: 'Concluído', value: 'concluido' },
] as const;

export const STATUS_RECUPERACAO_OPTIONS = [
  { label: 'Pendente', value: 'pendente' },
  { label: 'Realizada', value: 'realizada' },
] as const;
