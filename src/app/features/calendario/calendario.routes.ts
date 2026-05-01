import { Routes } from '@angular/router';

export const CALENDARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/calendario-page.component').then((m) => m.CalendarioPageComponent),
  },
];
