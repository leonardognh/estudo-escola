import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '@auth/services/auth.service';
import { InicioPageComponent } from '@inicio/containers/inicio-page.component';
import { AuthUser } from '@auth/models/auth-user.model';

const createUser = (role: 'admin' | 'professor'): AuthUser => ({
  id: 'u1',
  nome: 'Nome',
  email: 'user@escola.com',
  senha: '1234',
  role,
  professorId: null,
});

describe('InicioPageComponent', () => {
  it('deve renderizar bloco de professor para role professor', () => {
    TestBed.configureTestingModule({
      imports: [InicioPageComponent],
      providers: [{ provide: AuthService, useValue: { currentUser: signal(createUser('professor')) } }],
    });

    const fixture = TestBed.createComponent(InicioPageComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-inicio-professor-steps')).toBeTruthy();
    expect(compiled.querySelector('app-inicio-admin-steps')).toBeFalsy();
  });

  it('deve renderizar bloco admin para role admin', () => {
    TestBed.configureTestingModule({
      imports: [InicioPageComponent],
      providers: [{ provide: AuthService, useValue: { currentUser: signal(createUser('admin')) } }],
    });

    const fixture = TestBed.createComponent(InicioPageComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-inicio-admin-steps')).toBeTruthy();
    expect(compiled.querySelector('app-inicio-professor-steps')).toBeFalsy();
  });
});
