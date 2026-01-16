/**
 * Shared Notes Page - Notes shared with the user
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { mockNotes, mockSharedNotes, getSharedNotesForUser } from '@/mock/notes';
import { Note } from '@/types';

export const SharedNotesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');

  // Get shared notes based on role
  let sharedData = isAdmin
    ? mockSharedNotes
    : mockSharedNotes.filter(share => share.shared_with === user?.id);

  // Get note details for each share
  let notesWithShareInfo = sharedData.map(share => {
    const note = mockNotes.find(n => n.id === share.note_id);
    return {
      ...note!,
      shared_by_name: share.shared_by_name,
      shared_with_name: share.shared_with_name,
      can_edit: share.can_edit,
      shared_date: share.created_at,
    };
  }).filter(note => note.id);

  // Apply search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    notesWithShareInfo = notesWithShareInfo.filter(
      note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }

  // Apply sorting
  notesWithShareInfo = [...notesWithShareInfo].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.shared_date).getTime() - new Date(b.shared_date).getTime();
      case 'az':
        return a.title.localeCompare(b.title);
      case 'za':
        return b.title.localeCompare(a.title);
      default:
        return new Date(b.shared_date).getTime() - new Date(a.shared_date).getTime();
    }
  });

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

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Shared Notes</h1>
          <nav className="text-sm text-gray-500 mt-1">
            <Link to="/dashboard" className="hover:text-primary-500">Dashboard</Link>
            <span className="mx-2">/</span>
            <Link to="/notes" className="hover:text-primary-500">Notes</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">Shared Notes</span>
          </nav>
          <p className="text-gray-500 mt-2">View and manage notes that have been shared with you</p>
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
                  placeholder="Search shared notes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              {(['newest', 'oldest', 'az', 'za'] as const).map(sort => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    sortBy === sort
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {sort === 'newest' ? 'Newest' : sort === 'oldest' ? 'Oldest' : sort === 'az' ? 'A-Z' : 'Z-A'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Shared Notes Grid */}
        {notesWithShareInfo.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notesWithShareInfo.map(note => (
              <div key={`${note.id}-${note.shared_date}`} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all">
                {/* Header with share info */}
                <div className="px-5 py-3 bg-primary-50/50 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-primary-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-sm font-medium">Shared by {note.shared_by_name}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">{note.title}</h3>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(note.shared_date)}
                    </span>
                    {isAdmin && (
                      <span className="text-blue-500">
                        → {note.shared_with_name}
                      </span>
                    )}
                    {note.can_edit && (
                      <span className="text-green-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Can edit
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {stripHtml(note.content).slice(0, 100)}...
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/notes/${note.id}`}
                      className="flex-1 px-3 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg text-center hover:bg-primary-600 transition-colors"
                    >
                      View
                    </Link>
                    {note.can_edit && (
                      <Link
                        to={`/notes/${note.id}/edit`}
                        className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Shared Notes Found</h3>
              <p className="text-gray-500">When someone shares a note with you, it will appear here.</p>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default SharedNotesPage;