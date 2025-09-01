import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FirebaseService } from '../../../services/firebase.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector:'app-header',
  standalone:true,
  imports:[CommonModule, RouterLink, RouterLinkActive],
  templateUrl:'./header.component.html',
  styleUrls:['./header.component.scss']
})
export class HeaderComponent {
  constructor(public fs: FirebaseService, private router: Router, private toast: ToastService){}
  async logout(){
    await this.fs.logout();
    this.toast.info('Logged out');
    this.router.navigate(['/login']);
  }
}
