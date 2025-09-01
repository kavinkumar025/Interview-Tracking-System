import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';

export const authGuard: CanActivateFn = async () => {
  const fs = inject(FirebaseService);
  const router = inject(Router);
  const user = await new Promise(resolve => {
    const sub = fs.currentUser$.subscribe(u=>{ resolve(u); sub.unsubscribe(); });
  });
  if(user){
    return true;
  }
  router.navigate(['/login']);
  return false;
};