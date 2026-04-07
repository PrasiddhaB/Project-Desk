/**
 * Profile API Service
 */

import client from '@/services/http/client';
import { User } from '@/types';

interface UpdateProfileRequest {
  full_name?: string;
  email?: string;
  phone?: string;
}

export const profileApi = {
  async getProfile(): Promise<User> {
    const response = await client.get('/auth/me/');
    return response.data.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await client.put('/auth/profile/', data);
    return response.data.data;
  },

  async uploadProfilePic(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('profile_pic', file);
    const response = await client.post('/auth/profile/picture/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  async removeProfilePic(): Promise<User> {
    const response = await client.delete('/auth/profile/picture/');
    return response.data.data;
  },
};

export default profileApi;
