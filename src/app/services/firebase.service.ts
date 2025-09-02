import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Observable, BehaviorSubject, from, map, switchMap } from 'rxjs';

import {
  Candidate,
  InterviewEvaluation,
  ConsolidatedReport,
  HRDashboardMetrics,
  User,
  AuditLog,
  EvaluationTemplate,
  InterviewStage,
  CandidateStatus,
  FinalDecision,
  UserRole
} from '../models/interview.model';
import { CandidateRejection } from '../models/rejection.model';

const firebaseConfig = {
  apiKey: "AIzaSyClqFEICeJQAKyzYP3jWRSx78u9Yw4tg1w",
  authDomain: "interview-evaluation-sys-5d095.firebaseapp.com",
  projectId: "interview-evaluation-sys-5d095",
  storageBucket: "interview-evaluation-sys-5d095.firebasestorage.app",
  messagingSenderId: "240867469944",
  appId: "1:240867469944:web:6138e968b36bbc8c5b5b8d",
  measurementId: "G-4YEVB1FRF6"
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(firebaseConfig);
  private db = getFirestore(this.app);
  private auth = getAuth(this.app);
  private storage = getStorage(this.app);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Monitor auth state changes
    this.auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await this.getUserById(firebaseUser.uid);
        this.currentUserSubject.next(userData);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  // Authentication methods
  async login(email: string, password: string): Promise<FirebaseUser> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    return result.user;
  }

  async register(email: string, password: string, userData: Partial<User>): Promise<void> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    await this.createUser({
      id: result.user.uid,
      email: email,
      ...userData
    } as User);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  // User management
  async createUser(user: User): Promise<string> {
    if(!user.id){
      throw new Error('User id (firebase uid) required');
    }
    const docRef = doc(this.db, 'users', user.id);
    await setDoc(docRef, {
      ...user,
      createdAt: Timestamp.now()
    });
    await this.logAction('create_user', user.id, 'user', user);
    return user.id;
  }

  async getUserById(id: string): Promise<User | null> {
    const docRef = doc(this.db, 'users', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  }

  async getAllUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(this.db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const docRef = doc(this.db, 'users', id);
    await updateDoc(docRef, updates as any);
    await this.logAction('update_user', id, 'user', updates);
  }

  // Evaluation template management
  async createEvaluationTemplate(tpl: EvaluationTemplate): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'evaluation_templates'), {
      ...tpl,
      createdAt: Timestamp.now()
    });
    await this.logAction('create_template', docRef.id, 'user', tpl);
    return docRef.id;
  }

  async getEvaluationTemplates(position?: string): Promise<EvaluationTemplate[]> {
    let col = collection(this.db, 'evaluation_templates');
    let qref = position ? query(col, where('position','==', position)) : col;
    const snap = await getDocs(qref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EvaluationTemplate));
  }

  async updateEvaluationTemplate(id: string, updates: Partial<EvaluationTemplate>): Promise<void> {
    const docRef = doc(this.db, 'evaluation_templates', id);
    await updateDoc(docRef, updates as any);
    await this.logAction('update_template', id, 'user', updates);
  }

  async deleteEvaluationTemplate(id: string): Promise<void> {
    const docRef = doc(this.db, 'evaluation_templates', id);
    await deleteDoc(docRef);
    await this.logAction('delete_template', id, 'user', {});
  }

  async rejectCandidate(candidateId: string, stage: InterviewStage, reason: string): Promise<void> {
    const candidate = await this.getCandidateById(candidateId);
  const currentUser = this.currentUserSubject.value;
    // Update candidate status
    await this.updateCandidate(candidateId, { status: CandidateStatus.REJECTED });
    // Create structured rejection record
    const rejection: CandidateRejection = {
      candidateId,
      candidateName: candidate?.name,
      stage,
      reason,
      rejectedAt: new Date(),
      rejectedBy: currentUser?.id || 'system',
      rejectedByName: currentUser?.name || 'System'
    };
    await addDoc(collection(this.db, 'candidate_rejections'), {
      ...rejection,
      rejectedAt: Timestamp.now()
    });
    await this.logAction('reject_candidate', candidateId, 'candidate', { stage, reason });
  }

  async getRejectionsForCandidate(candidateId: string): Promise<CandidateRejection[]> {
    const qref = query(collection(this.db, 'candidate_rejections'), where('candidateId','==', candidateId), orderBy('rejectedAt','desc'));
    const snap = await getDocs(qref);
    return snap.docs.map(d => ({ id: d.id, ...d.data(), rejectedAt: (d.data()['rejectedAt'] as Timestamp).toDate() }) as CandidateRejection);
  }

  // Candidate management
  async createCandidate(candidate: Candidate): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'candidates'), {
      ...candidate,
      createdAt: Timestamp.now()
    });
    await this.logAction('create_candidate', docRef.id, 'candidate', candidate);
    return docRef.id;
  }

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<void> {
    const docRef = doc(this.db, 'candidates', id);
    await updateDoc(docRef, updates);
    await this.logAction('update_candidate', id, 'candidate', updates);
  }

  async getCandidateById(id: string): Promise<Candidate | null> {
    const docRef = doc(this.db, 'candidates', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Candidate;
    }
    return null;
  }

  async getAllCandidates(): Promise<Candidate[]> {
    const querySnapshot = await getDocs(
      query(collection(this.db, 'candidates'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
  }

  async getCandidatesByStatus(status: CandidateStatus): Promise<Candidate[]> {
    const q = query(
      collection(this.db, 'candidates'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
  }

  async getCandidatesByPosition(position: string): Promise<Candidate[]> {
    const q = query(
      collection(this.db, 'candidates'),
      where('position', '==', position),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
  }

  // Interview Evaluation management
  async createEvaluation(evaluation: InterviewEvaluation): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'evaluations'), {
      ...evaluation,
      completedAt: evaluation.isCompleted ? Timestamp.now() : null
    });
    await this.logAction('create_evaluation', docRef.id, 'evaluation', evaluation);
    
    // Update candidate stage if evaluation is completed
    if (evaluation.isCompleted) {
      await this.updateCandidateStage(evaluation.candidateId, evaluation.stage);
    }
    
    return docRef.id;
  }

  async updateEvaluation(id: string, updates: Partial<InterviewEvaluation>): Promise<void> {
    const docRef = doc(this.db, 'evaluations', id);
    const updateData = {
      ...updates,
      completedAt: updates.isCompleted ? Timestamp.now() : null
    };
    await updateDoc(docRef, updateData);
    await this.logAction('update_evaluation', id, 'evaluation', updates);
  }

  async getEvaluationById(id: string): Promise<InterviewEvaluation | null> {
    const docRef = doc(this.db, 'evaluations', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as InterviewEvaluation;
    }
    return null;
  }

  async getEvaluationsByCandidateId(candidateId: string): Promise<InterviewEvaluation[]> {
    const q = query(
      collection(this.db, 'evaluations'),
      where('candidateId', '==', candidateId),
      orderBy('completedAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InterviewEvaluation));
  }

  async getCandidateEvaluationFlow(candidateId: string): Promise<InterviewEvaluation[]> {
    const evs = await this.getEvaluationsByCandidateId(candidateId);
    // ensure ordered by stage logical order if timestamps missing
    const order = [InterviewStage.INITIAL, InterviewStage.SYSTEM_TASK, InterviewStage.TECHNICAL, InterviewStage.MANAGER, InterviewStage.HR];
    return evs.sort((a,b)=>{
      const ta = (a as any).completedAt?.toDate ? (a as any).completedAt.toDate().getTime():0;
      const tb = (b as any).completedAt?.toDate ? (b as any).completedAt.toDate().getTime():0;
      if(ta && tb) return ta - tb;
      return order.indexOf(a.stage) - order.indexOf(b.stage);
    });
  }

  async getEvaluationsByStage(stage: InterviewStage): Promise<InterviewEvaluation[]> {
    const q = query(
      collection(this.db, 'evaluations'),
      where('stage', '==', stage),
      orderBy('completedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InterviewEvaluation));
  }

  async getEvaluationsByInterviewer(interviewerId: string): Promise<InterviewEvaluation[]> {
    const q = query(
      collection(this.db, 'evaluations'),
      where('interviewerId', '==', interviewerId),
      orderBy('completedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InterviewEvaluation));
  }

  // Consolidated Report generation
  async generateConsolidatedReport(candidateId: string): Promise<ConsolidatedReport> {
    const candidate = await this.getCandidateById(candidateId);
    const evaluations = await this.getEvaluationsByCandidateId(candidateId);
    
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    const stageStatus: any = {};
    let totalScore = 0;
    let completedStages = 0;
    const keyStrengths: string[] = [];
    const keyWeaknesses: string[] = [];

    // Process each stage
    Object.values(InterviewStage).forEach(stage => {
      const stageEvaluation = evaluations.find(e => e.stage === stage);
      
      stageStatus[stage] = {
        completed: !!stageEvaluation?.isCompleted,
        rating: stageEvaluation?.overallRating,
        status: stageEvaluation ? this.getStageStatus(stageEvaluation.overallRating) : 'pending',
        completedAt: stageEvaluation?.completedAt,
        interviewerName: stageEvaluation?.interviewerName
      };

      if (stageEvaluation?.isCompleted) {
        totalScore += stageEvaluation.overallRating;
        completedStages++;
        keyStrengths.push(...stageEvaluation.strengths);
        keyWeaknesses.push(...stageEvaluation.areasForImprovement);
      }
    });

    const overallScore = completedStages > 0 ? totalScore / completedStages : 0;
    const weightedScore = this.calculateWeightedScore(evaluations);

    const report: ConsolidatedReport = {
      candidateId,
      candidateName: candidate.name,
      position: candidate.position,
      stageStatus,
      overallScore,
      weightedScore,
      finalDecision: this.determineFinalDecision(overallScore, completedStages),
      decisionMadeBy: this.currentUserSubject.value?.name || 'System',
      decisionDate: new Date(),
      totalInterviewTime: this.calculateTotalInterviewTime(evaluations),
      keyStrengths: [...new Set(keyStrengths)],
      keyWeaknesses: [...new Set(keyWeaknesses)],
      recommendationSummary: this.generateRecommendationSummary(evaluations, overallScore),
      evaluations
    };

    return report;
  }

  // HR Dashboard metrics
  async getHRDashboardMetrics(): Promise<HRDashboardMetrics> {
    const candidates = await this.getAllCandidates();
    const evaluations = await this.getAllEvaluations();
    
    const totalCandidates = candidates.length;
    const interviewsScheduled = evaluations.length;
    const interviewsCompleted = evaluations.filter(e => e.isCompleted).length;

    // Calculate stage-wise statistics
    const stageStats: any = {};
    Object.values(InterviewStage).forEach(stage => {
      const stageEvaluations = evaluations.filter(e => e.stage === stage);
      const completedStageEvaluations = stageEvaluations.filter(e => e.isCompleted);
      const passedEvaluations = completedStageEvaluations.filter(e => e.overallRating >= 3);

      stageStats[stage] = {
        total: stageEvaluations.length,
        completed: completedStageEvaluations.length,
        passed: passedEvaluations.length,
        failed: completedStageEvaluations.length - passedEvaluations.length,
        averageRating: this.calculateAverageRating(completedStageEvaluations),
        averageTime: this.calculateAverageTime(completedStageEvaluations)
      };
    });

    const overallPassRate = this.calculateOverallPassRate(evaluations);
    const candidateFunnelData = this.generateFunnelData(candidates, evaluations);
    const interviewerStats = await this.generateInterviewerStats(evaluations);
    const monthlyHiringTrends = this.generateMonthlyTrends(candidates);
    const positionWiseStats = this.generatePositionStats(candidates, evaluations);

    return {
      totalCandidates,
      interviewsScheduled,
      interviewsCompleted,
      stageStats,
      overallPassRate,
      averageTimePerStage: this.calculateAverageTimePerStage(evaluations),
      candidateFunnelData,
      interviewerStats,
      monthlyHiringTrends,
      positionWiseStats
    };
  }

  // File upload
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  // Audit logging
  private async logAction(action: string, targetId: string, targetType: 'candidate' | 'evaluation' | 'user', changes: any): Promise<void> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) return;

    const auditLog: AuditLog = {
      action,
      performedBy: currentUser.id || '',
      performedByName: currentUser.name,
      targetId,
      targetType,
      changes,
      timestamp: new Date()
    };

    await addDoc(collection(this.db, 'audit_logs'), {
      ...auditLog,
      timestamp: Timestamp.now()
    });
  }

  // Helper methods
  private async updateCandidateStage(candidateId: string, completedStage: InterviewStage): Promise<void> {
    const stageOrder = [
      InterviewStage.INITIAL,
      InterviewStage.SYSTEM_TASK,
      InterviewStage.TECHNICAL,
      InterviewStage.MANAGER,
      InterviewStage.HR
    ];
    
    const currentStageIndex = stageOrder.indexOf(completedStage);
    const nextStage = stageOrder[currentStageIndex + 1];
    
    const updates: Partial<Candidate> = {
      currentStage: nextStage || completedStage,
      status: nextStage ? CandidateStatus.IN_PROGRESS : CandidateStatus.IN_PROGRESS
    };

    await this.updateCandidate(candidateId, updates);
  }

  private getStageStatus(rating: number): 'pass' | 'fail' | 'pending' {
    if (rating >= 3) return 'pass';
    if (rating < 3) return 'fail';
    return 'pending';
  }

  private calculateWeightedScore(evaluations: InterviewEvaluation[]): number {
    const weights = {
      [InterviewStage.INITIAL]: 0.1,
      [InterviewStage.SYSTEM_TASK]: 0.2,
      [InterviewStage.TECHNICAL]: 0.4,
      [InterviewStage.MANAGER]: 0.2,
      [InterviewStage.HR]: 0.1
    };

    let weightedSum = 0;
    let totalWeight = 0;

    evaluations.forEach(evaluation => {
      if (evaluation.isCompleted) {
        const weight = weights[evaluation.stage];
        weightedSum += evaluation.overallRating * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private determineFinalDecision(overallScore: number, completedStages: number): FinalDecision {
    if (completedStages < 3) return FinalDecision.PENDING;
    if (overallScore >= 4) return FinalDecision.HIRED;
    if (overallScore >= 3) return FinalDecision.ON_HOLD;
    return FinalDecision.REJECTED;
  }

  private calculateTotalInterviewTime(evaluations: InterviewEvaluation[]): number {
    // This would be implemented based on actual interview duration tracking
    return evaluations.length * 60; // Placeholder: 60 minutes per interview
  }

  private generateRecommendationSummary(evaluations: InterviewEvaluation[], overallScore: number): string {
    const completedEvaluations = evaluations.filter(e => e.isCompleted);
    if (completedEvaluations.length === 0) return 'No evaluations completed yet.';

    if (overallScore >= 4) {
      return 'Strong candidate with excellent performance across all stages. Recommended for hire.';
    } else if (overallScore >= 3) {
      return 'Good candidate with solid performance. Consider for hire based on team needs.';
    } else {
      return 'Candidate did not meet the required standards. Not recommended for hire.';
    }
  }

  private async getAllEvaluations(): Promise<InterviewEvaluation[]> {
    const querySnapshot = await getDocs(collection(this.db, 'evaluations'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InterviewEvaluation));
  }

  private calculateAverageRating(evaluations: InterviewEvaluation[]): number {
    if (evaluations.length === 0) return 0;
    const sum = evaluations.reduce((acc, e) => acc + e.overallRating, 0);
    return sum / evaluations.length;
  }

  private calculateAverageTime(evaluations: InterviewEvaluation[]): number {
    // Placeholder implementation
    return 60; // 60 minutes average
  }

  private calculateOverallPassRate(evaluations: InterviewEvaluation[]): number {
    const completed = evaluations.filter(e => e.isCompleted);
    if (completed.length === 0) return 0;
    const passed = completed.filter(e => e.overallRating >= 3);
    return (passed.length / completed.length) * 100;
  }

  private generateFunnelData(candidates: Candidate[], evaluations: InterviewEvaluation[]): any[] {
    // Build funnel based on stage order and how many candidates reached/completed each stage
    const stageOrder: InterviewStage[] = [
      InterviewStage.INITIAL,
      InterviewStage.SYSTEM_TASK,
      InterviewStage.TECHNICAL,
      InterviewStage.MANAGER,
      InterviewStage.HR
    ];

    const result: any[] = [];
    let previousCount: number | null = null;

    stageOrder.forEach(stage => {
      // Count candidates whose currentStage is at or beyond this stage OR have an evaluation for it
      const reached = candidates.filter(c => {
        // Determine index comparison
        const idxCandidate = stageOrder.indexOf(c.currentStage as InterviewStage);
        const idxStage = stageOrder.indexOf(stage);
        if (idxCandidate >= idxStage) return true;
        // Or evaluation exists for that stage
        return evaluations.some(e => e.candidateId === c.id && e.stage === stage);
      }).length;

      const dropOffRate = previousCount ? (previousCount === 0 ? 0 : ((previousCount - reached) / previousCount) * 100) : 0;
      result.push({ stage, candidateCount: reached, dropOffRate });
      previousCount = reached;
    });
    return result;
  }

  private async generateInterviewerStats(evaluations: InterviewEvaluation[]): Promise<any[]> {
    const byInterviewer: Record<string, InterviewEvaluation[]> = {};
    evaluations.filter(e=> e.interviewerId).forEach(e => {
      byInterviewer[e.interviewerId] = byInterviewer[e.interviewerId] || []; byInterviewer[e.interviewerId].push(e);
    });
    const stats: any[] = [];
    Object.keys(byInterviewer).forEach(interviewerId => {
      const evs = byInterviewer[interviewerId];
      const completed = evs.filter(e=> e.isCompleted);
      if (!completed.length) return;
      const avg = completed.reduce((a,b)=> a + b.overallRating,0)/completed.length;
      // Consistency: standard deviation (lower is better) convert to 0-1 scale
      const variance = completed.reduce((a,b)=> a + Math.pow(b.overallRating - avg,2),0)/completed.length;
      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 1 - (stdDev / 5));
      const specialization = [...new Set(completed.map(e=> e.stage))];
      stats.push({
        interviewerId,
        interviewerName: completed[0].interviewerName || 'N/A',
        totalInterviews: completed.length,
        averageRating: +avg.toFixed(2),
        consistency: +(consistency*100).toFixed(1),
        averageTime: 60, // placeholder
        specialization
      });
    });
    // Sort by total interviews desc
    return stats.sort((a,b)=> b.totalInterviews - a.totalInterviews).slice(0,10);
  }

  private generateMonthlyTrends(candidates: Candidate[]): any[] {
    const map: Record<string, { month:string; year:number; totalCandidates:number; hired:number; rejected:number; averageTime:number; } > = {};
    candidates.forEach(c => {
      const d = (c as any).createdAt?.toDate ? (c as any).createdAt.toDate() : c.createdAt instanceof Date ? c.createdAt : new Date();
      const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      if(!map[key]) map[key] = { month: d.toLocaleString('default',{month:'short'}), year:d.getFullYear(), totalCandidates:0, hired:0, rejected:0, averageTime:0 };
      map[key].totalCandidates++;
      if(c.status === CandidateStatus.HIRED) map[key].hired++;
      if(c.status === CandidateStatus.REJECTED) map[key].rejected++;
    });
    return Object.values(map).sort((a,b)=> (a.year===b.year? a.month.localeCompare(b.month): a.year - b.year));
  }

  private generatePositionStats(candidates: Candidate[], evaluations: InterviewEvaluation[]): any[] {
    const byPosition: Record<string, Candidate[]> = {};
    candidates.forEach(c => { byPosition[c.position] = byPosition[c.position] || []; byPosition[c.position].push(c); });
    const stats: any[] = [];
    Object.keys(byPosition).forEach(position => {
      const cands = byPosition[position];
      const hired = cands.filter(c=> c.status === CandidateStatus.HIRED).length;
      // Average rating across completed evaluations for these candidates
      const candIds = new Set(cands.map(c=> c.id));
      const evs = evaluations.filter(e=> candIds.has(e.candidateId) && e.isCompleted);
      const avgRating = evs.length? evs.reduce((a,b)=> a + b.overallRating,0)/evs.length : 0;
      // Determine most common failure stage
      const failures: Record<string, number> = {};
      evs.filter(e=> e.overallRating < 3).forEach(e=> { failures[e.stage] = (failures[e.stage]||0)+1; });
      const mostCommonFailureStage = Object.keys(failures).sort((a,b)=> failures[b]-failures[a])[0] || null;
      stats.push({ position, totalCandidates: cands.length, hired, averageRating:+avgRating.toFixed(2), mostCommonFailureStage });
    });
    return stats.sort((a,b)=> b.totalCandidates - a.totalCandidates).slice(0,10);
  }

  private calculateAverageTimePerStage(evaluations: InterviewEvaluation[]): number {
    // Placeholder implementation
    return 60;
  }
}