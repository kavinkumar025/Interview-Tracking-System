import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { InterviewEvaluation, InterviewStage, Recommendation, Candidate } from '../../models/interview.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector:'app-technical-interview-form',
  standalone:true,
  imports:[CommonModule, ReactiveFormsModule],
  templateUrl: './technical-interview-form.component.html',
  styleUrls: ['./technical-interview-form.component.scss']
})
export class TechnicalInterviewFormComponent implements OnInit {
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
      technicalSkills:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      problemSolvingAbility:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      codingSkills:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      systemDesignSkills:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      architecturalKnowledge:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      communicationDuringTechnical:[5,[Validators.required, Validators.min(1), Validators.max(5)]],
      questions:[''],
      solutions:[''],
      improve:[''],
      strengths:[''],
      weaknesses:[''],
      recommendation:[Recommendation.HIRE, Validators.required]
    });
    if(this.candidateId){
      this.candidate = await this.fs.getCandidateById(this.candidateId);
      if(!this.candidate){
        this.toast.error('Candidate not found');
        this.router.navigate(['/candidates']);
      }
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
        stage: InterviewStage.TECHNICAL,
        interviewerId: this.fs['currentUserSubject'].value?.id || 'unknown',
        interviewerName: this.fs['currentUserSubject'].value?.name || 'Unknown',
        isCompleted: true,
        overallRating: this.calculateOverall(val),
        recommendation: val.recommendation,
        comments: val.solutions || '',
        strengths,
        areasForImprovement: weaknesses,
        technicalInterview: {
          technicalSkills: val.technicalSkills,
          problemSolvingAbility: val.problemSolvingAbility,
          codingSkills: val.codingSkills,
          systemDesignSkills: val.systemDesignSkills,
          architecturalKnowledge: val.architecturalKnowledge,
          communicationDuringTechnical: val.communicationDuringTechnical,
          questionAsked: (val.questions||'').split(/\n/).filter((q:string)=>!!q.trim()),
          solutionsProvided: (val.solutions||'').split(/\n/).filter((q:string)=>!!q.trim()),
          technicalChallenges: (val.improve||'').split(/\n/).filter((q:string)=>!!q.trim())
        }
      };
      await this.fs.createEvaluation(evaluation);
      this.toast.success('Technical evaluation saved');
      // Navigate to next stage (manager)
      this.router.navigate(['/evaluation/manager', this.candidateId]);
    } catch(e:any){
      this.toast.error(e.message || 'Failed to save');
    }
    this.submitting=false;
  }
  calculateOverall(v:any){
    const nums = [v.technicalSkills, v.problemSolvingAbility, v.codingSkills, v.systemDesignSkills, v.architecturalKnowledge, v.communicationDuringTechnical];
    return +(nums.reduce((a:number,b:number)=> a+b,0)/nums.length).toFixed(2);
  }
}
