
import { FieldValue } from "firebase/firestore";

export type UserRole = 'civic' | 'sentinel' | 'ground_sentinel' | 'council';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  details: {
    fullName: string;
    phone: string;
    city: string;
    ageGroup: '18-25' | '26-35' | '36-50' | '51+';
  };
  createdAt: FieldValue;
}

export interface CivicReport {
    id: string;
    submittedBy: string; // uid of civic user
    contentType: 'text' | 'image' | 'voice';
    contentData: string; // text or URL to media
    aiVerdict?: 'Verified' | 'Misleading' | 'Unverifiable';
    status: 'Submitted' | 'Under Review' | 'Closed';
    createdAt: FieldValue;
}

export interface SentinelCase {
    id: string;
    reportId: string; // from civic_reports
    assignedTo: string; // uid of sentinel or ground_sentinel
    status: 'New' | 'Investigation' | 'Resolved' | 'Escalated';
    notes: string;
    evidence: string[]; // URLs to evidence
    createdAt: FieldValue;
    updatedAt: FieldValue;
}

export interface CouncilLog {
    id: string;
    actorId: string; // uid of council member
    action: string; // e.g., 'viewed_case', 'generated_report'
    details: Record<string, any>;
    createdAt: FieldValue;
}
