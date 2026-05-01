import { Routes } from '@angular/router';

import { LoginPageComponent } from './containers/login-page.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: LoginPageComponent,
  },
];
