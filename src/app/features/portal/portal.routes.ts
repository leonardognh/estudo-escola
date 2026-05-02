import { Routes } from '@angular/router';

export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./containers/portal-page.component').then((m) => m.PortalPageComponent),
  },
];
