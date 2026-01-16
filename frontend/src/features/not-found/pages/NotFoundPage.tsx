/**
 * Not Found Page - 404 error page
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <svg
            className="w-64 h-64 mx-auto text-primary-500"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="4" strokeDasharray="10 10" opacity="0.3" />
            <text x="100" y="90" textAnchor="middle" className="text-6xl font-bold" fill="currentColor" fontSize="48">
              404
            </text>
            <text x="100" y="120" textAnchor="middle" fill="currentColor" fontSize="12" opacity="0.7">
              Page Not Found
            </text>
            <circle cx="60" cy="60" r="8" fill="currentColor" opacity="0.2" />
            <circle cx="150" cy="50" r="5" fill="currentColor" opacity="0.2" />
            <circle cx="40" cy="130" r="6" fill="currentColor" opacity="0.2" />
            <circle cx="160" cy="140" r="10" fill="currentColor" opacity="0.2" />
          </svg>
        </div>

        {/* Content */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Oops! Page not found</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. 
          Don't worry, let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => navigate(-1)} variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </Button>
          <Link to="/dashboard">
            <Button>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Help Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Here are some helpful links:</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to="/dashboard" className="text-primary-500 hover:text-primary-600">
              Dashboard
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/my-tasks" className="text-primary-500 hover:text-primary-600">
              My Tasks
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/notes" className="text-primary-500 hover:text-primary-600">
              Notes
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/support" className="text-primary-500 hover:text-primary-600">
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;