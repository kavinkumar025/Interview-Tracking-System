import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { firstValueFrom, filter, take } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const fs = inject(FirebaseService);
  const router = inject(Router);
  try {
    // wait for first emission (including null) but give auth listener a tick
    const user = await firstValueFrom(fs.currentUser$.pipe(take(1)));
    if(user) return true;
    router.navigate(['/login']);
    return false;
  } catch {
    router.navigate(['/login']);
    return false;
  }
};