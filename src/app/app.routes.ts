import { Routes } from '@angular/router';
import { authGuard } from '@auth/guards/auth.guard';
import { roleGuard } from '@auth/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'inicio',
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'inicio',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/inicio/inicio.routes').then((m) => m.INICIO_ROUTES),
  },
  {
    path: 'alunos',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () =>
      import('./features/alunos/alunos.routes').then((m) => m.ALUNOS_ROUTES),
  },
  {
    path: 'professores',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () =>
      import('./features/professores/professores.routes').then(
        (m) => m.PROFESSORES_ROUTES,
      ),
  },
  {
    path: 'materias',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () =>
      import('./features/materias/materias.routes').then((m) => m.MATERIAS_ROUTES),
  },
  {
    path: 'materias-ano',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () =>
      import('./features/materias-ano/materias-ano.routes').then((m) => m.MATERIAS_ANO_ROUTES),
  },
  {
    path: 'turmas',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () =>
      import('./features/turmas/turmas.routes').then((m) => m.TURMAS_ROUTES),
  },
  {
    path: 'periodos',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () =>
      import('./features/periodos/periodos.routes').then((m) => m.PERIODOS_ROUTES),
  },
  {
    path: 'calendario',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'professor'] },
    loadChildren: () =>
      import('./features/calendario/calendario.routes').then((m) => m.CALENDARIO_ROUTES),
  },
  {
    path: 'horarios-aulas',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'professor'] },
    loadChildren: () =>
      import('./features/horarios-aulas/horarios-aulas.routes').then(
        (m) => m.HORARIOS_AULAS_ROUTES,
      ),
  },
  {
    path: 'notas',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'professor'] },
    loadChildren: () =>
      import('./features/notas/notas.routes').then((m) => m.NOTAS_ROUTES),
  },
  {
    path: 'presencas',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'professor'] },
    loadChildren: () =>
      import('./features/presencas/presencas.routes').then((m) => m.PRESENCAS_ROUTES),
  },
  {
    path: 'atividades',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'professor'] },
    loadChildren: () =>
      import('./features/atividades/atividades.routes').then((m) => m.ATIVIDADES_ROUTES),
  },
  {
    path: 'configuracoes',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () =>
      import('./features/configuracoes/configuracoes.routes').then((m) => m.CONFIGURACOES_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'inicio',
  },
];
