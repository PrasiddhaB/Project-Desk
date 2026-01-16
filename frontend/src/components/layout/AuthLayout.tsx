/**
 * Auth Layout Component
 * Used for login and registration pages
 */

import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-600">
      {children}
    </div>
  );
};

export default AuthLayout;
