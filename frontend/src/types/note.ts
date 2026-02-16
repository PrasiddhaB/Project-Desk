/**
 * Note Types
 */

export type NoteStatus = 'not-started' | 'pending' | 'completed';

export interface NoteShare {
  id: number;
  note_id: number;
  shared_by: number;
  shared_by_name: string;
  shared_with: number;
  shared_with_name: string;
  can_edit: boolean;
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  user: number;
  owner_name?: string;
  status: NoteStatus;
  pinned: boolean;
  is_private: boolean;
  shares?: NoteShare[];
  share_count?: number;
  can_edit?: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteFormData {
  title: string;
  content: string;
  status: NoteStatus;
  pinned: boolean;
  is_private: boolean;
}

export interface NoteShareFormData {
  shared_with: number;
  can_edit: boolean;
}

export const NOTE_STATUS_OPTIONS: { value: NoteStatus; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];