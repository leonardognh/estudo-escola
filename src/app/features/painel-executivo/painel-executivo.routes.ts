import { Routes } from '@angular/router';

export const PAINEL_EXECUTIVO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/painel-executivo-page.component').then(
        (m) => m.PainelExecutivoPageComponent,
      ),
  },
];
