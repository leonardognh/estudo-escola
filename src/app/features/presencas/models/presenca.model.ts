export type StatusPresenca = 'presente' | 'ausente' | 'justificado';

export interface Presenca {
  id: string;
  alunoId: string;
  horarioAulaId: string;
  data: string; // yyyy-MM-dd
  status: StatusPresenca;
}

export type PresencaFormValue = Omit<Presenca, 'id'>;

export const STATUS_PRESENCA_OPTIONS: readonly { label: string; value: StatusPresenca }[] = [
  { label: 'Presente', value: 'presente' },
  { label: 'Ausente', value: 'ausente' },
  { label: 'Justificado', value: 'justificado' },
];
