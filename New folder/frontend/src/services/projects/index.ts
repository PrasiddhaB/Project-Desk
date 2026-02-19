/**
 * Projects API Service
 */

import client from '@/services/http/client';
import { Project, ProjectStatus } from '@/types';

interface ApiResponse<T> {
  message?: string;
  data: T;
  count?: number;
}

interface CreateProjectRequest {
  name: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  member_ids?: number[];
}

interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  member_ids?: number[];
}

interface MemberAction {
  user_ids: number[];
  action: 'add' | 'remove' | 'set';
}

export const projectApi = {
  async getProjects(status?: ProjectStatus): Promise<Project[]> {
    const params = status ? `?status=${status}` : '';
    const response = await client.get<Project[]>(`/projects/${params}`);
    return response.data;
  },

  async getProject(id: number): Promise<Project> {
    const response = await client.get<ApiResponse<Project>>(`/projects/${id}/`);
    return response.data.data || response.data;
  },

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await client.post<ApiResponse<Project>>('/projects/', data);
    return response.data.data;
  },

  async updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
    const response = await client.put<ApiResponse<Project>>(`/projects/${id}/`, data);
    return response.data.data;
  },

  async deleteProject(id: number): Promise<void> {
    await client.delete(`/projects/${id}/`);
  },

  async updateMembers(id: number, data: MemberAction): Promise<Project> {
    const response = await client.post<ApiResponse<Project>>(`/projects/${id}/members/`, data);
    return response.data.data;
  },

  async getMyProjects(): Promise<Project[]> {
    const response = await client.get<ApiResponse<Project[]>>('/projects/my-projects/');
    return response.data.data;
  },

  async getProjectTasks(id: number): Promise<any[]> {
    const response = await client.get<ApiResponse<any[]>>(`/projects/${id}/tasks/`);
    return response.data.data;
  },

  async getStats(): Promise<any> {
    const response = await client.get('/projects/stats/');
    return response.data;
  },
};

export default projectApi;
