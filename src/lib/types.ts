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
