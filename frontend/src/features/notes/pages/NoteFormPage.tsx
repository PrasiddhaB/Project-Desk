/**
 * Note Form Page - Create/Edit note
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { getNoteById } from '@/mock/notes';
import { NoteFormData, NoteStatus, NOTE_STATUS_OPTIONS } from '@/types';

export const NoteFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEditing = Boolean(id);
  const existingNote = isEditing ? getNoteById(Number(id)) : null;
  const isPrivateFromUrl = searchParams.get('private') === 'true';

  const [formData, setFormData] = useState<NoteFormData>({
    title: '',
    content: '',
    status: 'not-started',
    pinned: false,
    is_private: isPrivateFromUrl,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NoteFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingNote) {
      setFormData({
        title: existingNote.title,
        content: existingNote.content,
        status: existingNote.status,
        pinned: existingNote.pinned,
        is_private: existingNote.is_private,
      });
    }
  }, [existingNote]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NoteFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    
    const redirectPath = formData.is_private ? '/notes/private' : '/notes';
    navigate(`${redirectPath}?success=${isEditing ? 'Note updated successfully' : 'Note created successfully'}`);
  };

  if (isEditing && !existingNote) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Note Not Found</h3>
              <p className="text-gray-500 mb-4">The note you're trying to edit doesn't exist.</p>
              <Button onClick={() => navigate('/notes')}>Back to Notes</Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Check edit permission
  if (isEditing && existingNote && existingNote.user_id !== user?.id && user?.role !== 'admin') {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Access Denied</h3>
              <p className="text-gray-500 mb-4">You don't have permission to edit this note.</p>
              <Button onClick={() => navigate('/notes')}>Back to Notes</Button>
            </div>
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
            <span className="text-gray-700">{isEditing ? 'Edit Note' : 'Create Note'}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Note' : 'Create New Note'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-sm">
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, title: e.target.value }));
                        setErrors(prev => ({ ...prev, title: undefined }));
                      }}
                      placeholder="Enter note title"
                      error={errors.title}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, content: e.target.value }));
                        setErrors(prev => ({ ...prev, content: undefined }));
                      }}
                      placeholder="Write your note content here... (HTML supported)"
                      rows={15}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm ${
                        errors.content ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.content && (
                      <p className="text-sm text-red-500 mt-1">{errors.content}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      You can use HTML tags for formatting (e.g., &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;)
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Note Settings</h2>
                
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as NoteStatus }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {NOTE_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pinned */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.pinned}
                        onChange={e => setFormData(prev => ({ ...prev, pinned: e.target.checked }))}
                        className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">📌 Pin this note</span>
                        <p className="text-xs text-gray-500">Pinned notes appear at the top</p>
                      </div>
                    </label>
                  </div>

                  {/* Private */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_private}
                        onChange={e => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                        className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">🔒 Private note</span>
                        <p className="text-xs text-gray-500">Only you can see this note</p>
                      </div>
                    </label>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card className="border-0 shadow-sm">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                  >
                    {isEditing ? 'Update Note' : 'Create Note'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/notes')}
                    className="w-full"
                  >
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