/**
 * Profile Page - with Profile Picture Upload
 */

import React, { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input, Avatar } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { profileApi } from '@/services/profile';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await profileApi.updateProfile(formData);
      setSuccess('Profile updated successfully');
      setEditing(false);
      if (refreshUser) refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Invalid file type. Use JPEG, PNG, GIF, or WebP.');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await profileApi.uploadProfilePic(file);
      setSuccess('Profile picture updated!');
      if (refreshUser) refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload picture');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePic = async () => {
    if (!window.confirm('Remove profile picture?')) return;
    try {
      setUploading(true);
      setError(null);
      await profileApi.removeProfilePic();
      setSuccess('Profile picture removed');
      if (refreshUser) refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">{success}</div>
          )}

          <Card className="border-0 shadow-sm">
            {/* Avatar with Upload */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <div className="relative group">
                <Avatar name={user?.full_name || ''} size="xl" src={user?.profile_pic_url || undefined} />
                {/* Upload overlay */}
                <div 
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handlePicUpload}
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{user?.full_name}</h2>
                <p className="text-gray-500">@{user?.username}</p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                  user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {user?.role === 'admin' ? 'Administrator' : 'Employee'}
                </span>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                    disabled={uploading}
                  >
                    Change Photo
                  </button>
                  {user?.profile_pic_url && (
                    <button
                      onClick={handleRemovePic}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                      disabled={uploading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                {editing ? (
                  <Input
                    type="text"
                    value={formData.full_name}
                    onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                ) : (
                  <p className="text-gray-800 py-2">{user?.full_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <p className="text-gray-800 py-2">{user?.username}</p>
                <p className="text-xs text-gray-500">Username cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {editing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                ) : (
                  <p className="text-gray-800 py-2">{user?.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {editing ? (
                  <Input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="text-gray-800 py-2">{user?.phone || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-800 py-2 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              {editing ? (
                <>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} isLoading={saving}>Save Changes</Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
