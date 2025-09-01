import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector:'app-technical-interview-form',
  standalone:true,
  imports:[CommonModule, FormsModule],
  templateUrl: './technical-interview-form.component.html',
  styleUrls: ['./technical-interview-form.component.scss']
})
export class TechnicalInterviewFormComponent { model:any={}; save(){ console.log('technical save', this.model);} }
