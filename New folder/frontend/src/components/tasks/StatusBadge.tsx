/**
 * Task Status Badge Component
 */

import React from 'react';
import { TaskStatus } from '@/types';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = {
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      label: 'Pending',
    },
    in_progress: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      label: 'In Progress',
    },
    completed: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      label: 'Completed',
    },
  };

  const { bg, text, label } = config[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${bg} ${text} ${sizeClasses}`}>
      {label}
    </span>
  );
};

export default StatusBadge;