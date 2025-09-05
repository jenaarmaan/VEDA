
import { FieldValue, Timestamp } from "firebase/firestore";

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

export interface Report {
    id: string;
    reportId: string;
    submittedBy: string; 
    contentType: 'text' | 'link' | 'image' | 'video' | 'document';
    contentData: string;
    location: string;
    notes: string;
    aiVerdict: 'True' | 'Fake' | 'Unverifiable';
    aiConfidenceScore: number;
    sources: string[];
    justification: string;
    status: 'Queued' | 'Under Review' | 'Verified' | 'Re-Verification' | 'Cleared';
    createdAt: number;
}


export interface Task {
    id: string;
    taskId: string;
    reportId: string;
    assignedBy: string;
    assignedTo: string;
    department: string;
    agency: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Escalated';
    notes: string;
    evidenceLinks: string[];
    createdAt: number;
    updatedAt: number;
}

export interface AuditLog {
    id: string;
    actorId: string;
    actionType: string;
    details: Record<string, any>;
    timestamp: Timestamp;
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    isRead: boolean;
    createdAt: number;
}

export interface ContactMessage {
    id?: string;
    userId?: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: FieldValue;
}
