import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector:'app-manager-interview-form',
  standalone:true,
  imports:[CommonModule, FormsModule],
  templateUrl: './manager-interview-form.component.html',
  styleUrls: ['./manager-interview-form.component.scss']
})
export class ManagerInterviewFormComponent { model:any={}; save(){ console.log('manager save', this.model);} }
