import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { InterviewStage, Recommendation } from '../../models/interview.model';
import { ToastService } from '../../services/toast.service';
@Component({
  selector:'app-initial-form',
  standalone:true,
  imports:[CommonModule, ReactiveFormsModule],
  templateUrl: './initial-form.component.html',
  styleUrls: ['./initial-form.component.scss']
})
export class InitialFormComponent { 
  form!: FormGroup; saving=false; candidateId='';
  constructor(private fb: FormBuilder, private route: ActivatedRoute, private fs: FirebaseService, private toast: ToastService, private router: Router){
    this.form = this.fb.group({
      eligibilityCheck: [true, Validators.required],
      resumeQuality: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      experienceMatch: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      educationMatch: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      documentationComplete: [true, Validators.required],
      comments: ['']
    });
    this.candidateId = this.route.snapshot.paramMap.get('candidateId') || '';
  }
  overallScore(): number {
    const v = this.form.value;
    const nums = [v.resumeQuality, v.experienceMatch, v.educationMatch].map(Number);
    return nums.reduce((a,b)=>a+b,0)/nums.length;
  }
  async save(){
    if(this.form.invalid || !this.candidateId) return;
    this.saving=true;
    try {
      const val = this.form.value;
      await this.fs.createEvaluation({
        candidateId: this.candidateId,
        candidateName: '', // could be fetched if needed for redundancy
        position: '',
        stage: InterviewStage.INITIAL,
        interviewerId: this.fs['currentUserSubject'].value?.id||'system',
        interviewerName: this.fs['currentUserSubject'].value?.name||'System',
        isCompleted: true,
        completedAt: new Date(),
        overallRating: this.overallScore(),
        recommendation: Recommendation.HIRE,
        comments: val.comments || '',
        strengths: [],
        areasForImprovement: [],
        initialForm: {
          eligibilityCheck: val.eligibilityCheck,
          resumeQuality: val.resumeQuality,
          experienceMatch: val.experienceMatch,
          educationMatch: val.educationMatch,
          documentationComplete: val.documentationComplete,
          backgroundVerified: false
        }
      });
      this.toast.success('Initial evaluation saved');
      this.router.navigate(['/candidates']);
    } catch(e:any){ this.toast.error(e.message||'Save failed'); }
    this.saving=false;
  }
}
