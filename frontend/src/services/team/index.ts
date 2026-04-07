/**
 * Team API Service
 */

import client from '@/services/http/client';
import { User } from '@/types';

interface TeamMember {
  id: number;
  full_name: string;
  username: string;
  profile_pic_url?: string;
  is_online?: boolean;
}

export interface TeamGroup {
  id: number;
  name: string;
  description?: string;
  color: string;
  member_count: number;
  members: TeamMember[];
  created_at: string;
}

interface TeamResponse {
  success: boolean;
  count: number;
  online_count: number;
  data: User[];
}

export const teamApi = {
  async getTeam(search?: string, role?: string): Promise<TeamResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    const q = params.toString();
    const url = q ? `/auth/team/?${q}` : '/auth/team/';
    const response = await client.get<TeamResponse>(url);
    return response.data;
  },

  // Team Groups
  async getTeamGroups(): Promise<TeamGroup[]> {
    const response = await client.get('/auth/teams/');
    return response.data.data;
  },

  async createTeamGroup(data: { name: string; description?: string; color?: string; member_ids?: number[] }): Promise<any> {
    const response = await client.post('/auth/teams/', data);
    return response.data;
  },

  async updateTeamGroup(id: number, data: { name?: string; description?: string; color?: string; member_ids?: number[] }): Promise<any> {
    const response = await client.put(`/auth/teams/${id}/`, data);
    return response.data;
  },

  async deleteTeamGroup(id: number): Promise<void> {
    await client.delete(`/auth/teams/${id}/`);
  },
};

export default teamApi;
