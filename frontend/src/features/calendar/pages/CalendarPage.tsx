/**
 * Calendar Page - Shows tasks with due dates
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Badge } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { taskApi } from '@/services/tasks';
import { Task } from '@/types';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = isAdmin ? await taskApi.getTasks() : await taskApi.getMyTasks();
      setTasks(data.filter(t => t.due_date));
    } catch (err) {
      console.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDay = firstDayOfMonth.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.due_date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  const renderCalendar = () => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Day headers
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`header-${i}`} className="p-2 text-center text-sm font-medium text-gray-500">
          {dayNames[i]}
        </div>
      );
    }

    // Empty cells before first day
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDay(day);
      const hasUrgent = dayTasks.some(t => t.priority === 'urgent' || t.priority === 'high');

      days.push(
        <div
          key={day}
          className={`min-h-[80px] p-2 border border-gray-100 ${
            isToday(day) ? 'bg-primary-50' : 'bg-white'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday(day) ? 'text-primary-600' : 'text-gray-700'
          }`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayTasks.slice(0, 2).map(task => (
              <Link
                key={task.id}
                to={isAdmin ? `/tasks/${task.id}` : `/my-tasks/${task.id}`}
                className={`block text-xs p-1 rounded truncate ${
                  task.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : task.priority === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : task.priority === 'high'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {task.title}
              </Link>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-xs text-gray-500">+{dayTasks.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
        </div>

        <Card className="border-0 shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading calendar...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-0">
              {renderCalendar()}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs">
            <span className="text-gray-500">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-100 rounded"></span> Urgent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-orange-100 rounded"></span> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-100 rounded"></span> Normal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-100 rounded"></span> Completed
            </span>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
