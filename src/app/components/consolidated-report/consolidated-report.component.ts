import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { ConsolidatedReport, InterviewStage } from '../../models/interview.model';

@Component({
  selector:'app-consolidated-report',
  standalone:true,
  imports:[CommonModule],
  templateUrl: './consolidated-report.component.html',
  styleUrls: ['./consolidated-report.component.scss']
})
export class ConsolidatedReportComponent implements OnInit {
  candidateId='';
  loading=false; error='';
  report?: ConsolidatedReport;
  stages = Object.values(InterviewStage);
  InterviewStage = InterviewStage;
  constructor(private route: ActivatedRoute, private fs: FirebaseService){}
  async ngOnInit(){
    this.candidateId = this.route.snapshot.paramMap.get('candidateId')||'';
    if(this.candidateId) await this.load(); else this.error='Candidate id missing';
  }
  async load(){
    this.loading=true; this.error='';
    try { this.report = await this.fs.generateConsolidatedReport(this.candidateId); }
    catch(e:any){ this.error = e.message || 'Failed to load report'; }
    this.loading=false;
  }
  stageKeys(){ return this.report ? Object.keys(this.report.stageStatus) : []; }
  stageData(key: string){
    return this.report?.stageStatus[key as keyof typeof this.report.stageStatus];
  }
  exportJSON(){
    if(!this.report) return;
    const blob = new Blob([JSON.stringify(this.report,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `consolidated-report-${this.report.candidateName}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  // Simple printable view; could integrate real PDF later.
  print(){ window.print(); }
  overallStatusClass(){
    if(!this.report) return 'secondary';
    switch(this.report.finalDecision){
      case 'hired': return 'success';
      case 'rejected': return 'danger';
      case 'on-hold': return 'warning';
      default: return 'secondary';
    }
  }
}
