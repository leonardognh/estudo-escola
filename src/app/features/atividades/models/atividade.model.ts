export type TipoAtividade = 'prova' | 'trabalho' | 'outros';

export interface Atividade {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoAtividade;
  turmaId: string;
  alunoId: string;
  materiaId: string;
  bimestre: string;
  peso: number;
  notaAtividade: number;
}

export type AtividadeFormValue = Omit<Atividade, 'id'>;

export const TIPO_ATIVIDADE_OPTIONS: readonly { label: string; value: TipoAtividade }[] = [
  { label: 'Prova', value: 'prova' },
  { label: 'Trabalho', value: 'trabalho' },
  { label: 'Outros', value: 'outros' },
];
