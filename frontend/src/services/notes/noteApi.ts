/**
 * Notes API Service
 * Handles all note-related API calls
 */

import client from '@/services/http/client';
import { Note, NoteStatus } from '@/types';

interface ApiResponse<T> {
  message?: string;
  data: T;
  count?: number;
}

interface CreateNoteRequest {
  title: string;
  content?: string;
  status?: NoteStatus;
  pinned?: boolean;
  is_private?: boolean;
}

interface UpdateNoteRequest {
  title?: string;
  content?: string;
  status?: NoteStatus;
  pinned?: boolean;
  is_private?: boolean;
}

interface ShareNoteRequest {
  shared_with: number;
  can_edit: boolean;
}

interface NoteFilters {
  status?: NoteStatus;
  is_private?: boolean;
  pinned?: boolean;
  search?: string;
}

export const noteApi = {
  /**
   * Get all notes (own + shared)
   */
  async getNotes(filters?: NoteFilters): Promise<Note[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.is_private !== undefined) params.append('is_private', String(filters.is_private));
    if (filters?.pinned !== undefined) params.append('pinned', String(filters.pinned));
    if (filters?.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = queryString ? `/notes/?${queryString}` : '/notes/';
    
    const response = await client.get<Note[]>(url);
    return response.data;
  },

  /**
   * Get single note by ID
   */
  async getNote(id: number): Promise<Note> {
    const response = await client.get<ApiResponse<Note>>(`/notes/${id}/`);
    return response.data.data || response.data;
  },

  /**
   * Create new note
   */
  async createNote(data: CreateNoteRequest): Promise<Note> {
    const response = await client.post<ApiResponse<Note>>('/notes/', data);
    return response.data.data;
  },

  /**
   * Update note
   */
  async updateNote(id: number, data: UpdateNoteRequest): Promise<Note> {
    const response = await client.put<ApiResponse<Note>>(`/notes/${id}/`, data);
    return response.data.data;
  },

  /**
   * Delete note
   */
  async deleteNote(id: number): Promise<void> {
    await client.delete(`/notes/${id}/`);
  },

  /**
   * Get user's own notes only
   */
  async getMyNotes(): Promise<Note[]> {
    const response = await client.get<ApiResponse<Note[]>>('/notes/my-notes/');
    return response.data.data;
  },

  /**
   * Get notes shared with user
   */
  async getSharedNotes(): Promise<Note[]> {
    const response = await client.get<ApiResponse<Note[]>>('/notes/shared/');
    return response.data.data;
  },

  /**
   * Get user's private notes
   */
  async getPrivateNotes(): Promise<Note[]> {
    const response = await client.get<ApiResponse<Note[]>>('/notes/private/');
    return response.data.data;
  },

  /**
   * Share note with another user
   */
  async shareNote(noteId: number, data: ShareNoteRequest): Promise<Note> {
    const response = await client.post<ApiResponse<Note>>(`/notes/${noteId}/share/`, data);
    return response.data.data;
  },

  /**
   * Remove share from user
   */
  async unshareNote(noteId: number, userId: number): Promise<void> {
    await client.delete(`/notes/${noteId}/unshare/${userId}/`);
  },
};

export default noteApi;
