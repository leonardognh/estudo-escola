export interface Professor {
  id: string;
  nome: string;
  email: string;
  materiaPrincipalId: string;
  outrasMateriasIds: string[];
}

export type ProfessorFormValue = Omit<Professor, 'id'>;
