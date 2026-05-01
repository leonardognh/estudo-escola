import { Routes } from '@angular/router';

export const TURMAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/turmas-page.component').then((m) => m.TurmasPageComponent),
  },
];
