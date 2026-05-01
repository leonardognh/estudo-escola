import { Routes } from '@angular/router';

export const PERIODOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/periodos-page.component').then((m) => m.PeriodosPageComponent),
  },
];
