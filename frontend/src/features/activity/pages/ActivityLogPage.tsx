/**
 * Activity Log Page
 */

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Avatar } from '@/components/ui';
import { activityApi, ActivityLogEntry } from '@/services/activity';
import { useAuth } from '@/app/providers/AuthProvider';

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  task_created: { icon: '📋', color: 'bg-blue-100 text-blue-600' },
  task_updated: { icon: '✏️', color: 'bg-yellow-100 text-yellow-600' },
  task_status_changed: { icon: '🔄', color: 'bg-purple-100 text-purple-600' },
  task_deleted: { icon: '🗑️', color: 'bg-red-100 text-red-600' },
  note_created: { icon: '📝', color: 'bg-green-100 text-green-600' },
  note_updated: { icon: '📝', color: 'bg-yellow-100 text-yellow-600' },
  note_deleted: { icon: '🗑️', color: 'bg-red-100 text-red-600' },
  note_shared: { icon: '🔗', color: 'bg-indigo-100 text-indigo-600' },
  project_created: { icon: '📁', color: 'bg-blue-100 text-blue-600' },
  project_updated: { icon: '📁', color: 'bg-yellow-100 text-yellow-600' },
  user_login: { icon: '🔑', color: 'bg-green-100 text-green-600' },
  user_registered: { icon: '👤', color: 'bg-blue-100 text-blue-600' },
  profile_updated: { icon: '👤', color: 'bg-yellow-100 text-yellow-600' },
  ticket_created: { icon: '🎫', color: 'bg-orange-100 text-orange-600' },
  ticket_replied: { icon: '💬', color: 'bg-blue-100 text-blue-600' },
  time_logged: { icon: '⏱️', color: 'bg-purple-100 text-purple-600' },
};

const ACTION_FILTERS = [
  { value: '', label: 'All Activities' },
  { value: 'task_created', label: 'Tasks Created' },
  { value: 'task_updated', label: 'Tasks Updated' },
  { value: 'task_status_changed', label: 'Status Changes' },
  { value: 'note_created', label: 'Notes Created' },
  { value: 'note_shared', label: 'Notes Shared' },
  { value: 'user_login', label: 'Logins' },
  { value: 'profile_updated', label: 'Profile Updates' },
  { value: 'time_logged', label: 'Time Logged' },
];

export const ActivityLogPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await activityApi.getLogs(filter || undefined, 100);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load activity log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 172800) return 'Yesterday';
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const groupByDate = (entries: ActivityLogEntry[]) => {
    const groups: Record<string, ActivityLogEntry[]> = {};
    entries.forEach(entry => {
      const d = new Date(entry.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  };

  const grouped = groupByDate(logs);

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Activity Log</h1>
          <p className="text-gray-500 mt-1">
            {isAdmin ? 'All team activity' : 'Your recent activity'}
          </p>
        </div>

        {/* Filter */}
        <Card className="border-0 shadow-sm mb-6">
          <div className="flex flex-wrap gap-2">
            {ACTION_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Activity Timeline */}
        {loading ? (
          <Card className="border-0 shadow-sm text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading activity...</p>
          </Card>
        ) : logs.length === 0 ? (
          <Card className="border-0 shadow-sm text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Activity Yet</h3>
            <p className="text-gray-500">Activity will appear here as you use the system</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, entries]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-500 mb-3 sticky top-[60px] bg-gray-50 py-2 z-10">
                  {date}
                </h3>
                <Card className="border-0 shadow-sm">
                  <div className="divide-y divide-gray-100">
                    {entries.map(entry => {
                      const style = ACTION_ICONS[entry.action] || { icon: '📌', color: 'bg-gray-100 text-gray-600' };
                      return (
                        <div key={entry.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${style.color}`}>
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">
                              {isAdmin && (
                                <span className="font-semibold">{entry.user_name}</span>
                              )}
                              {isAdmin ? ' ' : ''}
                              {entry.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(entry.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ActivityLogPage;
