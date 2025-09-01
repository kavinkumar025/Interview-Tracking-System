import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './components/shared/header/header.component';
import { ToastContainerComponent } from './components/shared/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private router: Router){}
  showHeader(){ return !this.router.url.startsWith('/login'); }
}
