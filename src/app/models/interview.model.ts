export interface Candidate {
  id?: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: number;
  resumeUrl?: string;
  createdAt: Date;
  status: CandidateStatus;
  currentStage: InterviewStage;
}

export interface InterviewEvaluation {
  id?: string;
  candidateId: string;
  candidateName: string;
  position: string;
  stage: InterviewStage;
  interviewerId: string;
  interviewerName: string;
  completedAt?: Date;
  isCompleted: boolean;
  
  // Common fields for all stages
  overallRating: number; // 1-5 scale
  recommendation: Recommendation;
  comments: string;
  strengths: string[];
  areasForImprovement: string[];
  
  // Stage-specific evaluations
  initialForm?: InitialFormEvaluation;
  systemTask?: SystemTaskEvaluation;
  technicalInterview?: TechnicalInterviewEvaluation;
  managerInterview?: ManagerInterviewEvaluation;
  hrInterview?: HRInterviewEvaluation;
}

export interface InitialFormEvaluation {
  eligibilityCheck: boolean;
  resumeQuality: number; // 1-5
  experienceMatch: number; // 1-5
  educationMatch: number; // 1-5
  documentationComplete: boolean;
  backgroundVerified: boolean;
}

export interface SystemTaskEvaluation {
  taskType: 'coding' | 'case-study' | 'design' | 'other';
  taskDescription: string;
  completionTime: number; // in minutes
  codeQuality?: number; // 1-5
  problemSolvingApproach: number; // 1-5
  creativity: number; // 1-5
  testCases?: number; // number of test cases passed
  totalTestCases?: number;
  submissionUrl?: string;
}

export interface TechnicalInterviewEvaluation {
  technicalSkills: number; // 1-5
  problemSolvingAbility: number; // 1-5
  codingSkills: number; // 1-5
  systemDesignSkills: number; // 1-5
  architecturalKnowledge: number; // 1-5
  communicationDuringTechnical: number; // 1-5
  questionAsked: string[];
  solutionsProvided: string[];
  technicalChallenges: string[];
}

export interface ManagerInterviewEvaluation {
  leadershipPotential: number; // 1-5
  teamFit: number; // 1-5
  decisionMakingAbility: number; // 1-5
  domainExpertise: number; // 1-5
  projectManagementSkills: number; // 1-5
  strategicThinking: number; // 1-5
  conflictResolution: number; // 1-5
  pastProjectsDiscussion: string;
  leadershipExamples: string;
}

export interface HRInterviewEvaluation {
  cultureFit: number; // 1-5
  communicationSkills: number; // 1-5
  motivation: number; // 1-5
  careerAspiration: string;
  salaryExpectation: number;
  negotiatedSalary?: number;
  availabilityToJoin: string;
  workFromHomePreference: string;
  relocatationWillingness: boolean;
  backgroundCheck: boolean;
  referenceCheck: boolean;
}

export interface ConsolidatedReport {
  candidateId: string;
  candidateName: string;
  position: string;
  
  // Stage completion status
  stageStatus: {
    [K in InterviewStage]: {
      completed: boolean;
      rating?: number;
      status: 'pass' | 'fail' | 'pending';
      completedAt?: Date;
      interviewerName?: string;
    }
  };
  
  // Overall metrics
  overallScore: number;
  weightedScore: number;
  finalDecision: FinalDecision;
  decisionMadeBy: string;
  decisionDate?: Date;
  
  // Summary
  totalInterviewTime: number; // in minutes
  keyStrengths: string[];
  keyWeaknesses: string[];
  recommendationSummary: string;
  
  // All evaluations
  evaluations: InterviewEvaluation[];
}

export interface HRDashboardMetrics {
  totalCandidates: number;
  interviewsScheduled: number;
  interviewsCompleted: number;
  
  // Stage-wise statistics
  stageStats: {
    [K in InterviewStage]: {
      total: number;
      completed: number;
      passed: number;
      failed: number;
      averageRating: number;
      averageTime: number;
    }
  };
  
  // Overall statistics
  overallPassRate: number;
  averageTimePerStage: number;
  candidateFunnelData: FunnelData[];
  
  // Interviewer performance
  interviewerStats: InterviewerStats[];
  
  // Time-based metrics
  monthlyHiringTrends: MonthlyTrend[];
  positionWiseStats: PositionStats[];
}

export interface FunnelData {
  stage: InterviewStage;
  candidateCount: number;
  dropOffRate: number;
}

export interface InterviewerStats {
  interviewerId: string;
  interviewerName: string;
  totalInterviews: number;
  averageRating: number;
  consistency: number; // rating consistency score
  averageTime: number;
  specialization: InterviewStage[];
}

export interface MonthlyTrend {
  month: string;
  year: number;
  totalCandidates: number;
  hired: number;
  rejected: number;
  averageTime: number;
}

export interface PositionStats {
  position: string;
  totalCandidates: number;
  hired: number;
  averageRating: number;
  mostCommonFailureStage: InterviewStage;
}

export interface EvaluationTemplate {
  id?: string;
  name: string;
  position: string;
  stage: InterviewStage;
  weightings: StageWeightings;
  customQuestions: CustomQuestion[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface StageWeightings {
  initial: number;
  systemTask: number;
  technical: number;
  manager: number;
  hr: number;
}

export interface CustomQuestion {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'boolean' | 'multiple-choice';
  options?: string[];
  required: boolean;
  weightage: number;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  canInterviewFor: InterviewStage[];
  createdAt: Date;
  isActive: boolean;
}

export interface AuditLog {
  id?: string;
  action: string;
  performedBy: string;
  performedByName: string;
  targetId: string;
  targetType: 'candidate' | 'evaluation' | 'user';
  changes: any;
  timestamp: Date;
}

// Enums
export enum InterviewStage {
  INITIAL = 'initial',
  SYSTEM_TASK = 'system-task',
  TECHNICAL = 'technical',
  MANAGER = 'manager',
  HR = 'hr'
}

export enum CandidateStatus {
  APPLIED = 'applied',
  IN_PROGRESS = 'in-progress',
  HIRED = 'hired',
  REJECTED = 'rejected',
  ON_HOLD = 'on-hold'
}

export enum Recommendation {
  STRONG_HIRE = 'strong-hire',
  HIRE = 'hire',
  NO_HIRE = 'no-hire',
  STRONG_NO_HIRE = 'strong-no-hire'
}

export enum FinalDecision {
  HIRED = 'hired',
  REJECTED = 'rejected',
  ON_HOLD = 'on-hold',
  PENDING = 'pending'
}

export enum UserRole {
  ADMIN = 'admin',
  HR = 'hr',
  INTERVIEWER = 'interviewer',
  MANAGER = 'manager'
}

// Utility types
export interface SelectOption {
  value: string;
  label: string;
}

export interface ChartData {
  labels: string[];
  datasets: any[];
}

export interface NotificationConfig {
  reminderDays: number;
  escalationDays: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
}