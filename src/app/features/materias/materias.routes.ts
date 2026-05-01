import { Routes } from '@angular/router';

export const MATERIAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/materias-page.component').then((m) => m.MateriasPageComponent),
  },
];
