export type DiaSemana =
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado'
  | 'domingo';

export interface HorarioAula {
  id: string;
  turmaId: string;
  materiaPorAnoId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
}

export type HorarioAulaFormValue = Omit<HorarioAula, 'id'>;

export const DIA_SEMANA_OPTIONS: readonly { label: string; value: DiaSemana }[] = [
  { label: 'Segunda', value: 'segunda' },
  { label: 'Terça', value: 'terca' },
  { label: 'Quarta', value: 'quarta' },
  { label: 'Quinta', value: 'quinta' },
  { label: 'Sexta', value: 'sexta' },
  { label: 'Sábado', value: 'sabado' },
  { label: 'Domingo', value: 'domingo' },
];
