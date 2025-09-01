import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { POSITION_OPTIONS } from '../../config/form-options';
@Component({
  selector:'app-candidate-registration',
  standalone:true,
  imports:[CommonModule, ReactiveFormsModule],
  templateUrl: './candidate-registration.component.html',
  styleUrls: ['./candidate-registration.component.scss']
})
export class CandidateRegistrationComponent { 
  form!: FormGroup;
  positions = POSITION_OPTIONS;
  saving=false; saved=false; error='';
  constructor(private fb: FormBuilder, private fs: FirebaseService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      position: ['', Validators.required],
      experience: [0, [Validators.min(0)]],
      resumeUrl: ['']
    });
  }
  async save(){
    this.error=''; this.saved=false;
    if(this.form.invalid) return;
    this.saving=true;
    try {
      const value = this.form.value;
      await this.fs.createCandidate({
        name: value.name!,
        email: value.email!,
        phone: value.phone||'',
        position: value.position!,
        experience: value.experience||0,
        resumeUrl: value.resumeUrl||'',
        createdAt: new Date(),
        status: 'applied' as any,
        currentStage: 'initial' as any
      });
      this.saved=true; this.form.reset();
    } catch(e:any){ this.error=e.message||'Error saving'; }
    this.saving=false;
  } 
}
