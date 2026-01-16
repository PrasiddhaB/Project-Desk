/**
 * Calendar Page - Tasks Calendar + Notes Calendar tabs
 */

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Tabs } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { mockTasks, getTasksByUserId } from '@/mock/tasks';
import { mockNotes, getNotesByUserId } from '@/mock/notes';

type CalendarType = 'tasks' | 'notes';

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  type: 'task' | 'note';
  status?: string;
  color: string;
}

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<CalendarType>('tasks');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get tasks and notes based on role
  const userTasks = isAdmin ? mockTasks : getTasksByUserId(user?.id || 0);
  const userNotes = isAdmin
    ? mockNotes.filter(n => !n.is_private || n.user_id === user?.id)
    : getNotesByUserId(user?.id || 0);

  // Convert tasks to calendar events
  const taskEvents: CalendarEvent[] = userTasks
    .filter(task => task.due_date)
    .map(task => ({
      id: task.id,
      title: task.title,
      date: task.due_date!,
      type: 'task' as const,
      status: task.status,
      color: task.status === 'completed' 
        ? 'bg-green-500' 
        : task.status === 'in_progress' 
        ? 'bg-blue-500' 
        : 'bg-primary-500',
    }));

  // Convert notes to calendar events (using created_at as the date)
  const noteEvents: CalendarEvent[] = userNotes.map(note => ({
    id: note.id,
    title: note.title,
    date: note.created_at.split('T')[0],
    type: 'note' as const,
    status: note.status,
    color: note.status === 'completed' 
      ? 'bg-green-500' 
      : note.status === 'pending' 
      ? 'bg-yellow-500' 
      : 'bg-cyan-500',
  }));

  // Get events for current view
  const events = activeTab === 'tasks' ? taskEvents : noteEvents;

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);

    const days: { day: number; isCurrentMonth: boolean; date: string }[] = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const month = currentMonth === 0 ? 12 : currentMonth;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        day,
        isCurrentMonth: false,
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const month = currentMonth === 11 ? 1 : currentMonth + 2;
      const year = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({
        day: i,
        isCurrentMonth: false,
        date: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Get events for a specific date
  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  // Check if date is today
  const isToday = (date: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return date === todayStr;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const tabs = [
    {
      id: 'tasks',
      label: 'Tasks Calendar',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'notes',
      label: 'Notes Calendar',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
          <nav className="text-sm text-gray-500 mt-1">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span className="text-gray-700">Calendar</span>
          </nav>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as CalendarType)}
          />
        </div>

        {/* Calendar Card */}
        <Card className="border-0 shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h2 className="text-xl font-semibold text-gray-800">
              {monthNames[currentMonth]} {currentYear}
            </h2>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {dayNames.map(day => (
                <div
                  key={day}
                  className="py-3 text-center text-sm font-semibold text-gray-600"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((dayInfo, index) => {
                const dayEvents = getEventsForDate(dayInfo.date);
                const isTodayDate = isToday(dayInfo.date);

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border-b border-r border-gray-100 p-2 ${
                      !dayInfo.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                    } ${isTodayDate ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex justify-end">
                      <span
                        className={`text-sm font-medium ${
                          !dayInfo.isCurrentMonth
                            ? 'text-gray-400'
                            : isTodayDate
                            ? 'text-blue-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {dayInfo.day}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={`${event.type}-${event.id}`}
                          className={`${event.color} text-white text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-90 transition-opacity`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
            {activeTab === 'tasks' ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary-500"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span>Completed</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-cyan-500"></div>
                  <span>Not Started</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span>Completed</span>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
