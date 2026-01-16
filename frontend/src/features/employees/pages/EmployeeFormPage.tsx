/**
 * Employee Form Page - Edit employee
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { getUserById } from '@/mock/users';
import { UserFormData, UserRole } from '@/types';

export const EmployeeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const existingUser = getUserById(Number(id));

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    password: '',
    role: 'employee',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingUser) {
      setFormData({
        username: existingUser.username,
        email: existingUser.email,
        full_name: existingUser.full_name,
        phone: existingUser.phone || '',
        password: '',
        role: existingUser.role,
      });
    }
  }, [existingUser]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    navigate('/employees?success=User updated successfully');
  };

  if (!existingUser) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card className="border-0 shadow-sm">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-800 mb-2">User Not Found</h3>
              <p className="text-gray-500 mb-4">The user you're trying to edit doesn't exist.</p>
              <Button onClick={() => navigate('/employees')}>Back to Employees</Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/employees" className="hover:text-primary-500">Employees</Link>
            <span className="mx-2">/</span>
            <Link to={`/employees/${id}`} className="hover:text-primary-500">{existingUser.full_name}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700">Edit</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-800">Edit User</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">User Information</h2>
                
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.full_name}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, full_name: e.target.value }));
                        setErrors(prev => ({ ...prev, full_name: undefined }));
                      }}
                      placeholder="Enter full name"
                      error={errors.full_name}
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.username}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, username: e.target.value }));
                        setErrors(prev => ({ ...prev, username: undefined }));
                      }}
                      placeholder="Enter username"
                      error={errors.username}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, email: e.target.value }));
                        setErrors(prev => ({ ...prev, email: undefined }));
                      }}
                      placeholder="Enter email"
                      error={errors.email}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, phone: e.target.value }));
                        setErrors(prev => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="Enter phone number"
                      error={errors.phone}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Leave empty to keep current password"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Only fill this if you want to change the password
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">User Settings</h2>
                
                <div className="space-y-4">
                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card className="border-0 shadow-sm">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                  >
                    Update User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/employees/${id}`)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default EmployeeFormPage;