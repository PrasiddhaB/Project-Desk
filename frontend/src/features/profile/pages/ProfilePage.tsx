/**
 * Profile Page - Dynamic
 */

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input, Avatar } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { profileApi } from '@/services/profile';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
      // Refresh user data
      if (refreshUser) refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
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
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <Avatar name={user?.full_name || ''} size="xl" />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{user?.full_name}</h2>
                <p className="text-gray-500">@{user?.username}</p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                  user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {user?.role === 'admin' ? 'Administrator' : 'Employee'}
                </span>
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
