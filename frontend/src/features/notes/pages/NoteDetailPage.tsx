/**
 * Note Detail Page
 * Dynamic - connects to backend API
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { noteApi } from '@/services/notes';
import { Note, NOTE_STATUS_OPTIONS } from '@/types';
import client from '@/services/http/client';

interface UserOption {
  id: number;
  username: string;
  full_name: string;
}

export const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [shareUserId, setShareUserId] = useState<number | ''>('');
  const [shareCanEdit, setShareCanEdit] = useState(false);
  const [sharing, setSharing] = useState(false);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const data = await noteApi.getNote(Number(id));
      setNote(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await client.get('/auth/users/');
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchNote();
    fetchUsers();
  }, [id]);

  const handleDelete = async () => {
    if (!note) return;
    if (!window.confirm(`Delete "${note.title}"?`)) return;

    try {
      await noteApi.deleteNote(note.id);
      navigate('/notes');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleShare = async () => {
    if (!note || !shareUserId) return;

    try {
      setSharing(true);
      await noteApi.shareNote(note.id, {
        shared_with: Number(shareUserId),
        can_edit: shareCanEdit,
      });
      await fetchNote();
      setShowShareModal(false);
      setShareUserId('');
      setShareCanEdit(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to share');
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async (userId: number) => {
    if (!note) return;
    if (!window.confirm('Remove share?')) return;

    try {
      await noteApi.unshareNote(note.id, userId);
      await fetchNote();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove share');
    }
  };

  const isOwner = note?.user === user?.id;

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading note...</p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error || !note) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm text-center py-12">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{error || 'Note not found'}</h3>
            <Button onClick={() => navigate('/notes')}>Back to Notes</Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/notes" className="hover:text-primary-500">Notes</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{note.title}</span>
          </nav>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{note.title}</h1>
              <div className="flex items-center gap-3">
                <Badge variant={note.status === 'completed' ? 'success' : note.status === 'pending' ? 'warning' : 'secondary'}>
                  {NOTE_STATUS_OPTIONS.find(o => o.value === note.status)?.label}
                </Badge>
                {note.pinned && <Badge variant="warning">Pinned</Badge>}
                {note.is_private && <Badge variant="secondary">Private</Badge>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/notes')}>Back</Button>
              {note.can_edit && (
                <Button variant="outline" onClick={() => navigate(`/notes/${note.id}/edit`)}>
                  Edit
                </Button>
              )}
              {isOwner && (
                <>
                  <Button variant="outline" onClick={() => setShowShareModal(true)}>
                    Share
                  </Button>
                  <Button variant="danger" onClick={handleDelete}>Delete</Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Content</h2>
              <div
                className="prose max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: note.content || '<p>No content</p>' }}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Owner</p>
                  <p className="font-medium text-gray-800">{note.owner_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-gray-800">{new Date(note.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Updated</p>
                  <p className="text-gray-800">{new Date(note.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>

            {/* Shares */}
            {isOwner && note.shares && note.shares.length > 0 && (
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Shared With ({note.shares.length})
                </h2>
                <div className="space-y-2">
                  {note.shares.map(share => (
                    <div key={share.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar name={share.shared_with_name} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{share.shared_with_name}</p>
                          <p className="text-xs text-gray-500">
                            {share.can_edit ? 'Can edit' : 'View only'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnshare(share.shared_with)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Share Note</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Share with</label>
                  <select
                    value={shareUserId}
                    onChange={e => setShareUserId(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select user...</option>
                    {users.filter(u => u.id !== user?.id).map(u => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={shareCanEdit}
                    onChange={e => setShareCanEdit(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Allow editing</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowShareModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleShare} isLoading={sharing} disabled={!shareUserId}>
                  Share
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default NoteDetailPage;
