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
  profile_pic?: string;
  profile_pic_url?: string;
  is_online?: boolean;
  last_active?: string;
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