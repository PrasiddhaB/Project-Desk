/**
 * Due Date Badge - Color-coded based on urgency
 * Red = overdue, Orange = due today, Yellow = due within 3 days, Green = on track
 */

import React from 'react';

interface DueDateBadgeProps {
  dueDate: string | null;
  status?: string;
  className?: string;
}

export const DueDateBadge: React.FC<DueDateBadgeProps> = ({ dueDate, status, className = '' }) => {
  if (!dueDate) return null;
  if (status === 'completed') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 ${className}`}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {formatDate(dueDate)}
      </span>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let colorClasses = '';
  let icon = '';
  let label = '';

  if (diffDays < 0) {
    // Overdue
    colorClasses = 'bg-red-100 text-red-700 border border-red-200';
    icon = '🔴';
    label = `Overdue (${Math.abs(diffDays)}d)`;
  } else if (diffDays === 0) {
    // Due today
    colorClasses = 'bg-orange-100 text-orange-700 border border-orange-200 animate-pulse';
    icon = '🟠';
    label = 'Due Today';
  } else if (diffDays <= 3) {
    // Due within 3 days
    colorClasses = 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    icon = '🟡';
    label = `${diffDays}d left`;
  } else if (diffDays <= 7) {
    // Due within a week
    colorClasses = 'bg-blue-100 text-blue-700';
    label = formatDate(dueDate);
  } else {
    // On track
    colorClasses = 'bg-gray-100 text-gray-600';
    label = formatDate(dueDate);
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses} ${className}`}>
      {icon && <span className="text-[10px]">{icon}</span>}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {label}
    </span>
  );
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default DueDateBadge;
