/**
 * Mock Users Data
 */

import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@projectdesk.com',
    full_name: 'Darshan Admin',
    phone: '9841234567',
    role: 'admin',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'abiral',
    email: 'abiral@projectdesk.com',
    full_name: 'Abiral Sharma',
    phone: '9841234568',
    role: 'employee',
    is_active: true,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
  {
    id: 3,
    username: 'samprada',
    email: 'samprada@projectdesk.com',
    full_name: 'Samprada Thapa',
    phone: '9841234569',
    role: 'employee',
    is_active: true,
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2025-01-03T00:00:00Z',
  },
  {
    id: 4,
    username: 'rajesh',
    email: 'rajesh@projectdesk.com',
    full_name: 'Rajesh Hamal',
    phone: '9841234570',
    role: 'employee',
    is_active: true,
    created_at: '2025-01-04T00:00:00Z',
    updated_at: '2025-01-04T00:00:00Z',
  },
  {
    id: 5,
    username: 'priya',
    email: 'priya@projectdesk.com',
    full_name: 'Priya Gurung',
    phone: '9841234571',
    role: 'employee',
    is_active: true,
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-05T00:00:00Z',
  },
  {
    id: 6,
    username: 'bikas',
    email: 'bikas@projectdesk.com',
    full_name: 'Bikas Tamang',
    phone: '9841234572',
    role: 'employee',
    is_active: false,
    created_at: '2025-01-06T00:00:00Z',
    updated_at: '2025-01-06T00:00:00Z',
  },
];

export const getEmployees = (): User[] => {
  return mockUsers.filter(user => user.role === 'employee');
};

export const getAdmins = (): User[] => {
  return mockUsers.filter(user => user.role === 'admin');
};

export const getUserById = (id: number): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getUserByUsername = (username: string): User | undefined => {
  return mockUsers.find(user => user.username === username);
};