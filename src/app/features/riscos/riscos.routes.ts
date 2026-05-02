import { Routes } from '@angular/router';

export const RISCOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/riscos-page.component').then((m) => m.RiscosPageComponent),
  },
];
