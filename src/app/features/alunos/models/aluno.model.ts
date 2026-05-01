export interface Aluno {
  id: string;
  nome: string;
  email: string;
}

export type AlunoFormValue = Omit<Aluno, 'id'>;
