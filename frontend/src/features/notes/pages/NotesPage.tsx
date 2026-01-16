/**
 * All Notes Page - Grid view with status columns
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { mockNotes, filterNotes } from '@/mock/notes';
import { Note, NoteStatus, NOTE_STATUS_OPTIONS } from '@/types';

type ViewMode = 'grid' | 'kanban';

export const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<NoteStatus | ''>('');

  // Get filtered notes
  const notes = filterNotes(
    user?.id || 0,
    isAdmin,
    statusFilter || undefined,
    searchQuery || undefined,
    false
  ).filter(note => !note.is_private || note.user_id === user?.id);

  // Group notes by status for kanban view
  const notStartedNotes = notes.filter(n => n.status === 'not-started');
  const pendingNotes = notes.filter(n => n.status === 'pending');
  const completedNotes = notes.filter(n => n.status === 'completed');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const getStatusColor = (status: NoteStatus) => {
    switch (status) {
      case 'not-started':
        return 'bg-gray-100 text-gray-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const NoteCard: React.FC<{ note: Note }> = ({ note }) => (
    <Link to={`/notes/${note.id}`} className="block">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {note.pinned && (
              <span className="text-yellow-500" title="Pinned">📌</span>
            )}
            {note.is_private && (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(note.status)}`}>
            {note.status === 'not-started' ? 'Not Started' : note.status === 'pending' ? 'Pending' : 'Completed'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">{note.title}</h3>

        {/* Content Preview */}
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {stripHtml(note.content).slice(0, 100)}...
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(note.created_at)}
          </span>
          {note.owner_name && note.user_id !== user?.id && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {note.owner_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">All Notes</h1>
            <nav className="text-sm text-gray-500 mt-1">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span className="text-gray-700">Notes</span>
            </nav>
          </div>
          <Button onClick={() => navigate('/notes/create')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Note
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as NoteStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              {NOTE_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 ${viewMode === 'kanban' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
            </div>
          </div>
        </Card>

        {/* Notes Display */}
        {notes.length > 0 ? (
          viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {notes.map(note => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            // Kanban View
            <div className="flex gap-6 overflow-x-auto pb-4">
              {/* Not Started Column */}
              <div className="flex-shrink-0 w-[320px] bg-gray-100 rounded-xl">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Not Started</h3>
                    <span className="px-2 py-0.5 text-sm bg-gray-200 text-gray-700 rounded-full">
                      {notStartedNotes.length}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
                  {notStartedNotes.map(note => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>

              {/* Pending Column */}
              <div className="flex-shrink-0 w-[320px] bg-yellow-50 rounded-xl">
                <div className="p-4 border-b border-yellow-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Pending</h3>
                    <span className="px-2 py-0.5 text-sm bg-yellow-200 text-yellow-700 rounded-full">
                      {pendingNotes.length}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
                  {pendingNotes.map(note => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>

              {/* Completed Column */}
              <div className="flex-shrink-0 w-[320px] bg-green-50 rounded-xl">
                <div className="p-4 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Completed</h3>
                    <span className="px-2 py-0.5 text-sm bg-green-200 text-green-700 rounded-full">
                      {completedNotes.length}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
                  {completedNotes.map(note => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Notes Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Get started by creating your first note'}
              </p>
              <Button onClick={() => navigate('/notes/create')}>Create New Note</Button>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default NotesPage;