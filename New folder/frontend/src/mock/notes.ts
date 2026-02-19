/**
 * Mock Notes Data
 */

import { Note, NoteStatus } from '@/types';

export const mockNotes: Note[] = [
  {
    id: 1,
    title: 'Welcome Note',
    content: 'Welcome to your personal notes! This is a sample note to help you get started with the notes feature.',
    user_id: 2,
    owner_name: 'Abiral Sharma',
    status: 'completed',
    pinned: true,
    is_private: false,
    can_edit: true,
    created_at: '2026-01-04T08:39:04Z',
    updated_at: '2026-01-04T08:40:48Z',
  },
  {
    id: 2,
    title: 'Project Ideas',
    content: `<p>List of potential project ideas:</p>
<ul>
<li>Task management system</li>
<li>Personal blog platform</li>
<li>E-commerce website</li>
<li>Social media dashboard</li>
</ul>`,
    user_id: 3,
    owner_name: 'Samprada Thapa',
    status: 'pending',
    pinned: false,
    is_private: false,
    can_edit: true,
    created_at: '2026-01-04T08:39:04Z',
    updated_at: '2026-01-04T08:39:04Z',
  },
  {
    id: 3,
    title: 'Meeting Notes - Sprint Planning',
    content: `<p>Key points from team meeting:</p>
<ul>
<li>Discussed project timeline</li>
<li>Assigned tasks to team members</li>
<li>Set next meeting date for Friday</li>
<li>Review UI mockups by end of week</li>
</ul>`,
    user_id: 1,
    owner_name: 'Darshan Admin',
    status: 'completed',
    pinned: false,
    is_private: false,
    can_edit: true,
    created_at: '2026-01-04T08:39:04Z',
    updated_at: '2026-01-07T08:27:39Z',
  },
  {
    id: 4,
    title: 'UI/UX Design Principles',
    content: `<p><strong>Following UI design best practices makes digital products easier for everyone to use:</strong></p>
<ol>
<li><strong>Enhances usability</strong> - Think of a user as someone asking directions</li>
<li><strong>Improves decision-making</strong> - Clear and consistent UI design principles give a structured framework</li>
<li><strong>Increases efficiency</strong> - Aligning UI design principles at the start streamlines workflows</li>
<li><strong>Reduces cognitive load</strong> - A well-designed interface simplifies tasks</li>
</ol>`,
    user_id: 1,
    owner_name: 'Darshan Admin',
    status: 'completed',
    pinned: true,
    is_private: false,
    can_edit: true,
    created_at: '2026-01-17T08:03:49Z',
    updated_at: '2026-01-17T09:10:29Z',
  },
  {
    id: 5,
    title: 'Personal Todo List',
    content: `<p>Things to do this week:</p>
<ul>
<li>Complete project documentation</li>
<li>Review pull requests</li>
<li>Update dependencies</li>
<li>Team sync meeting</li>
</ul>`,
    user_id: 2,
    owner_name: 'Abiral Sharma',
    status: 'not-started',
    pinned: false,
    is_private: true,
    can_edit: true,
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 6,
    title: 'API Endpoints Reference',
    content: `<p><strong>Authentication Endpoints:</strong></p>
<ul>
<li>POST /api/auth/login - User login</li>
<li>POST /api/auth/register - User registration</li>
<li>POST /api/auth/logout - User logout</li>
<li>GET /api/auth/me - Get current user</li>
</ul>
<p><strong>Task Endpoints:</strong></p>
<ul>
<li>GET /api/tasks - List all tasks</li>
<li>POST /api/tasks - Create task</li>
<li>GET /api/tasks/:id - Get task detail</li>
<li>PUT /api/tasks/:id - Update task</li>
<li>DELETE /api/tasks/:id - Delete task</li>
</ul>`,
    user_id: 3,
    owner_name: 'Samprada Thapa',
    status: 'pending',
    pinned: true,
    is_private: false,
    can_edit: true,
    created_at: '2026-01-08T14:00:00Z',
    updated_at: '2026-01-12T09:00:00Z',
  },
  {
    id: 7,
    title: 'Bug Fixes Tracker',
    content: `<p>Bugs to fix:</p>
<ol>
<li>Login redirect not working properly</li>
<li>Dashboard stats not updating</li>
<li>Mobile menu overlapping</li>
<li>Date picker timezone issue</li>
</ol>`,
    user_id: 4,
    owner_name: 'Rajesh Hamal',
    status: 'pending',
    pinned: false,
    is_private: false,
    can_edit: true,
    created_at: '2026-01-11T11:00:00Z',
    updated_at: '2026-01-13T08:00:00Z',
  },
  {
    id: 8,
    title: 'Private Research Notes',
    content: `<p>Research on authentication methods:</p>
<ul>
<li>JWT vs Session-based auth</li>
<li>OAuth 2.0 implementation</li>
<li>Security best practices</li>
</ul>`,
    user_id: 2,
    owner_name: 'Abiral Sharma',
    status: 'pending',
    pinned: false,
    is_private: true,
    can_edit: true,
    created_at: '2026-01-09T15:00:00Z',
    updated_at: '2026-01-09T15:00:00Z',
  },
];

export const mockSharedNotes = [
  {
    id: 1,
    note_id: 3,
    shared_by: 1,
    shared_by_name: 'Darshan Admin',
    shared_with: 2,
    shared_with_name: 'Abiral Sharma',
    can_edit: true,
    created_at: '2026-01-08T10:00:00Z',
  },
  {
    id: 2,
    note_id: 4,
    shared_by: 1,
    shared_by_name: 'Darshan Admin',
    shared_with: 3,
    shared_with_name: 'Samprada Thapa',
    can_edit: false,
    created_at: '2026-01-18T09:00:00Z',
  },
  {
    id: 3,
    note_id: 6,
    shared_by: 3,
    shared_by_name: 'Samprada Thapa',
    shared_with: 2,
    shared_with_name: 'Abiral Sharma',
    can_edit: true,
    created_at: '2026-01-12T14:00:00Z',
  },
];

export const getNoteById = (id: number): Note | undefined => {
  return mockNotes.find(note => note.id === id);
};

export const getNotesByUserId = (userId: number): Note[] => {
  return mockNotes.filter(note => note.user_id === userId);
};

export const getPrivateNotesByUserId = (userId: number): Note[] => {
  return mockNotes.filter(note => note.user_id === userId && note.is_private);
};

export const getPublicNotes = (): Note[] => {
  return mockNotes.filter(note => !note.is_private);
};

export const getSharedNotesForUser = (userId: number): Note[] => {
  const sharedNoteIds = mockSharedNotes
    .filter(share => share.shared_with === userId)
    .map(share => share.note_id);
  
  return mockNotes.filter(note => sharedNoteIds.includes(note.id));
};

export const filterNotes = (
  userId: number,
  isAdmin: boolean,
  status?: NoteStatus,
  search?: string,
  privateOnly?: boolean
): Note[] => {
  let filtered = isAdmin 
    ? mockNotes.filter(note => !note.is_private || note.user_id === userId)
    : mockNotes.filter(note => note.user_id === userId || (!note.is_private));

  if (privateOnly) {
    filtered = filtered.filter(note => note.is_private && note.user_id === userId);
  }

  if (status) {
    filtered = filtered.filter(note => note.status === status);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
    );
  }

  // Sort: pinned first, then by created_at
  filtered.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return filtered;
};