import { Routes } from '@angular/router';

export const PROFESSORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/professores-page.component').then(
        (m) => m.ProfessoresPageComponent,
      ),
  },
];
