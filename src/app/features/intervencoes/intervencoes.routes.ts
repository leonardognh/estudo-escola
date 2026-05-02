import { Routes } from '@angular/router';

export const INTERVENCOES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/intervencoes-page.component').then((m) => m.IntervencoesPageComponent),
  },
];
