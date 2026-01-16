/**
 * Create Task Page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { TaskForm } from '@/components/tasks';
import { Card } from '@/components/ui';
import { TaskFormData } from '@/types/task';

export const CreateTaskPage: React.FC = () => {
  const handleSubmit = (data: TaskFormData) => {
    console.log('Creating task:', data);
    alert('Task created successfully! (Mock)');
  };

  return (
    <AppLayout>
      <section className="bg-gray-50 min-h-full p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link to="/tasks" className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h4 className="text-xl font-semibold text-gray-800">Create New Task</h4>
          </div>
          <nav className="text-sm text-gray-500">
            <Link to="/dashboard" className="hover:text-gray-700">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/tasks" className="hover:text-gray-700">Tasks</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">Create</span>
          </nav>
        </div>

        {/* Form Card */}
        <div className="max-w-3xl">
          <Card>
            <TaskForm mode="create" onSubmit={handleSubmit} />
          </Card>
        </div>
      </section>
    </AppLayout>
  );
};

export default CreateTaskPage;