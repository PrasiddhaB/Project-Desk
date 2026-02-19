/**
 * Notes Page - All notes (own + shared)
 * Dynamic - connects to backend API
 * Requires active subscription for employees
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { noteApi } from '@/services/notes';
import { billingApi } from '@/services/payments';
import { useAuth } from '@/app/providers/AuthProvider';
import { Note, NoteStatus, NOTE_STATUS_OPTIONS } from '@/types';

export const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment_status');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'my' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check subscription access first
  useEffect(() => {
    checkAccess();
    if (paymentStatus === 'success') {
      setSuccessMessage('Payment successful! Your subscription is now active.');
    }
  }, []);

  const checkAccess = async () => {
    try {
      setCheckingAccess(true);
      const result = await billingApi.checkSubscription();
      setHasAccess(result.has_access);
      
      if (result.has_access) {
        fetchNotes();
      }
    } catch (err) {
      // If check fails, assume no access for employees
      setHasAccess(isAdmin);
      if (isAdmin) {
        fetchNotes();
      }
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Note[];
      if (filter === 'my') {
        data = await noteApi.getMyNotes();
      } else if (filter === 'shared') {
        data = await noteApi.getSharedNotes();
      } else {
        data = await noteApi.getNotes();
      }

      setNotes(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setHasAccess(false);
        setError('You need an active subscription to access notes.');
      } else {
        setError(err.response?.data?.message || 'Failed to load notes');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchNotes();
    }
  }, [filter, hasAccess]);

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;

    try {
      await noteApi.deleteNote(id);
      setNotes(notes.filter(n => n.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete note');
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: NoteStatus) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading state
  if (checkingAccess) {
    return (
      <AppLayout>
        <div className="p-6 flex justify-center items-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  // No subscription - show upgrade prompt
  if (!hasAccess && !isAdmin) {
    return (
      <AppLayout>
        <div className="p-6 bg-gray-50 min-h-full">
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-sm text-center py-12">
              <svg className="w-20 h-20 mx-auto mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Subscription Required</h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                You need an active subscription to access Notes features. 
                Subscribe to create private notes and share notes with your team.
              </p>
              <Button onClick={() => navigate('/billing')} size="lg">
                View Plans & Subscribe
              </Button>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMessage}
            <button 
              onClick={() => setSuccessMessage(null)} 
              className="ml-auto text-green-700 hover:text-green-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notes</h1>
            <p className="text-gray-500 mt-1">Manage your notes and shared content</p>
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
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'my', 'shared'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All Notes' : f === 'my' ? 'My Notes' : 'Shared with Me'}
                </button>
              ))}
            </div>

            <Button variant="outline" onClick={fetchNotes}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {/* Loading */}
        {loading ? (
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notes...</p>
            </div>
          </Card>
        ) : (
          /* Notes Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.length > 0 ? (
              filteredNotes.map(note => (
                <Card
                  key={note.id}
                  className={`border-0 shadow-sm hover:shadow-md transition-shadow ${
                    note.pinned ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {note.pinned && (
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v2h2a1 1 0 011 1v1a1 1 0 01-.293.707L15 12.414V18a1 1 0 01-1.447.894L10 17.118l-3.553 1.776A1 1 0 015 18v-5.586l-2.707-2.707A1 1 0 012 9V8a1 1 0 011-1h2V5z" />
                        </svg>
                      )}
                      <Badge variant={getStatusColor(note.status)} size="sm">
                        {NOTE_STATUS_OPTIONS.find(o => o.value === note.status)?.label}
                      </Badge>
                    </div>
                    {note.is_private ? (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                  <Link to={`/notes/${note.id}`}>
                    <h3 className="font-semibold text-gray-800 mb-2 hover:text-primary-500">
                      {note.title}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {note.content?.replace(/<[^>]*>/g, '').slice(0, 100) || 'No content'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{note.owner_name}</span>
                    <span>{formatDate(note.updated_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Link
                      to={`/notes/${note.id}`}
                      className="flex-1 text-center py-2 text-sm text-gray-600 hover:text-primary-500"
                    >
                      View
                    </Link>
                    {note.can_edit && (
                      <Link
                        to={`/notes/${note.id}/edit`}
                        className="flex-1 text-center py-2 text-sm text-gray-600 hover:text-blue-500"
                      >
                        Edit
                      </Link>
                    )}
                    {note.user === user?.id && (
                      <button
                        onClick={() => handleDelete(note.id, note.title)}
                        className="flex-1 text-center py-2 text-sm text-gray-600 hover:text-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="border-0 shadow-sm text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Notes Found</h3>
                  <p className="text-gray-500 mb-4">Create your first note to get started</p>
                  <Button onClick={() => navigate('/notes/create')}>Create Note</Button>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default NotesPage;
