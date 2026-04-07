/**
 * Task Card Component
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Task } from '@/types/task';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { DueDateBadge } from './DueDateBadge';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  return (
    <div className="bg-white rounded-xl shadow-soft p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <Link 
          to={`/tasks/${task.id}`}
          className="text-lg font-semibold text-gray-800 hover:text-primary-500 transition-colors line-clamp-1"
        >
          {task.title}
        </Link>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <PriorityBadge priority={task.priority} size="sm" />
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {task.description}
      </p>

      <div className="flex items-center justify-between">
        <StatusBadge status={task.status} size="sm" />
        <DueDateBadge dueDate={task.due_date} status={task.status} />
      </div>

      {/* Assigned Users */}
      {task.assigned_to.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {task.assigned_to.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="w-8 h-8 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-xs font-medium text-primary-600"
                  title={user.full_name}
                >
                  {user.full_name.charAt(0)}
                </div>
              ))}
              {task.assigned_to.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                  +{task.assigned_to.length - 3}
                </div>
              )}
            </div>
            <Link
              to={`/tasks/${task.id}`}
              className="text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              View Details →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;