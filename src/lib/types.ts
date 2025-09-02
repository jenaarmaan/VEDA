
export type UserRole = 'general_user' | 'govt_admin' | 'agency_head' | 'department_head' | 'agency_employee' | 'state_officer';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  age: number;
  contact: string;
  address: string;
  location: string; // Represents the agency for agency members
  department?: string; // For department heads and employees
}

export interface Report {
    id: string;
    reportId: string;
    submittedBy: string;
    contentType: 'text' | 'link' | 'image' | 'video' | 'document';
    contentData: string;
    location: string; // The location/agency of the user who submitted the report
    notes?: string;
    aiVerdict: 'Fake' | 'True' | 'Unverifiable';
    aiConfidenceScore: number;
    sources: string[];
    justification: string;
    status: 'Queued' | 'Verified' | 'Re-Verification' | 'Under Review' | 'Cleared';
    createdAt: number; // Storing as a timestamp (Date.now())
}

export interface Task {
    id: string;
    taskId: string;
    reportId: string;
    assignedBy: string;
    assignedTo: string;
    agency: string;
    department: string;
    status: 'Pending' | 'In Progress' | 'Resolved';
    notes?: string;
    evidenceLinks?: string[];
    createdAt: number;
    updatedAt: number;
}

export interface AuditLog {
    id: string;
    actorId: string;
    actionType: string;
    timestamp: { seconds: number, nanoseconds: number };
    details: Record<string, any>;
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    isRead: boolean;
    createdAt: number;
    link?: string; // Optional link to the relevant page (e.g., task details)
}
