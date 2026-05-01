import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '@auth/services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data?.['roles'] as string[] | undefined) ?? [];
  if (!roles.length || auth.hasAnyRole(roles)) {
    return true;
  }
  return router.createUrlTree(['/inicio']);
};
