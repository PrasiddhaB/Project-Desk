/**
 * Employee Detail Page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Badge, Avatar } from '@/components/ui';
import { employeeApi } from '@/services/employees';
import { User } from '@/types';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const data = await employeeApi.getEmployee(Number(id));
      setEmployee(data);
    } catch (err: any) {
      setError('Employee not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 flex justify-center items-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !employee) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm text-center py-12">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{error || 'Employee not found'}</h3>
            <Button onClick={() => navigate('/employees')}>Back to Employees</Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="max-w-2xl mx-auto">
          <nav className="text-sm text-gray-500 mb-4">
            <Link to="/employees" className="hover:text-primary-500">Employees</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{employee.full_name}</span>
          </nav>

          <Card className="border-0 shadow-sm">
            <div className="flex items-center gap-6 mb-6 pb-6 border-b">
              <Avatar name={employee.full_name} size="xl" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{employee.full_name}</h1>
                <p className="text-gray-500">@{employee.username}</p>
                <Badge 
                  variant={employee.role === 'admin' ? 'primary' : 'secondary'}
                  className="mt-2"
                >
                  {employee.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-800">{employee.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-800">{employee.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-gray-800">
                  {new Date(employee.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => navigate('/employees')}>
                Back to Employees
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default EmployeeDetailPage;
