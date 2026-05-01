export interface Materia {
  id: string;
  nome: string;
  codigo: string;
}

export type MateriaFormValue = Omit<Materia, 'id'>;

export interface MateriaPorAno {
  id: string;
  ano: string;
  materiaId: string;
  cargaHoraria: number;
  professorPrincipalId: string;
  professorSubstitutoId?: string | null;
}

export type MateriaPorAnoFormValue = Omit<MateriaPorAno, 'id'>;

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
