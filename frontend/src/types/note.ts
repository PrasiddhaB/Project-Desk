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
  color?: string | null;
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
  color?: string | null;
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

export const NOTE_COLORS: { value: string; label: string; bg: string; border: string }[] = [
  { value: '', label: 'None', bg: '', border: '' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-50', border: 'border-yellow-300' },
  { value: 'green', label: 'Green', bg: 'bg-green-50', border: 'border-green-300' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-50', border: 'border-blue-300' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-50', border: 'border-purple-300' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-50', border: 'border-pink-300' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-50', border: 'border-orange-300' },
  { value: 'red', label: 'Red', bg: 'bg-red-50', border: 'border-red-300' },
];