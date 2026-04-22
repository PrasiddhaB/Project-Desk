/**
 * App Layout - sidebar + header. Navbar links are filtered based on
 * the user's role using the following per-item flags:
 *
 *   - superAdminOnly: shown only to superadmin (Manage Plans + Subscriptions)
 *   - adminOnly:      shown to BOTH admin and superadmin (elevated access)
 *   - employeeOnly:   shown only to regular employees
 *   - hideForSuper:   shown to admin + employee, but NOT to superadmin
 *                     (used for the Billing link, since superadmin doesn't
 *                      subscribe)
 *
 * By default a nav item with no flags is shown to everyone.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Avatar } from '@/components/ui';
import { NotificationDropdown } from '@/components/notifications';
import { notificationApi } from '@/services/notifications';
import { teamApi, TeamGroup } from '@/services/team';
import { Notification } from '@/types';
import logoImg from '@/assets/logo.png';

interface AppLayoutProps { children: React.ReactNode; }
interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;       // admin OR superadmin
  superAdminOnly?: boolean;  // superadmin ONLY
  employeeOnly?: boolean;    // employee ONLY
  hideForSuper?: boolean;    // hidden from superadmin (e.g. Billing)
}
interface NavSection { title: string; items: NavItem[]; }

const navSections: NavSection[] = [
  {
    title: 'MAIN MENU',
    items: [
      {
        name: 'Dashboard', href: '/dashboard',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      },
      {
        name: 'Calendar', href: '/calendar',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      },
      {
        name: 'Projects', href: '/projects',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
      },
      {
        name: 'My Tasks', href: '/my-tasks',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
      },
      {
        name: 'Tasks', href: '/tasks', adminOnly: true,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
      },
    ],
  },
  {
    title: 'NOTES',
    items: [
      { name: 'All Notes', href: '/notes',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      },
      { name: 'Private Notes', href: '/notes/private',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
      },
      { name: 'Shared Notes', href: '/notes/shared',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
      },
    ],
  },
  {
    title: 'USERS',
    items: [
      { name: 'Team', href: '/team',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      },
      { name: 'Employees', href: '/employees', adminOnly: true,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      },
      { name: 'Activity Log', href: '/activity',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      },
      { name: 'Profile', href: '/profile',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      { name: 'Contact Support', href: '/support', employeeOnly: true,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      },
      { name: 'Support Tickets', href: '/admin/support', adminOnly: true,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      },
      // Payment portal - SUPER ADMIN ONLY
      { name: 'Manage Plans', href: '/admin/plans', superAdminOnly: true,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      },
      { name: 'Subscriptions', href: '/admin/subscriptions', superAdminOnly: true,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      },
      // Billing for admin + employee; hidden from superadmin
      { name: 'Billing', href: '/billing', hideForSuper: true,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
      },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { name: 'Logout', href: '#logout',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
      },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  employee: 'Employee',
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  const role = user?.role;
  const isSuperAdmin = role === 'superadmin';
  const isElevated = role === 'admin' || role === 'superadmin';
  const isEmployee = role === 'employee';

  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [teamsOpen, setTeamsOpen] = useState(true);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationApi.getNotifications(),
        notificationApi.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) { console.error('Failed to load notifications:', err); }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      teamApi.getTeamGroups().then(setTeamGroups).catch(() => {});
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) { console.error('Failed:', err); }
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') return location.pathname === href;
    if (href === '/notes') return location.pathname === '/notes' && !location.pathname.includes('/private') && !location.pathname.includes('/shared');
    return location.pathname.startsWith(href);
  };

  const filterNavItems = (items: NavItem[]) => items.filter(item => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.adminOnly && !isElevated) return false;
    if (item.employeeOnly && !isEmployee) return false;
    if (item.hideForSuper && isSuperAdmin) return false;
    return true;
  });

  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : '';
  const roleBadgeClass = isSuperAdmin
    ? 'text-purple-300 bg-purple-500/20'
    : isElevated
      ? 'text-blue-300 bg-blue-500/20'
      : 'text-emerald-300 bg-emerald-500/20';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] z-50" style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="h-full px-4 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
  Project<span className="text-primary-500">Desk</span>
</Link>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }} title={isDark ? 'Light Mode' : 'Dark Mode'}>
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 rounded-lg shadow-lg border z-50" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <NotificationDropdown notifications={notifications} onMarkAllRead={handleMarkAllRead} onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>
            <Link to="/profile" className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:opacity-80">
              <Avatar name={user?.full_name || 'User'} size="sm" src={user?.profile_pic_url || undefined} />
              <span className="text-sm font-medium hidden sm:inline" style={{ color: 'var(--text-primary)' }}>{user?.full_name}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-[60px] bottom-0 w-[250px] z-40 overflow-y-auto" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
        <div className="p-4 text-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link to="/profile" className="block">
            <div className="relative inline-block mb-2">
              <Avatar name={user?.full_name || 'User'} size="xl" src={user?.profile_pic_url || undefined} showStatus status="online" />
            </div>
            <h6 className="font-semibold text-white">@{user?.username}</h6>
          </Link>
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${roleBadgeClass}`}>
            {roleLabel}
          </span>
        </div>

        <nav className="p-3">
          {navSections.map((section, si) => {
            const items = filterNavItems(section.items);
            if (!items.length) return null;
            return (
              <div key={si} className={si > 0 ? 'mt-4' : ''}>
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{section.title}</p>
                <ul className="space-y-0.5">
                  {items.map(item => (
                    <li key={item.href}>
                      {item.href === '#logout' ? (
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                          {item.icon}<span className="text-sm font-medium">{item.name}</span>
                        </button>
                      ) : (
                        <Link
                          to={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            isActiveRoute(item.href)
                              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                              : 'hover:bg-white/5'
                          }`}
                          style={!isActiveRoute(item.href) ? { color: 'var(--sidebar-text)' } : undefined}
                        >
                          {item.icon}<span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {teamGroups.length > 0 && (
          <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setTeamsOpen(!teamsOpen)}
              className="flex items-center justify-between w-full px-3 py-3"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Teams</span>
              <svg className={`w-4 h-4 transition-transform ${teamsOpen ? '' : '-rotate-90'}`} style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {teamsOpen && (
              <ul className="space-y-1">
                {teamGroups.map(team => {
                  const colorMap: Record<string, string> = {
                    blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500',
                    purple: 'bg-purple-500', yellow: 'bg-yellow-500', pink: 'bg-pink-500',
                    orange: 'bg-orange-500', cyan: 'bg-cyan-500',
                  };
                  return (
                    <li key={team.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[team.color] || 'bg-blue-500'}`}></span>
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--sidebar-text)' }}>{team.name}</span>
                      </div>
                      <div className="flex -space-x-1.5 flex-shrink-0 ml-2">
                        {team.members.slice(0, 4).map(m => (
                          <div key={m.id} className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-[10px] font-bold flex items-center justify-center border border-slate-800" title={m.full_name}>
                            {m.full_name.charAt(0)}
                          </div>
                        ))}
                        {team.member_count > 4 && (
                          <div className="w-6 h-6 rounded-full bg-slate-600 text-slate-300 text-[10px] font-bold flex items-center justify-center border border-slate-800">
                            +{team.member_count - 4}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </aside>

      <main className="ml-[250px] mt-[60px] min-h-[calc(100vh-60px)]">
        {user && !isSuperAdmin && user.is_email_verified === false && (
          <div
            className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
            style={{ backgroundColor: '#fff7ed', borderBottom: '1px solid #fed7aa', color: '#9a3412' }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.938 19h14.124c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.206 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                Your email <strong>{user.email}</strong> is not verified yet.
              </span>
            </div>
            <Link
              to="/verify-email"
              className="font-semibold underline hover:no-underline"
              style={{ color: '#9a3412' }}
            >
              Verify now →
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
