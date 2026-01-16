/**
 * Note Detail Page - View note with full content
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { getNoteById, mockSharedNotes } from '@/mock/notes';
import { mockUsers } from '@/mock/users';
import { NoteStatus, NOTE_STATUS_OPTIONS } from '@/types';

export const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const note = getNoteById(Number(id));
  const isAdmin = user?.role === 'admin';

  const [status, setStatus] = useState<NoteStatus>(note?.status || 'not-started');
  const [showShareModal, setShowShareModal] = useState(false);

  if (!note) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Note Not Found</h3>
              <p className="text-gray-500 mb-4">The note you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/notes')}>Back to Notes</Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const canEdit = note.user_id === user?.id || isAdmin || note.can_edit;
  const canDelete = note.user_id === user?.id || isAdmin;

  // Get shares for this note
  const noteShares = mockSharedNotes.filter(share => share.note_id === note.id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: NoteStatus) => {
    switch (status) {
      case 'not-started':
        return <Badge variant="gray">Not Started</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      // Mock delete
      console.log('Delete note:', note.id);
      navigate('/notes?success=Note deleted successfully');
    }
  };

  const handleStatusUpdate = async (newStatus: NoteStatus) => {
    setStatus(newStatus);
    // Mock API call
    console.log('Update status:', newStatus);
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/notes" className="hover:text-primary-500">Notes</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">View Note</span>
          </nav>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {note.pinned && <span className="text-yellow-500 text-xl">📌</span>}
                <h1 className="text-2xl font-bold text-gray-800">{note.title}</h1>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(status)}
                {note.is_private && (
                  <Badge variant="gray">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Private
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/notes')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Button>
              {canEdit && (
                <Button variant="outline" onClick={() => navigate(`/notes/${note.id}/edit`)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button variant="danger" onClick={handleDelete}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Note Content */}
            <Card className="border-0 shadow-sm">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </Card>

            {/* Update Status */}
            {canEdit && (
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h2>
                <div className="flex flex-wrap gap-2">
                  {NOTE_STATUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusUpdate(option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        status === option.value
                          ? option.value === 'not-started'
                            ? 'bg-gray-200 text-gray-800'
                            : option.value === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Note Info */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Note Information</h2>
              
              <div className="space-y-4">
                {/* Owner */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Created By</label>
                  <div className="flex items-center gap-2">
                    <Avatar name={note.owner_name || 'Unknown'} size="sm" />
                    <span className="font-medium text-gray-800">{note.owner_name}</span>
                  </div>
                </div>

                {/* Created At */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Created</label>
                  <span className="text-gray-600">{formatDate(note.created_at)}</span>
                </div>

                {/* Updated At */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Last Updated</label>
                  <span className="text-gray-600">{formatDate(note.updated_at)}</span>
                </div>
              </div>
            </Card>

            {/* Shared With */}
            {noteShares.length > 0 && (
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Shared With</h2>
                <div className="space-y-3">
                  {noteShares.map(share => (
                    <div key={share.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar name={share.shared_with_name} size="sm" />
                        <span className="text-sm text-gray-800">{share.shared_with_name}</span>
                      </div>
                      {share.can_edit && (
                        <Badge variant="success" size="sm">Can Edit</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Share Button */}
            {note.user_id === user?.id && !note.is_private && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowShareModal(true)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Note
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NoteDetailPage;