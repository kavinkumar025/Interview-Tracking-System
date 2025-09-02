import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { HRDashboardMetrics, InterviewStage } from '../../models/interview.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = false; error = '';
  metrics?: HRDashboardMetrics;
  private charts: Chart[] = [];
  InterviewStage = InterviewStage;

  constructor(private fs: FirebaseService){}

  ngOnInit(){ this.fetch(); }

  async fetch(){
    this.loading = true; this.error='';
    try {
      this.metrics = await this.fs.getHRDashboardMetrics();
      // charts will be created in next change detection cycle
      setTimeout(()=> this.buildCharts(), 0);
    } catch(e:any){ this.error = e.message || 'Failed to load metrics'; }
    this.loading = false;
  }

  ngAfterViewInit(){}

  private buildCharts(){
    this.destroyCharts();
    if(!this.metrics) return;
    // Simple placeholders since service returns empty arrays for some advanced metrics.
    const stageCanvas = document.getElementById('stageChart') as HTMLCanvasElement | null;
    if(stageCanvas){
      const labels = Object.keys(this.metrics.stageStats);
      const passed = labels.map(l=> this.metrics!.stageStats[l as InterviewStage].passed);
      const failed = labels.map(l=> this.metrics!.stageStats[l as InterviewStage].failed);
      this.charts.push(new Chart(stageCanvas, {
        type: 'bar',
        data: { labels, datasets:[
          { label:'Passed', data: passed, backgroundColor:'#198754' },
          { label:'Failed', data: failed, backgroundColor:'#dc3545' }
        ]},
        options: { responsive:true, plugins:{ legend:{ position:'bottom'}}, scales:{ x:{ stacked:false }, y:{ beginAtZero:true } } }
      }));
    }
    const passRateCanvas = document.getElementById('passRateChart') as HTMLCanvasElement | null;
    if(passRateCanvas){
      this.charts.push(new Chart(passRateCanvas, {
        type:'doughnut',
        data:{ labels:['Pass Rate','Remaining'], datasets:[{ data:[this.metrics.overallPassRate, 100 - this.metrics.overallPassRate], backgroundColor:['#0d6efd','#e9ecef'] }] },
        options:{ cutout:'60%', plugins:{ legend:{ display:false } } }
      }));
    }
  }

  refresh(){ this.fetch(); }

  private destroyCharts(){
    this.charts.forEach(c=> c.destroy());
    this.charts = [];
  }

  ngOnDestroy(){ this.destroyCharts(); }
}
