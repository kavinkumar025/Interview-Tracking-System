import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: number;
  type: 'success'|'error'|'info'|'warning';
  text: string;
  timeout?: number;
}

@Injectable({providedIn:'root'})
export class ToastService {
  private messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();
  private counter = 0;

  show(type: ToastMessage['type'], text: string, timeout=4000){
    const msg: ToastMessage = { id: ++this.counter, type, text, timeout };
    const list = [...this.messagesSubject.value, msg];
    this.messagesSubject.next(list);
    if(timeout){
      setTimeout(()=>this.dismiss(msg.id), timeout);
    }
  }
  success(t:string,timeout?:number){this.show('success',t,timeout);} 
  error(t:string,timeout?:number){this.show('error',t,timeout);} 
  info(t:string,timeout?:number){this.show('info',t,timeout);} 
  warning(t:string,timeout?:number){this.show('warning',t,timeout);} 
  dismiss(id:number){
    this.messagesSubject.next(this.messagesSubject.value.filter(m=>m.id!==id));
  }
  clear(){this.messagesSubject.next([]);} 
}
