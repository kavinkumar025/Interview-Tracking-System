import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector:'app-hr-interview-form',
  standalone:true,
  imports:[CommonModule, FormsModule],
  templateUrl: './hr-interview-form.component.html',
  styleUrls: ['./hr-interview-form.component.scss']
})
export class HrInterviewFormComponent { model:any={}; save(){ console.log('hr save', this.model);} }
