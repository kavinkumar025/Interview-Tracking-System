import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { InterviewEvaluation, InterviewStage, Recommendation, Candidate } from '../../models/interview.model';
import { ToastService } from '../../services/toast.service';
@Component({
  selector:'app-system-task-form',
  standalone:true,
  imports:[CommonModule, ReactiveFormsModule],
  templateUrl: './system-task-form.component.html',
  styleUrls: ['./system-task-form.component.scss']
})
export class SystemTaskFormComponent implements OnInit {
  form!: FormGroup; candidateId=''; submitting=false; candidate?: Candidate | null;
  recommendationOptions = [
    {value: Recommendation.STRONG_HIRE, label:'Strong Hire'},
    {value: Recommendation.HIRE, label:'Hire'},
    {value: Recommendation.NO_HIRE, label:'No Hire'},
    {value: Recommendation.STRONG_NO_HIRE, label:'Strong No Hire'}
  ];
  constructor(private fb: FormBuilder, private route: ActivatedRoute, private fs: FirebaseService, private toast: ToastService, private router: Router){}
  async ngOnInit(){
    this.candidateId = this.route.snapshot.paramMap.get('candidateId')||'';
    this.form = this.fb.group({
      taskType:['design', Validators.required],
      completionTime:[60, [Validators.required, Validators.min(1)]],
      codeQuality:[5, [Validators.required, Validators.min(1), Validators.max(5)]],
      problemSolvingAbility:[5, [Validators.required, Validators.min(1), Validators.max(5)]],
      creativity:[5, [Validators.required, Validators.min(1), Validators.max(5)]],
      testCases:[0, [Validators.min(0)]],
      taskDescription:[''],
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
        stage: InterviewStage.SYSTEM_TASK,
        interviewerId: this.fs['currentUserSubject'].value?.id || 'unknown',
        interviewerName: this.fs['currentUserSubject'].value?.name || 'Unknown',
        isCompleted: true,
        overallRating: this.calculateOverall(val),
        recommendation: val.recommendation,
        comments: val.taskDescription || '',
        strengths,
        areasForImprovement: weaknesses,
        systemTask: {
          taskType: val.taskType,
          taskDescription: val.taskDescription || '',
          completionTime: val.completionTime,
          codeQuality: val.codeQuality,
            problemSolvingApproach: val.problemSolvingAbility,
          creativity: val.creativity,
          testCases: val.testCases,
          totalTestCases: val.testCases
        }
      };
      await this.fs.createEvaluation(evaluation);
      this.toast.success('System task evaluation saved');
      // navigate directly to technical evaluation (next stage)
      this.router.navigate(['/evaluation/technical', this.candidateId]);
    } catch(e:any){
      this.toast.error(e.message || 'Failed to save');
    }
    this.submitting=false;
  }
  calculateOverall(v:any){
    const nums = [v.codeQuality||0, v.problemSolvingAbility||0, v.creativity||0];
    return +(nums.reduce((a,b)=> a+b,0)/nums.length).toFixed(2);
  }
}
