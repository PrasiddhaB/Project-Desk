/**
 * Edit Task Page
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { TaskForm } from '@/components/tasks';
import { Card, Button } from '@/components/ui';
import { TaskFormData } from '@/types/task';
import { getTaskById } from '@/mock/tasks';

export const EditTaskPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const task = getTaskById(Number(id));

  const handleSubmit = (data: TaskFormData) => {
    console.log('Updating task:', id, data);
    alert('Task updated successfully! (Mock)');
  };

  if (!task) {
    return (
      <AppLayout>
        <section className="bg-gray-50 min-h-full p-6">
          <Card className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Task Not Found</h3>
            <p className="text-gray-500 mb-6">The task you're trying to edit doesn't exist.</p>
            <Link to="/tasks">
              <Button variant="outline">Back to Tasks</Button>
            </Link>
          </Card>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="bg-gray-50 min-h-full p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/tasks/${task.id}`} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h4 className="text-xl font-semibold text-gray-800">Edit Task</h4>
          </div>
          <nav className="text-sm text-gray-500">
            <Link to="/dashboard" className="hover:text-gray-700">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/tasks" className="hover:text-gray-700">Tasks</Link>
            <span className="mx-2">/</span>
            <Link to={`/tasks/${task.id}`} className="hover:text-gray-700">#{task.id}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">Edit</span>
          </nav>
        </div>

        {/* Form Card */}
        <div className="max-w-3xl">
          <Card>
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Editing: {task.title}</h3>
              <p className="text-sm text-gray-500">Task #{task.id}</p>
            </div>
            <TaskForm mode="edit" task={task} onSubmit={handleSubmit} />
          </Card>
        </div>
      </section>
    </AppLayout>
  );
};

export default EditTaskPage;