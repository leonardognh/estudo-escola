export type UserRole = 'admin' | 'professor';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
  professorId?: string | null;
}
