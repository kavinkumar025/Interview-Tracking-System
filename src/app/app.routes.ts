import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'dashboard', 
    canActivate:[authGuard],
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  { 
    path: 'candidates', 
    canActivate:[authGuard],
    loadComponent: () => import('./components/candidate-list/candidate-list.component').then(m => m.CandidateListComponent)
  },
  { 
    path: 'candidate/register', 
    canActivate:[authGuard],
    loadComponent: () => import('./components/candidate-registration/candidate-registration.component').then(m => m.CandidateRegistrationComponent)
  },
  { 
    path: 'candidate/:id/report', 
    canActivate:[authGuard],
    loadComponent: () => import('./components/consolidated-report/consolidated-report.component').then(m => m.ConsolidatedReportComponent)
  },
  { 
    path: 'evaluation/initial/:candidateId', 
    canActivate:[authGuard],
    loadComponent: () => import('./components/initial-form/initial-form.component').then(m => m.InitialFormComponent)
  },
  { 
    path: 'evaluation/system-task/:candidateId', 
    canActivate:[authGuard],
    loadComponent: () => import('./components/system-task-form/system-task-form.component').then(m => m.SystemTaskFormComponent)
  },
  { 
    path: 'evaluation/technical/:candidateId', 
    canActivate:[authGuard],
    loadComponent: () => import('./components/technical-interview-form/technical-interview-form.component').then(m => m.TechnicalInterviewFormComponent)
  },
  { 
    path: 'evaluation/manager/:candidateId', 
    canActivate:[authGuard],
    loadComponent: () => import('./components/manager-interview-form/manager-interview-form.component').then(m => m.ManagerInterviewFormComponent)
  },
  { 
    path: 'evaluation/hr/:candidateId', 
    canActivate:[authGuard],
    loadComponent: () => import('./components/hr-interview-form/hr-interview-form.component').then(m => m.HrInterviewFormComponent)
  },
  { 
    path: 'hr-dashboard', 
    canActivate:[authGuard],
    loadComponent: () => import('./components/hr-dashboard/hr-dashboard.component').then(m => m.HrDashboardComponent)
  },
  { 
    path: 'admin/settings', 
    canActivate:[authGuard],
    loadComponent: () => import('./components/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent)
  },
  { path: '**', redirectTo: '/login' }
];
