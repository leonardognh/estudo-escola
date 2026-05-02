export type UserRole = 'admin' | 'professor' | 'aluno' | 'responsavel';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
  professorId?: string | null;
  /** Aluno vinculado ao usuário (portal família, perfil aluno). */
  alunoId?: string | null;
  /** Cadastro de responsável vinculado (portal família, perfil responsável). */
  responsavelId?: string | null;
}
