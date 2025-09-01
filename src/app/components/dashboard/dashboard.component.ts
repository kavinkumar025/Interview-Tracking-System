import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports:[CommonModule],
  template:`<div class="container py-4"><h4>Dashboard (HR)</h4><p>Metrics coming soon...</p></div>`
})
export class DashboardComponent {}
