import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector:'app-system-task-form',
  standalone:true,
  imports:[CommonModule, FormsModule],
  templateUrl: './system-task-form.component.html',
  styleUrls: ['./system-task-form.component.scss']
})
export class SystemTaskFormComponent { model:any={}; save(){ console.log('system task save', this.model);} }
