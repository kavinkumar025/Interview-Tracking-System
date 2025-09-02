import { InterviewStage } from './interview.model';

// Represents an explicit rejection record separate from generic audit logs
export interface CandidateRejection {
  id?: string;
  candidateId: string;
  candidateName?: string;
  stage: InterviewStage;
  reason: string;
  rejectedAt: Date;
  rejectedBy: string;          // user id
  rejectedByName: string;      // user display name
}
