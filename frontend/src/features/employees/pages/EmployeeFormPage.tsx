/**
 * Employee Form Page - Placeholder (editing via backend admin)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button } from '@/components/ui';

export const EmployeeFormPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <Card className="border-0 shadow-sm max-w-lg mx-auto text-center py-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Employee Management</h2>
          <p className="text-gray-500 mb-6">
            Employee editing is available through the admin panel.
          </p>
          <Button onClick={() => navigate('/employees')}>Back to Employees</Button>
        </Card>
      </div>
    </AppLayout>
  );
};

export default EmployeeFormPage;
