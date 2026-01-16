/**
 * App Layout Component with Sidebar and Header
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Avatar } from '@/components/ui';
import { NotificationDropdown } from '@/components/notifications';
import { getNotificationsByUserId, getUnreadCount } from '@/mock/notifications';
import { Notification } from '@/types';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  employeeOnly?: boolean;
}

const navSections: NavSection[] = [
  {
    title: 'MAIN MENU',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        name: 'Calendar',
        href: '/calendar',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        name: 'My Tasks',
        href: '/my-tasks',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        name: 'Tasks',
        href: '/tasks',
        adminOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'NOTES',
    items: [
      {
        name: 'All Notes',
        href: '/notes',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        name: 'Private Notes',
        href: '/notes/private',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
      },
      {
        name: 'Shared Notes',
        href: '/notes/shared',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'USERS',
    items: [
      {
        name: 'Employees',
        href: '/employees',
        adminOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
      {
        name: 'Profile',
        href: '/profile',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      {
        name: 'Contact Support',
        href: '/support',
        employeeOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
      {
        name: 'Support Tickets',
        href: '/admin/support',
        adminOnly: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      {
        name: 'Logout',
        href: '#logout',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        ),
      },
    ],
  },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';

  // Load notifications
  useEffect(() => {
    if (user) {
      const userNotifications = getNotificationsByUserId(user.id);
      setNotifications(userNotifications);
      setUnreadCount(getUnreadCount(user.id));
    }
  }, [user]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkAllRead = () => {
    // Mock: mark all as read
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') return location.pathname === href;
    if (href === '/notes') return location.pathname === '/notes' && !location.pathname.includes('/private') && !location.pathname.includes('/shared');
    return location.pathname.startsWith(href);
  };

  const filterNavItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.employeeOnly && isAdmin) return false;
      return true;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-gray-200 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="text-xl font-bold text-gray-800">
            Project<span className="text-primary-500">Desk</span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                  <NotificationDropdown
                    notifications={notifications}
                    onMarkAllRead={handleMarkAllRead}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>
              )}
            </div>

            {/* User Info */}
            <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1.5 transition-colors">
              <Avatar name={user?.full_name || 'User'} size="sm" />
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {user?.full_name}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-[60px] bottom-0 w-[250px] bg-white border-r border-gray-200 z-40 overflow-y-auto">
        {/* User Profile Section */}
        <div className="p-4 text-center border-b border-gray-100">
          <Link to="/profile" className="block">
            <div className="relative inline-block mb-2">
              <Avatar name={user?.full_name || 'User'} size="xl" showStatus status="online" />
            </div>
            <h6 className="font-semibold text-gray-800">@{user?.username}</h6>
          </Link>
          <span
            className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${
              isAdmin ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'
            }`}
          >
            {isAdmin ? 'Admin' : 'Employee'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-3">
          {navSections.map((section, sectionIndex) => {
            const filteredItems = filterNavItems(section.items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-4' : ''}>
                <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </p>
                <ul className="space-y-1">
                  {filteredItems.map(item => (
                    <li key={item.href}>
                      {item.href === '#logout' ? (
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          {item.icon}
                          <span className="text-sm font-medium">{item.name}</span>
                        </button>
                      ) : (
                        <Link
                          to={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            isActiveRoute(item.href)
                              ? 'bg-primary-500 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-primary-500'
                          }`}
                        >
                          {item.icon}
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-[250px] mt-[60px] min-h-[calc(100vh-60px)]">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;