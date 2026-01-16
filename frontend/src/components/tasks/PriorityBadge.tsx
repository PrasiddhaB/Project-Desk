/**
 * Task Priority Badge Component
 */

import React from 'react';
import { TaskPriority } from '@/types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  size = 'md',
  showIcon = true 
}) => {
  const config = {
    low: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      label: 'Low',
      icon: '↓',
    },
    medium: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      label: 'Medium',
      icon: '→',
    },
    high: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      label: 'High',
      icon: '↑',
    },
    urgent: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      label: 'Urgent',
      icon: '⚡',
    },
  };

  const { bg, text, label, icon } = config[priority];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${bg} ${text} ${sizeClasses}`}>
      {showIcon && <span>{icon}</span>}
      {label}
    </span>
  );
};

export default PriorityBadge;