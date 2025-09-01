import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector:'app-initial-form',
  standalone:true,
  imports:[CommonModule, FormsModule],
  templateUrl: './initial-form.component.html',
  styleUrls: ['./initial-form.component.scss']
})
export class InitialFormComponent { model:any={}; save(){ console.log('initial save', this.model);} }
