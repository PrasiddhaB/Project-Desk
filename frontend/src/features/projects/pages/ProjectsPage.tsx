/**
 * Projects Page - List all projects
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { projectApi } from '@/services/projects';
import { Project, PROJECT_STATUS_OPTIONS } from '@/types';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete project "${name}"? All tasks in this project will also be deleted.`)) return;

    try {
      await projectApi.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'on_hold': return 'warning';
      case 'completed': return 'primary';
      case 'archived': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
            <p className="text-gray-500 mt-1">
              {isAdmin ? 'Manage all projects' : 'Your assigned projects'}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate('/projects/create')}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button variant="outline" onClick={fetchProjects}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {loading ? (
          <Card className="border-0 shadow-sm text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading projects...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => (
                <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={getStatusColor(project.status)} size="sm">
                      {PROJECT_STATUS_OPTIONS.find(o => o.value === project.status)?.label}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {project.member_count} members
                    </span>
                  </div>

                  <Link to={`/projects/${project.id}`}>
                    <h3 className="font-semibold text-gray-800 mb-2 hover:text-primary-500">
                      {project.name}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {project.description || 'No description'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{project.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <span>{project.task_count} tasks</span>
                    <span>{project.completed_task_count} completed</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex-1 text-center py-2 text-sm text-gray-600 hover:text-primary-500"
                    >
                      View
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          to={`/projects/${project.id}/edit`}
                          className="flex-1 text-center py-2 text-sm text-gray-600 hover:text-blue-500"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(project.id, project.name)}
                          className="flex-1 text-center py-2 text-sm text-gray-600 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="border-0 shadow-sm text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Projects Found</h3>
                  <p className="text-gray-500 mb-4">
                    {isAdmin ? 'Create your first project to get started' : 'You are not assigned to any projects yet'}
                  </p>
                  {isAdmin && (
                    <Button onClick={() => navigate('/projects/create')}>Create Project</Button>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ProjectsPage;
