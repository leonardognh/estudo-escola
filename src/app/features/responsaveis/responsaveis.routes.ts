import { Routes } from '@angular/router';

export const RESPONSAVEIS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/responsaveis-page.component').then((m) => m.ResponsaveisPageComponent),
  },
];
