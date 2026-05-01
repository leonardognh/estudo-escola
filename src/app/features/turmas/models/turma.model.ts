export interface Turma {
  id: string;
  ano: string;
  nome: string;
  periodoId: string;
  divisaoNotas: string;
  alunosIds: string[];
}

export type TurmaFormValue = Omit<Turma, 'id'>;

export const ANO_OPTIONS: readonly { label: string; value: string }[] = [
  { label: '1o ano', value: '1o ano' },
  { label: '2o ano', value: '2o ano' },
  { label: '3o ano', value: '3o ano' },
  { label: '4o ano', value: '4o ano' },
  { label: '5o ano', value: '5o ano' },
  { label: '6o ano', value: '6o ano' },
  { label: '7o ano', value: '7o ano' },
  { label: '8o ano', value: '8o ano' },
  { label: '9o ano', value: '9o ano' },
  { label: '1o colegial', value: '1o colegial' },
  { label: '2o colegial', value: '2o colegial' },
  { label: '3o colegial', value: '3o colegial' },
];

export const DIVISAO_NOTAS_OPTIONS: readonly { label: string; value: string }[] = [
  { label: 'Bimestral', value: 'bimestral' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Semestral', value: 'semestral' },
  { label: 'Anual', value: 'anual' },
];

