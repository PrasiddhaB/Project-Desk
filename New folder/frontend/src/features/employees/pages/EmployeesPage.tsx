/**
 * Employees Page - Admin only, dynamic
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Badge, Avatar } from '@/components/ui';
import { employeeApi } from '@/services/employees';
import { User } from '@/types';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeApi.getEmployees();
      setEmployees(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
            <p className="text-gray-500 mt-1">Manage your team members</p>
          </div>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm mb-6">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {loading ? (
          <Card className="border-0 shadow-sm text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading employees...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(emp => (
                <Card key={emp.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <Avatar name={emp.full_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <Link to={`/employees/${emp.id}`} className="font-semibold text-gray-800 hover:text-primary-500">
                        {emp.full_name}
                      </Link>
                      <p className="text-sm text-gray-500 truncate">{emp.email}</p>
                      <Badge 
                        variant={emp.role === 'admin' ? 'primary' : 'secondary'} 
                        size="sm"
                        className="mt-1"
                      >
                        {emp.role}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="border-0 shadow-sm text-center py-12">
                  <p className="text-gray-500">No employees found</p>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default EmployeesPage;
