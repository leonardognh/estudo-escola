export interface Periodo {
  id: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
}

export type PeriodoFormValue = Omit<Periodo, 'id'>;
