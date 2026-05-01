import { Routes } from '@angular/router';

export const MATERIAS_ANO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/materias-ano-page.component').then((m) => m.MateriasAnoPageComponent),
  },
];
