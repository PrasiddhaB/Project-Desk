/**
 * Project Form Page - Create/Edit
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { projectApi } from '@/services/projects';
import { PROJECT_STATUS_OPTIONS, ProjectStatus, User } from '@/types';
import client from '@/services/http/client';

export const ProjectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as ProjectStatus,
    start_date: '',
    end_date: '',
    member_ids: [] as number[],
  });

  useEffect(() => {
    fetchUsers();
    if (isEditMode) {
      fetchProject();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const response = await client.get('/auth/users/');
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching users');
    }
  };

  const fetchProject = async () => {
    try {
      setLoading(true);
      const project = await projectApi.getProject(Number(id));
      setFormData({
        name: project.name,
        description: project.description || '',
        status: project.status,
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        member_ids: project.members.map(m => m.id),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (isEditMode) {
        await projectApi.updateProject(Number(id), formData);
      } else {
        await projectApi.createProject(formData);
      }

      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} project`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMember = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      member_ids: prev.member_ids.includes(userId)
        ? prev.member_ids.filter(id => id !== userId)
        : [...prev.member_ids, userId],
    }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex justify-center items-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <nav className="text-sm text-gray-500 mb-4">
            <Link to="/projects" className="hover:text-primary-500">Projects</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{isEditMode ? 'Edit Project' : 'New Project'}</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <Card className="border-0 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Project Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Project description"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as ProjectStatus }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {PROJECT_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Team Members */}
            <Card className="border-0 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Team Members ({formData.member_ids.length} selected)
              </h2>
              
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {users.map(u => (
                  <label
                    key={u.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.member_ids.includes(u.id)
                        ? 'bg-primary-50 border-2 border-primary-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.member_ids.includes(u.id)}
                      onChange={() => toggleMember(u.id)}
                      className="w-4 h-4 text-primary-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                {isEditMode ? 'Update Project' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectFormPage;
