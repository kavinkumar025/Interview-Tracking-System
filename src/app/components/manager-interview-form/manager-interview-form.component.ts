import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { InterviewEvaluation, InterviewStage, Recommendation, Candidate } from '../../models/interview.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector:'app-manager-interview-form',
  standalone:true,
  imports:[CommonModule, ReactiveFormsModule],
  templateUrl: './manager-interview-form.component.html',
  styleUrls: ['./manager-interview-form.component.scss']
})
export class ManagerInterviewFormComponent implements OnInit {
  form!: FormGroup; candidateId=''; candidate?: Candidate | null; submitting=false;
  recommendationOptions = [
    {value: Recommendation.STRONG_HIRE, label:'Strong Hire'},
    {value: Recommendation.HIRE, label:'Hire'},
    {value: Recommendation.NO_HIRE, label:'No Hire'},
    {value: Recommendation.STRONG_NO_HIRE, label:'Strong No Hire'}
  ];
  constructor(private fb: FormBuilder, private route: ActivatedRoute, private fs: FirebaseService, private toast: ToastService, public router: Router){}
  async ngOnInit(){
    this.candidateId = this.route.snapshot.paramMap.get('candidateId')||'';
    this.form = this.fb.group({
      leadershipPotential:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      teamFit:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      decisionMakingAbility:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      domainExpertise:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      projectManagementSkills:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      strategicThinking:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      conflictResolution:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      pastProjectsDiscussion:[''],
      leadershipExamples:[''],
      strengths:[''], weaknesses:[''], recommendation:[Recommendation.HIRE, Validators.required]
    });
    if(this.candidateId){
      this.candidate = await this.fs.getCandidateById(this.candidateId);
      if(!this.candidate){ this.toast.error('Candidate not found'); this.router.navigate(['/candidates']); }
    }
  }
  get f(){ return this.form.controls; }
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
        stage: InterviewStage.MANAGER,
        interviewerId: this.fs['currentUserSubject'].value?.id || 'unknown',
        interviewerName: this.fs['currentUserSubject'].value?.name || 'Unknown',
        isCompleted: true,
        overallRating: this.calculateOverall(val),
        recommendation: val.recommendation,
        comments: val.pastProjectsDiscussion || '',
        strengths,
        areasForImprovement: weaknesses,
        managerInterview: {
          leadershipPotential: val.leadershipPotential,
          teamFit: val.teamFit,
          decisionMakingAbility: val.decisionMakingAbility,
          domainExpertise: val.domainExpertise,
          projectManagementSkills: val.projectManagementSkills,
          strategicThinking: val.strategicThinking,
          conflictResolution: val.conflictResolution,
          pastProjectsDiscussion: val.pastProjectsDiscussion,
          leadershipExamples: val.leadershipExamples
        }
      };
      await this.fs.createEvaluation(evaluation);
      this.toast.success('Manager evaluation saved');
      this.router.navigate(['/evaluation/hr', this.candidateId]);
    } catch(e:any){ this.toast.error(e.message || 'Failed to save'); }
    this.submitting=false;
  }
  calculateOverall(v:any){
    const nums = [v.leadershipPotential,v.teamFit,v.decisionMakingAbility,v.domainExpertise,v.projectManagementSkills,v.strategicThinking,v.conflictResolution];
    return +(nums.reduce((a:number,b:number)=> a+b,0)/nums.length).toFixed(2);
  }
}
