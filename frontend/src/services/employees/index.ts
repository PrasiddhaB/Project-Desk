/**
 * Employees API Service (uses /auth/users endpoint)
 */

import client from '@/services/http/client';
import { User } from '@/types';

export const employeeApi = {
  async getEmployees(): Promise<User[]> {
    const response = await client.get('/auth/users/');
    return response.data.data || response.data;
  },

  async getEmployee(id: number): Promise<User> {
    // Uses same users endpoint but filter by ID
    const users = await this.getEmployees();
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('Employee not found');
    return user;
  },
};

export default employeeApi;
