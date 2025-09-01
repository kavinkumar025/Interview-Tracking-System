import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector:'app-toast-container',
  standalone:true,
  imports:[CommonModule],
  templateUrl:'./toast-container.component.html',
  styleUrls:['./toast-container.component.scss']
})
export class ToastContainerComponent {
  constructor(public toast: ToastService){}
  trackById(_:number,m:any){return m.id;}
}
