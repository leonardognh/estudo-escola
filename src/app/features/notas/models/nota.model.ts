export interface Nota {
  id: string;
  alunoId: string;
  turmaId: string;
  materiaId: string;
  bimestre: string;
  valor: number;
}

export type NotaFormValue = Omit<Nota, 'id'>;

export const BIMESTRE_OPTIONS: readonly { label: string; value: string }[] = [
  { label: '1o bimestre', value: '1o bimestre' },
  { label: '2o bimestre', value: '2o bimestre' },
  { label: '3o bimestre', value: '3o bimestre' },
  { label: '4o bimestre', value: '4o bimestre' },
];
