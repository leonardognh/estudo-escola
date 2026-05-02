export interface Responsavel {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  alunosIds: string[];
}

export type ResponsavelFormValue = Omit<Responsavel, 'id'>;
