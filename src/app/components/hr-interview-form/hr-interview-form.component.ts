import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { InterviewEvaluation, InterviewStage, Recommendation, Candidate, CandidateStatus, FinalDecision } from '../../models/interview.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector:'app-hr-interview-form',
  standalone:true,
  imports:[CommonModule, ReactiveFormsModule],
  templateUrl: './hr-interview-form.component.html',
  styleUrls: ['./hr-interview-form.component.scss']
})
export class HrInterviewFormComponent implements OnInit {
  form!: FormGroup; candidateId=''; candidate?: Candidate | null; submitting=false; finalDecision: FinalDecision = FinalDecision.PENDING;
  recommendationOptions = [
    {value: Recommendation.STRONG_HIRE, label:'Strong Hire'},
    {value: Recommendation.HIRE, label:'Hire'},
    {value: Recommendation.NO_HIRE, label:'No Hire'},
    {value: Recommendation.STRONG_NO_HIRE, label:'Strong No Hire'}
  ];
  decisionOptions = [
    {value: FinalDecision.HIRED, label:'Hire'},
    {value: FinalDecision.REJECTED, label:'Reject'},
    {value: FinalDecision.ON_HOLD, label:'On Hold'}
  ];
  constructor(private fb: FormBuilder, private route: ActivatedRoute, private fs: FirebaseService, private toast: ToastService, public router: Router){}
  async ngOnInit(){
    this.candidateId = this.route.snapshot.paramMap.get('candidateId')||'';
    this.form = this.fb.group({
      cultureFit:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      communicationSkills:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      motivation:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      salaryExpectation:[0,[Validators.min(0)]],
      negotiatedSalary:[0,[Validators.min(0)]],
      availabilityToJoin:['', Validators.required],
      workFromHomePreference:['Hybrid'],
      relocatationWillingness:[false],
      backgroundCheck:[false],
      referenceCheck:[false],
      careerAspiration:[''],
      comments:[''],
      strengths:[''], weaknesses:[''], recommendation:[Recommendation.HIRE, Validators.required], decision:[FinalDecision.HIRED, Validators.required]
    });
    if(this.candidateId){
      this.candidate = await this.fs.getCandidateById(this.candidateId);
      if(!this.candidate){ this.toast.error('Candidate not found'); this.router.navigate(['/candidates']); }
    }
  }
  get f(){ return this.form.controls; }
  overall(val:any){
    return +( [val.cultureFit,val.communicationSkills,val.motivation].reduce((a:number,b:number)=> a+b,0) /3 ).toFixed(2);
  }
  async save(){
    if(this.form.invalid){ this.form.markAllAsTouched(); return; }
    this.submitting=true;
    try {
      const val = this.form.value;
      const strengths = (val.strengths||'').split(/\n|,/).map((s:string)=> s.trim()).filter((s:string)=> !!s);
      const weaknesses = (val.weaknesses||'').split(/\n|,/).map((s:string)=> s.trim()).filter((s:string)=> !!s);
      const evaluation: InterviewEvaluation = {
        candidateId: this.candidateId,
        candidateName: this.candidate?.name || 'Candidate',
        position: this.candidate?.position || 'Unknown',
        stage: InterviewStage.HR,
        interviewerId: this.fs['currentUserSubject'].value?.id || 'unknown',
        interviewerName: this.fs['currentUserSubject'].value?.name || 'Unknown',
        isCompleted: true,
        overallRating: this.overall(val),
        recommendation: val.recommendation,
        comments: val.comments || '',
        strengths,
        areasForImprovement: weaknesses,
        hrInterview: {
          cultureFit: val.cultureFit,
          communicationSkills: val.communicationSkills,
          motivation: val.motivation,
          careerAspiration: val.careerAspiration,
          salaryExpectation: val.salaryExpectation,
          negotiatedSalary: val.negotiatedSalary,
          availabilityToJoin: val.availabilityToJoin,
          workFromHomePreference: val.workFromHomePreference,
          relocatationWillingness: val.relocatationWillingness,
          backgroundCheck: val.backgroundCheck,
          referenceCheck: val.referenceCheck
        }
      };
      await this.fs.createEvaluation(evaluation);
      // Apply final decision to candidate
      const decision: FinalDecision = val.decision;
      if(decision === FinalDecision.HIRED){
        await this.fs.updateCandidate(this.candidateId, { status: CandidateStatus.HIRED, currentStage: InterviewStage.HR });
      } else if(decision === FinalDecision.REJECTED){
        await this.fs.updateCandidate(this.candidateId, { status: CandidateStatus.REJECTED, currentStage: InterviewStage.HR });
      } else if(decision === FinalDecision.ON_HOLD){
        await this.fs.updateCandidate(this.candidateId, { status: CandidateStatus.ON_HOLD, currentStage: InterviewStage.HR });
      }
      this.toast.success('HR evaluation & decision saved');
      this.router.navigate(['/candidates']);
    } catch(e:any){ this.toast.error(e.message || 'Failed to save'); }
    this.submitting=false;
  }
}
