import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

import { AuthUser } from '@auth/models/auth-user.model';

const STORAGE_KEY = 'escola.auth.user';
const SESSION_KEY = 'escola.auth.session.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/usuarios';

  readonly currentUser = signal<AuthUser | null>(this.loadPersistedUser());
  readonly isAuthenticated = signal(!!this.currentUser());

  login(email: string, senha: string, rememberMe: boolean): Observable<boolean> {
    return this.http.get<AuthUser[]>(this.apiUrl).pipe(
      map((users) => users.find((item) => item.email === email && item.senha === senha) ?? null),
      tap((user) => {
        if (!user) {
          return;
        }
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        this.persistUser(user, rememberMe);
      }),
      map((user) => !!user),
    );
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUser();
    if (!user) {
      return false;
    }
    return roles.includes(user.role);
  }

  private persistUser(user: AuthUser, rememberMe: boolean): void {
    const serialized = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, serialized);
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, serialized);
    localStorage.removeItem(STORAGE_KEY);
  }

  private loadPersistedUser(): AuthUser | null {
    const remembered = localStorage.getItem(STORAGE_KEY);
    if (remembered) {
      return JSON.parse(remembered) as AuthUser;
    }
    const session = sessionStorage.getItem(SESSION_KEY);
    return session ? (JSON.parse(session) as AuthUser) : null;
  }
}
