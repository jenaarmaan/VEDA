export type UserRole = 'general_user' | 'govt_admin' | 'agency_head' | 'agency_employee';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  age: number;
  contact: string;
  address: string;
  location: string;
}

export interface Report {
    id: string;
    reportId: string;
    submittedBy: string;
    contentType: 'text' | 'link' | 'image' | 'video' | 'document';
    contentData: string;
    notes?: string;
    aiVerdict: 'Fake' | 'True' | 'Unverifiable';
    aiConfidenceScore: number;
    sources: string[];
    justification: string;
    status: 'Submitted' | 'Under Investigation' | 'Resolved';
    createdAt: number; // Firestore Timestamp
}
