import { Routes } from '@angular/router';

export const ALUNOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/alunos-page.component').then((m) => m.AlunosPageComponent),
  },
];
