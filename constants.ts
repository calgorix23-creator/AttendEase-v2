
import { UserRole, User } from './types.ts';

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'admin@test.com', name: 'System Admin', role: UserRole.ADMIN, phoneNumber: '+1 555-1100', password: 'password123', credits: 0 },
  { id: 'u2', email: 'trainer@test.com', name: 'John Trainer', role: UserRole.TRAINER, phoneNumber: '+1 555-1101', password: 'password123', credits: 0 },
  { id: 'u3', email: 'trainee@test.com', name: 'Alice Trainee', role: UserRole.TRAINEE, phoneNumber: '+1 555-1102', password: 'password123', credits: 10 },
];

export const MOCK_PACKAGES = [
  { id: 'p1', name: 'Starter Pack', credits: 5, price: 50 },
  { id: 'p2', name: 'Value Pack', credits: 12, price: 100 },
  { id: 'p3', name: 'Pro Pack', credits: 30, price: 220 },
];

export const APP_STORAGE_KEY = 'attendease_full_v1';
