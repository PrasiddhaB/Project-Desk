/**
 * Note Form Page - Create and Edit notes
 * Dynamic - connects to backend API
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { noteApi } from '@/services/notes';
import { NoteStatus, NOTE_STATUS_OPTIONS } from '@/types';

export const NoteFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'not-started' as NoteStatus,
    pinned: false,
    is_private: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode) {
      fetchNote();
    }
  }, [id]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const note = await noteApi.getNote(Number(id));
      setFormData({
        title: note.title,
        content: note.content || '',
        status: note.status,
        pinned: note.pinned,
        is_private: note.is_private,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);

      if (isEditMode) {
        await noteApi.updateNote(Number(id), formData);
      } else {
        await noteApi.createNote(formData);
      }

      navigate('/notes');
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} note`);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/notes" className="hover:text-primary-500">Notes</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{isEditMode ? 'Edit Note' : 'Create Note'}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Edit Note' : 'Create New Note'}
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm">
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Note title"
                      error={errors.title}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={formData.content}
                      onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your note content..."
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">You can use HTML tags for formatting</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Settings</h2>

                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as NoteStatus }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {NOTE_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pinned */}
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pinned}
                      onChange={e => setFormData(prev => ({ ...prev, pinned: e.target.checked }))}
                      className="w-4 h-4 text-primary-500 rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-800">Pin Note</p>
                      <p className="text-xs text-gray-500">Pinned notes appear at the top</p>
                    </div>
                  </label>

                  {/* Private */}
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_private}
                      onChange={e => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                      className="w-4 h-4 text-primary-500 rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-800">Private Note</p>
                      <p className="text-xs text-gray-500">Only you can see this note</p>
                    </div>
                  </label>
                </div>
              </Card>

              {/* Actions */}
              <Card className="border-0 shadow-sm">
                <div className="space-y-3">
                  <Button type="submit" isLoading={submitting} className="w-full">
                    {isEditMode ? 'Update Note' : 'Create Note'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/notes')} className="w-full">
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default NoteFormPage;
