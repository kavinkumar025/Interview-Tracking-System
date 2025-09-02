import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { InterviewEvaluation, InterviewStage, CandidateStatus, Candidate } from '../../models/interview.model';
import { CandidateRejection } from '../../models/rejection.model';

@Component({
  selector: 'app-candidate-flow',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './candidate-flow.component.html',
  styleUrls: ['./candidate-flow.component.scss']
})
export class CandidateFlowComponent implements OnInit {
  @Input() candidateId!: string;
  evaluations: InterviewEvaluation[] = [];
  candidate?: Candidate | null;
  rejection?: CandidateRejection | null;
  loading=false; error='';
  stages = [InterviewStage.INITIAL, InterviewStage.SYSTEM_TASK, InterviewStage.TECHNICAL, InterviewStage.MANAGER, InterviewStage.HR];
  InterviewStage = InterviewStage;

  constructor(private fs: FirebaseService){}

  async ngOnInit(){
    if(!this.candidateId) return;
    await this.load();
  }

  async load(){
    this.loading=true; this.error='';
    try {
      this.candidate = await this.fs.getCandidateById(this.candidateId);
      this.evaluations = await this.fs.getCandidateEvaluationFlow(this.candidateId);
      if(this.candidate?.status === CandidateStatus.REJECTED){
        const rejs = await this.fs.getRejectionsForCandidate(this.candidateId);
        this.rejection = rejs[0];
      } else {
        this.rejection = null;
      }
    }
    catch(e:any){ this.error = e.message || 'Failed to load flow'; }
    this.loading=false;  }

  evalFor(stage: InterviewStage){ return this.evaluations.find(e=> e.stage===stage); }
  status(stage: InterviewStage){
    const ev = this.evalFor(stage);
    if(!ev) return 'pending';
    if(!ev.isCompleted) return 'in-progress';
    return ev.overallRating>=3 ? 'passed':'failed';
  }

  async reject(stage: InterviewStage){
    const reason = prompt('Reason for rejection?');
    if(!reason) return;
    try {
      await this.fs.rejectCandidate(this.candidateId, stage, reason);
      await this.load();
    } catch(e:any){
      this.error = e.message || 'Failed to reject candidate';
    }
  }
}
