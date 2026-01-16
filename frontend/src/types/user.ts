/**
 * User Types
 */

export type UserRole = 'admin' | 'employee';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  password?: string;
  role: UserRole;
}