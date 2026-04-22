/**
 * Shared Notes Page
 * Shows notes that have been shared WITH the current user by others.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { noteApi } from '@/services/notes';
import { Note, NoteStatus, NOTE_STATUS_OPTIONS } from '@/types';
import { useAuth } from '@/app/providers/AuthProvider';

export const SharedNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchShared();
  }, []);

  const fetchShared = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await noteApi.getSharedNotes();
      setNotes(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You need an active subscription to view shared notes.');
      } else {
        setError(err.response?.data?.message || 'Failed to load shared notes');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: NoteStatus) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'not-started': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: NoteStatus) =>
    NOTE_STATUS_OPTIONS.find(o => o.value === status)?.label || status;

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Shared Notes</h1>
              <p className="text-gray-500 text-sm">Notes other users have shared with you</p>
            </div>
            <input
              type="search"
              placeholder="Search shared notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <Card className="border-0 shadow-sm text-center py-12">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading shared notes…</p>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-0 shadow-sm text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <h3 className="text-gray-700 font-medium mb-1">No shared notes yet</h3>
              <p className="text-gray-500 text-sm">When someone shares a note with you, it'll show up here.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(note => (
                <Card key={note.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/notes/${note.id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{note.title}</h3>
                    {note.pinned && (
                      <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-3">{note.content}</p>
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant={getStatusColor(note.status)} size="sm">{getStatusLabel(note.status)}</Badge>
                    <span className="text-gray-400">from {note.owner_name || 'someone'}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default SharedNotesPage;
