import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { HRDashboardMetrics, InterviewStage } from '../../models/interview.model';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
@Component({
  selector:'app-hr-dashboard',
  standalone:true,
  imports:[CommonModule, FormsModule],
  templateUrl: './hr-dashboard.component.html',
  styleUrls: ['./hr-dashboard.component.scss']
})
export class HrDashboardComponent implements OnInit, OnDestroy {
  loading = false; error='';
  metrics?: HRDashboardMetrics;
  filteredStage: InterviewStage | 'all' = 'all';
  autoRefresh = false; refreshHandle: any;
  charts: Chart[] = [];

  constructor(private fs: FirebaseService){}

  ngOnInit(){ this.load(); }

  ngOnDestroy(){ this.clearAuto(); this.destroyCharts(); }

  toggleAuto(){
    if(this.autoRefresh){ this.setAuto(); } else { this.clearAuto(); }
  }
  setAuto(){ this.clearAuto(); this.refreshHandle = setInterval(()=> this.load(true), 30000); }
  clearAuto(){ if(this.refreshHandle){ clearInterval(this.refreshHandle); this.refreshHandle=null; } }

  async load(silent=false){
    if(!silent){ this.loading = true; this.error=''; }
    try {
      this.metrics = await this.fs.getHRDashboardMetrics();
      setTimeout(()=> this.buildCharts(),0);
    } catch(e:any){ this.error = e.message || 'Failed to load metrics'; }
    this.loading = false;
  }

  stageList(){ return Object.keys(this.metrics?.stageStats||{}); }

  displayedStageStats(){
    if(!this.metrics) return [] as any[];
    const entries = Object.entries(this.metrics.stageStats);
    return this.filteredStage==='all'? entries: entries.filter(e=> e[0]===this.filteredStage);
  }

  private buildCharts(){
    this.destroyCharts();
    if(!this.metrics) return;
    const stageCanvas = document.getElementById('hrStageChart') as HTMLCanvasElement | null;
    if(stageCanvas){
      const labels = Object.keys(this.metrics.stageStats);
      const completed = labels.map(l=> this.metrics!.stageStats[l as InterviewStage].completed);
      const passed = labels.map(l=> this.metrics!.stageStats[l as InterviewStage].passed);
      this.charts.push(new Chart(stageCanvas, { type:'bar', data:{ labels, datasets:[
        { label:'Completed', data:completed, backgroundColor:'#0d6efd' },
        { label:'Passed', data:passed, backgroundColor:'#198754' }
      ]}, options:{ responsive:true, plugins:{ legend:{ position:'bottom'}}, scales:{ y:{ beginAtZero:true } } } }));
    }
    const funnelCanvas = document.getElementById('hrFunnelChart') as HTMLCanvasElement | null;
    if(funnelCanvas && this.metrics.candidateFunnelData.length){
      const labels = this.metrics.candidateFunnelData.map(f=> f.stage);
      const data = this.metrics.candidateFunnelData.map(f=> f.candidateCount);
  this.charts.push(new Chart(funnelCanvas, { type:'line', data:{ labels, datasets:[{ label:'Pipeline', data, borderColor:'#6610f2', backgroundColor:'rgba(102,16,242,.15)', fill:true, tension:.4 }]}, options:{ responsive:true, plugins:{ legend:{ position:'bottom'} } } }));
    }
  }

  private destroyCharts(){ this.charts.forEach(c=> c.destroy()); this.charts=[]; }
}
