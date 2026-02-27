/**
 * Calendar Page - Shows tasks and notes with dates
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { calendarApi, CalendarEvent } from '@/services/calendar';

type ViewFilter = 'all' | 'tasks' | 'notes';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const data = await calendarApi.getEvents(startDate, endDate, viewFilter);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.start === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  const getEventStyle = (event: CalendarEvent) => {
    if (event.type === 'note') {
      return event.is_private 
        ? 'bg-purple-100 text-purple-700 border-l-2 border-purple-500'
        : 'bg-cyan-100 text-cyan-700 border-l-2 border-cyan-500';
    }
    
    // Task styling based on status and priority
    if (event.status === 'completed') {
      return 'bg-green-100 text-green-700 border-l-2 border-green-500';
    }
    
    switch (event.priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-l-2 border-red-500';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-l-2 border-orange-500';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-l-2 border-yellow-500';
      default:
        return 'bg-blue-100 text-blue-700 border-l-2 border-blue-500';
    }
  };

  const renderCalendar = () => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Day headers
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`header-${i}`} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
          {dayNames[i]}
        </div>
      );
    }

    // Empty cells before first day
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 bg-gray-50"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);

      days.push(
        <div
          key={day}
          className={`min-h-[100px] p-2 border border-gray-100 ${
            isToday(day) ? 'bg-primary-50 ring-2 ring-primary-300' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday(day) ? 'text-primary-600' : 'text-gray-700'
          }`}>
            {day}
            {isToday(day) && <span className="ml-1 text-xs">(Today)</span>}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map(event => (
              <Link
                key={event.id}
                to={event.url}
                className={`block text-xs p-1 rounded truncate ${getEventStyle(event)}`}
                title={event.title}
              >
                <span className="mr-1">
                  {event.type === 'task' ? '📋' : '📝'}
                </span>
                {event.title}
              </Link>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 font-medium">
                +{dayEvents.length - 3} more
              </div>
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
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <p className="text-gray-500 mt-1">View your tasks and notes on calendar</p>
          </div>
          <Button onClick={goToToday} variant="outline">
            Today
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'tasks', 'notes'] as ViewFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setViewFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewFilter === filter
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {filter === 'all' ? 'All Events' : filter === 'tasks' ? 'Tasks Only' : 'Notes Only'}
            </button>
          ))}
        </div>

        <Card className="border-0 shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
            <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
              {renderCalendar()}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 text-xs">
            <span className="text-gray-500 font-medium">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-100 border-l-2 border-red-500 rounded"></span> Critical
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-orange-100 border-l-2 border-orange-500 rounded"></span> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-100 border-l-2 border-blue-500 rounded"></span> Normal Task
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-100 border-l-2 border-green-500 rounded"></span> Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-purple-100 border-l-2 border-purple-500 rounded"></span> Private Note
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-cyan-100 border-l-2 border-cyan-500 rounded"></span> Shared Note
            </span>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Events</p>
            <p className="text-2xl font-bold text-gray-800">{events.length}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Tasks</p>
            <p className="text-2xl font-bold text-blue-600">
              {events.filter(e => e.type === 'task').length}
            </p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Notes</p>
            <p className="text-2xl font-bold text-purple-600">
              {events.filter(e => e.type === 'note').length}
            </p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === 'completed').length}
            </p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
