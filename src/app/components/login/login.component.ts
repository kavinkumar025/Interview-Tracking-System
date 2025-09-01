import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  mode: 'login' | 'signup' = 'login';
  form!: FormGroup;
  submitting=false; error='';
  constructor(private fb: FormBuilder, private fs: FirebaseService, private router: Router, private toast: ToastService){
    this.form = this.fb.group({
      name: ['',[Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      department: [''],
      role: ['interviewer', Validators.required]
    });
  }
  switchMode(){
    this.mode = this.mode==='login' ? 'signup' : 'login';
    this.error='';
    if(this.mode==='login'){
      this.form.get('name')?.clearValidators();
      this.form.get('name')?.updateValueAndValidity();
    } else {
      this.form.get('name')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.form.get('name')?.updateValueAndValidity();
    }
  }
  async submit(){
    if(this.form.invalid) return;
    this.submitting=true; this.error='';
    const { name, email, password, department, role } = this.form.value;
    try {
      if(this.mode==='login'){
        await this.fs.login(email!, password!);
        this.toast.success('Welcome back');
      } else {
        await this.fs.register(email!, password!, {
          name: name!,
          role: role as any,
          department: department||'General',
          canInterviewFor: [],
          createdAt: new Date(),
          isActive: true
        });
        this.toast.success('Account created');
      }
      this.router.navigate(['/dashboard']);
    } catch(e:any){
      this.error = e.message || 'Authentication failed';
      this.toast.error(this.error, 6000);
    }
    this.submitting=false;
  }
}
