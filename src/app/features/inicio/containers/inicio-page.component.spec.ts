import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '@auth/services/auth.service';
import { InicioPageComponent } from '@inicio/containers/inicio-page.component';
import { AuthUser } from '@auth/models/auth-user.model';

@Component({ standalone: true, template: '' })
class InicioTestStubComponent {}

const createUser = (role: AuthUser['role']): AuthUser => ({
  id: 'u1',
  nome: 'Nome',
  email: 'user@escola.com',
  senha: '1234',
  role,
  professorId: null,
  alunoId: null,
  responsavelId: null,
});

describe('InicioPageComponent', () => {
  const routerProviders = [
    provideRouter([{ path: '**', component: InicioTestStubComponent }]),
  ];

  it('deve renderizar bloco de professor para role professor', () => {
    TestBed.configureTestingModule({
      imports: [InicioPageComponent],
      providers: [
        ...routerProviders,
        { provide: AuthService, useValue: { currentUser: signal(createUser('professor')) } },
      ],
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
      providers: [
        ...routerProviders,
        { provide: AuthService, useValue: { currentUser: signal(createUser('admin')) } },
      ],
    });

    const fixture = TestBed.createComponent(InicioPageComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-inicio-admin-steps')).toBeTruthy();
    expect(compiled.querySelector('app-inicio-professor-steps')).toBeFalsy();
  });

  it('deve renderizar bloco família para role aluno', () => {
    TestBed.configureTestingModule({
      imports: [InicioPageComponent],
      providers: [
        ...routerProviders,
        { provide: AuthService, useValue: { currentUser: signal(createUser('aluno')) } },
      ],
    });

    const fixture = TestBed.createComponent(InicioPageComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-inicio-familia-steps')).toBeTruthy();
    expect(compiled.querySelector('app-inicio-admin-steps')).toBeFalsy();
  });
});
