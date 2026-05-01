import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from '@auth/services/auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('deve autenticar e persistir no localStorage quando lembrarMe=true', () => {
    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);
    let result = false;

    service.login('admin@escola.com', 'admin123', true).subscribe((ok) => {
      result = ok;
    });

    const req = httpMock.expectOne('http://localhost:3000/usuarios');
    req.flush([
      {
        id: 'usr-admin',
        nome: 'Administrador',
        email: 'admin@escola.com',
        senha: 'admin123',
        role: 'admin',
        professorId: null,
      },
    ]);

    expect(result).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.role).toBe('admin');
    expect(localStorage.getItem('escola.auth.user')).toBeTruthy();
    expect(sessionStorage.getItem('escola.auth.session.user')).toBeNull();
  });

  it('deve falhar login com credenciais invalidas', () => {
    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);
    let result = true;

    service.login('x@escola.com', 'errada', false).subscribe((ok) => {
      result = ok;
    });

    const req = httpMock.expectOne('http://localhost:3000/usuarios');
    req.flush([
      {
        id: 'usr-admin',
        nome: 'Administrador',
        email: 'admin@escola.com',
        senha: 'admin123',
        role: 'admin',
        professorId: null,
      },
    ]);

    expect(result).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });
});
