/**
 * Notification Dropdown Component
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Notification, NotificationType } from '@/types';

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkAsRead?: (id: number) => void;
  onClose: () => void;
}

// Format time ago helper
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

// Group notifications by date
interface GroupedNotifications {
  label: string;
  notifications: Notification[];
}

const groupNotificationsByDate = (notifications: Notification[]): GroupedNotifications[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const thisWeek = new Date(today.getTime() - 7 * 86400000);

  const groups: { [key: string]: Notification[] } = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach(notification => {
    const date = new Date(notification.created_at);
    if (date >= today) {
      groups.today.push(notification);
    } else if (date >= yesterday) {
      groups.yesterday.push(notification);
    } else if (date >= thisWeek) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  const result: GroupedNotifications[] = [];
  if (groups.today.length) result.push({ label: 'Today', notifications: groups.today });
  if (groups.yesterday.length) result.push({ label: 'Yesterday', notifications: groups.yesterday });
  if (groups.thisWeek.length) result.push({ label: 'This Week', notifications: groups.thisWeek });
  if (groups.older.length) result.push({ label: 'Older', notifications: groups.older });

  return result;
};

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
  const icons = {
    task_assigned: (
      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
    ),
    task_updated: (
      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    ),
    support_ticket: (
      <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
    ),
    ticket_reply: (
      <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </div>
    ),
    note_shared: (
      <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    ),
  };

  return icons[type] || icons.task_assigned;
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onMarkAllRead,
  onClose,
}) => {
  const groupedNotifications = groupNotificationsByDate(notifications);
  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <div className="w-96">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        {hasUnread && (
          <button
            onClick={onMarkAllRead}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>No notifications</p>
          </div>
        ) : (
          groupedNotifications.map(group => (
            <div key={group.label}>
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {group.label}
              </div>
              {group.notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 ${
                    !notification.is_read ? 'bg-blue-50/30' : ''
                  }`}
                  onClick={onClose}
                >
                  <div className="flex gap-3">
                    <div className="relative">
                      <NotificationIcon type={notification.type} />
                      {!notification.is_read && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                      <p className="text-sm text-gray-500 truncate">{notification.message}</p>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTimeAgo(notification.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 text-center">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-sm text-gray-600 hover:text-primary-500 font-medium"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;