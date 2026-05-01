import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { authGuard } from '@auth/guards/auth.guard';
import { roleGuard } from '@auth/guards/role.guard';
import { AuthService } from '@auth/services/auth.service';
import { AuthUser } from '@auth/models/auth-user.model';

const createUser = (role: 'admin' | 'professor'): AuthUser => ({
  id: 'u1',
  nome: 'User',
  email: 'user@escola.com',
  senha: '1234',
  role,
  professorId: null,
});

describe('auth and role guards', () => {
  it('authGuard deve bloquear anonimo e redirecionar para login', () => {
    const calls: unknown[] = [];
    const routerMock = {
      createUrlTree: (commands: unknown) => {
        calls.push(commands);
        return '/login-tree';
      },
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(false),
            currentUser: signal(null),
            hasAnyRole: () => false,
          },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe('/login-tree');
    expect(calls).toEqual([['/login']]);
  });

  it('roleGuard deve permitir role cadastrada na rota', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { createUrlTree: () => '/inicio-tree' } },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(true),
            currentUser: signal(createUser('professor')),
            hasAnyRole: (roles: string[]) => roles.includes('professor'),
          },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({ data: { roles: ['admin', 'professor'] } } as never, {} as never),
    );
    expect(result).toBe(true);
  });
});
