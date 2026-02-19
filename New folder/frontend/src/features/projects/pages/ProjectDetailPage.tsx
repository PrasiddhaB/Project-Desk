/**
 * Project Detail Page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { projectApi } from '@/services/projects';
import { Project, PROJECT_STATUS_OPTIONS, Task } from '@/types';
import { StatusBadge, PriorityBadge } from '@/components/tasks';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const [projectData, tasksData] = await Promise.all([
        projectApi.getProject(Number(id)),
        projectApi.getProjectTasks(Number(id)),
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    if (!window.confirm(`Delete project "${project.name}"?`)) return;

    try {
      await projectApi.deleteProject(project.id);
      navigate('/projects');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'on_hold': return 'warning';
      case 'completed': return 'primary';
      case 'archived': return 'secondary';
      default: return 'secondary';
    }
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

  if (error || !project) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm text-center py-12">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{error || 'Project not found'}</h3>
            <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
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
            <Link to="/projects" className="hover:text-primary-500">Projects</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{project.name}</span>
          </nav>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{project.name}</h1>
              <div className="flex items-center gap-3">
                <Badge variant={getStatusColor(project.status)}>
                  {PROJECT_STATUS_OPTIONS.find(o => o.value === project.status)?.label}
                </Badge>
                <span className="text-sm text-gray-500">
                  {project.member_count} members • {project.task_count} tasks
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/projects')}>Back</Button>
              {isAdmin && (
                <>
                  <Button variant="outline" onClick={() => navigate(`/projects/${project.id}/edit`)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={handleDelete}>Delete</Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Description</h2>
              <p className="text-gray-600">{project.description || 'No description provided.'}</p>
            </Card>

            {/* Progress */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Progress</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-500 h-3 rounded-full transition-all"
                      style={{ width: `${project.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-lg font-semibold text-gray-800">
                  {project.progress_percentage}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">{project.task_count}</p>
                  <p className="text-xs text-gray-500">Total Tasks</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{project.completed_task_count}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {project.task_count - project.completed_task_count}
                  </p>
                  <p className="text-xs text-gray-500">Remaining</p>
                </div>
              </div>
            </Card>

            {/* Tasks */}
            <Card className="border-0 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Tasks</h2>
                {isAdmin && (
                  <Button size="sm" onClick={() => navigate(`/tasks/create?project=${project.id}`)}>
                    Add Task
                  </Button>
                )}
              </div>

              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <Link
                      key={task.id}
                      to={isAdmin ? `/tasks/${task.id}` : `/my-tasks/${task.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'completed' ? 'bg-green-500' :
                          task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="font-medium text-gray-800">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-6">No tasks in this project</p>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Created By</p>
                  <p className="font-medium text-gray-800">{project.created_by_name}</p>
                </div>
                {project.start_date && (
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p className="text-gray-800">{new Date(project.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {project.end_date && (
                  <div>
                    <p className="text-gray-500">End Date</p>
                    <p className="text-gray-800">{new Date(project.end_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-gray-800">{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>

            {/* Team Members */}
            <Card className="border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Team Members ({project.members.length})
              </h2>
              <div className="space-y-3">
                {project.members.map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar name={member.full_name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{member.full_name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                ))}
                {project.members.length === 0 && (
                  <p className="text-sm text-gray-500">No members assigned</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectDetailPage;
