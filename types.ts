
export const UserRole = {
  ADMIN: 'ADMIN',
  TRAINER: 'TRAINER',
  TRAINEE: 'TRAINEE'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  phoneNumber?: string;
  credits?: number;
}

export interface AttendanceClass {
  id: string;
  trainerId: string;
  name: string;
  date: string;
  time: string;
  location: string;
  maxCapacity: number;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  traineeId: string;
  timestamp: number;
  method: 'APP' | 'MANUAL';
  status: 'BOOKED' | 'ATTENDED' | 'WAITLISTED';
}

export interface PaymentRecord {
  id: string;
  traineeId: string;
  amount: number;
  credits: number;
  timestamp: number;
  status: 'SUCCESS' | 'PENDING';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
