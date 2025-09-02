import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { EvaluationTemplate, User } from '../../models/interview.model';
import { RouterModule } from '@angular/router';

interface NotificationSettings {
  reminderDays: number;
  sendDailyDigest: boolean;
  digestHour: number;
}
@Component({
  selector:'app-admin-settings',
  standalone:true,
  imports:[CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit {
  tab: 'users' | 'templates' | 'notifications' = 'users';
  users: User[] = [];
  loadingUsers = false;
  userError: string | null = null;

  templates: EvaluationTemplate[] = [];
  loadingTemplates = false;
  templateError: string | null = null;

  templateForm!: FormGroup;
  notificationForm!: FormGroup;
  savingTemplate = false;
  savingNotifications = false;
  editingTemplate: EvaluationTemplate | null = null;

  constructor(private fb: FormBuilder, private fs: FirebaseService) {}

  ngOnInit(): void {
    this.buildForms();
    this.loadUsers();
    this.loadTemplates();
  }

  buildForms() {
    this.templateForm = this.fb.group({
      position: ['', Validators.required],
      stageWeightings: this.fb.group({
        initial: [15, [Validators.required, Validators.min(0)]],
        systemTask: [20, [Validators.required, Validators.min(0)]],
        technical: [25, [Validators.required, Validators.min(0)]],
        managerial: [20, [Validators.required, Validators.min(0)]],
        hr: [20, [Validators.required, Validators.min(0)]]
      }),
      customQuestions: this.fb.array([])
    });

    this.notificationForm = this.fb.group({
      reminderDays: [3, [Validators.required, Validators.min(1)]],
      sendDailyDigest: [true],
      digestHour: [8, [Validators.required, Validators.min(0), Validators.max(23)]]
    });
  }

  // Users
  async loadUsers() {
    this.loadingUsers = true; this.userError = null;
    try {
      this.users = await this.fs.getAllUsers();
    } catch (e:any) {
      this.userError = e.message || 'Failed to load users';
    } finally { this.loadingUsers = false; }
  }

  async changeRole(u: User, role: string | Event) {
    const newRole = typeof role === 'string' ? role : (role.target as HTMLSelectElement).value;
    if (u.role === newRole) return;
    await this.fs.updateUser(u.id!, { role: newRole as any });
    u.role = newRole as any;
  }

  async toggleActive(u: User) {
    await this.fs.updateUser(u.id!, { isActive: !u.isActive });
    u.isActive = !u.isActive;
  }

  // Templates
  customQuestionsArray(): FormArray { return this.templateForm.get('customQuestions') as FormArray; }

  addCustomQuestion() {
    this.customQuestionsArray().push(this.fb.group({
      key: ['', Validators.required],
      question: ['', Validators.required],
      maxScore: [5, [Validators.required, Validators.min(1)]]
    }));
  }

  removeCustomQuestion(i: number) { this.customQuestionsArray().removeAt(i); }

  async loadTemplates() {
    this.loadingTemplates = true; this.templateError = null;
    try {
      this.templates = await this.fs.getEvaluationTemplates();
    } catch (e:any) {
      this.templateError = e.message || 'Failed to load templates';
    } finally { this.loadingTemplates = false; }
  }

  editTemplate(t: EvaluationTemplate) {
    this.editingTemplate = t;
  this.templateForm.patchValue({ position: t.position, stageWeightings: t.weightings });
    this.customQuestionsArray().clear();
    (t.customQuestions||[]).forEach(q => this.customQuestionsArray().push(this.fb.group({
      id: [q.id, Validators.required],
      question: [q.question, Validators.required],
      type: [q.type, Validators.required],
      weightage: [q.weightage, [Validators.required, Validators.min(0)]],
      required: [q.required]
    })));
    this.tab = 'templates';
  }

  newTemplate() {
    this.editingTemplate = null;
    this.templateForm.reset({
      position: '',
      stageWeightings: { initial:15, systemTask:20, technical:25, managerial:20, hr:20 }
    });
    this.customQuestionsArray().clear();
    this.tab = 'templates';
  }

  async saveTemplate() {
    if (this.templateForm.invalid) { this.templateForm.markAllAsTouched(); return; }
    this.savingTemplate = true;
    try {
      const value = this.templateForm.value as any;
      if (this.editingTemplate) {
        await this.fs.updateEvaluationTemplate(this.editingTemplate.id!, value);
        Object.assign(this.editingTemplate, value);
      } else {
        const id = await this.fs.createEvaluationTemplate(value);
        this.templates.push({ id, ...value });
      }
      this.newTemplate();
      await this.loadTemplates();
    } finally { this.savingTemplate = false; }
  }

  async deleteTemplate(t: EvaluationTemplate) {
    if (!t.id) return;
    if (!confirm('Delete template?')) return;
    await this.fs.deleteEvaluationTemplate(t.id);
    this.templates = this.templates.filter(x => x.id !== t.id);
  }

  // Notifications (stub - would persist to collection "settings")
  async saveNotifications() {
    if (this.notificationForm.invalid) { this.notificationForm.markAllAsTouched(); return; }
    this.savingNotifications = true;
    // Placeholder persistence - to be implemented as Firestore document if needed
    setTimeout(()=> this.savingNotifications = false, 600);
  }
}
