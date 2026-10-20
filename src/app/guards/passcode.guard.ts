import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const passcodeGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Authorization lives in localStorage, so it only applies in the browser.
  if (!isPlatformBrowser(platformId)) {
    return false;
  }

  const isAuthorized = localStorage.getItem('authorized') === 'true';

  if (isAuthorized) {
    return true;
  }

  router.navigate(['/authorize']);
  return false;
};
