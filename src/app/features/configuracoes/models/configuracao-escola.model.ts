export type PeriodizacaoNotas = 'bimestral' | 'trimestral' | 'semestral' | 'anual';

export interface ConfiguracaoEscola {
  id: string;
  nomeEscola: string;
  periodizacaoNotas: PeriodizacaoNotas;
  mediaAprovacao: number;
  notaMaxima: number;
  usaRecuperacao: boolean;
  permiteLancamentoManual: boolean;
  mostrarRankingTurma: boolean;
}

export type ConfiguracaoEscolaFormValue = Omit<ConfiguracaoEscola, 'id'>;

export const PERIODIZACAO_OPTIONS: readonly { label: string; value: PeriodizacaoNotas }[] = [
  { label: 'Bimestral', value: 'bimestral' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Semestral', value: 'semestral' },
  { label: 'Anual', value: 'anual' },
];
