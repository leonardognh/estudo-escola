import { Routes } from '@angular/router';

export const HORARIOS_AULAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/horarios-aulas-page.component').then(
        (m) => m.HorariosAulasPageComponent,
      ),
  },
];
