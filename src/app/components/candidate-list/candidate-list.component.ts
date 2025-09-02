import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { Candidate } from '../../models/interview.model';
import { CandidateFlowComponent } from '../candidate-flow/candidate-flow.component';
@Component({
  selector:'app-candidate-list',
  standalone:true,
  imports:[CommonModule, FormsModule, CandidateFlowComponent],
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.scss']
})
export class CandidateListComponent implements OnInit { 
  candidates: Candidate[] = [];
  filtered: Candidate[] = [];
  q=''; statusFilter=''; positionFilter=''; loading=false; error='';
  selectedCandidate: Candidate | null = null;
  constructor(private fs: FirebaseService, private router: Router, private toast: ToastService){}
  async ngOnInit(){ await this.load(); }
  async load(){
    this.loading=true; this.error='';
    try { this.candidates = await this.fs.getAllCandidates(); this.apply(); }
    catch(e:any){ this.error=e.message||'Failed to load'; this.toast.error(this.error); }
    this.loading=false;
  }
  apply(){
    const ql = this.q.toLowerCase();
    this.filtered = this.candidates.filter(c =>
      (!this.statusFilter || c.status===this.statusFilter) &&
      (!this.positionFilter || c.position===this.positionFilter) &&
      (!ql || c.name.toLowerCase().includes(ql) || c.email.toLowerCase().includes(ql))
    );
  }
  open(candidate: Candidate){
    this.router.navigate(['/candidate', candidate.id, 'report']);
  }
  startStage(candidate: Candidate){
    const stage = candidate.currentStage;
    this.router.navigate(['/evaluation', stage, candidate.id]);
  }

  async viewFlow(candidate: Candidate){
    this.selectedCandidate = candidate;
    // Show bootstrap modal (assuming Bootstrap JS loaded)
    const modalEl = document.getElementById('flowModal');
    if(modalEl){
      // @ts-ignore
      const modal = window.bootstrap ? new window.bootstrap.Modal(modalEl) : null;
      if(modal) modal.show();
    }
  }
}

