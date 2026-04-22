/**
 * Employees Page - Admin only with full CRUD
 * Features: List, Search, Filter, Add, Edit, Delete
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, Badge, Avatar, Button, Input, Modal } from '@/components/ui';
import { employeeApi } from '@/services/employees';
import { User } from '@/types';
import client from '@/services/http/client';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'employee',
    phone: '',
    department: '',
    is_active: true,
  });

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

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      password: '',
      role: 'employee',
      phone: '',
      department: '',
      is_active: true,
    });
    setEditingUser(null);
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      password: '', // Don't show password
      role: user.role,
      phone: user.phone || '',
      department: user.department || '',
      is_active: user.is_active !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone || null,
        department: formData.department || null,
        is_active: formData.is_active,
      };

      if (editingUser) {
        // Update - only include password if provided
        if (formData.password) {
          payload.password = formData.password;
        }
        await client.put(`/auth/admin/users/${editingUser.id}/`, payload);
      } else {
        // Create - password required
        if (!formData.password) {
          setFormError('Password is required for new users');
          setSubmitting(false);
          return;
        }
        payload.password = formData.password;
        await client.post('/auth/admin/users/create/', payload);
      }

      setShowModal(false);
      resetForm();
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.detail || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete "${user.full_name}"? This action cannot be undone.`)) return;

    try {
      await client.delete(`/auth/admin/users/${user.id}/`);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await client.patch(`/auth/admin/users/${user.id}/`, {
        is_active: !user.is_active,
      });
      fetchEmployees();
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchQuery || 
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = !roleFilter || emp.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Stats
  const totalEmployees = employees.filter(e => e.role === 'employee').length;
  const totalAdmins = employees.filter(e => e.role === 'admin').length;
  const activeUsers = employees.filter(e => e.is_active !== false).length;

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
            <p className="text-gray-500 mt-1">Manage your team members</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-800">{employees.length}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Employees</p>
            <p className="text-2xl font-bold text-blue-600">{totalEmployees}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Admins</p>
            <p className="text-2xl font-bold text-purple-600">{totalAdmins}</p>
          </Card>
          <Card className="border-0 shadow-sm p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[250px]">
              <Input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
            <Button variant="outline" onClick={fetchEmployees}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
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
          <Card className="border-0 shadow-sm overflow-hidden">
            {filteredEmployees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Department</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={emp.full_name} size="sm" />
                            <div>
                              <Link to={`/employees/${emp.id}`} className="font-medium text-gray-800 hover:text-primary-500">
                                {emp.full_name}
                              </Link>
                              <p className="text-xs text-gray-500">@{emp.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{emp.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant={emp.role === 'admin' ? 'primary' : 'secondary'} size="sm">
                            {emp.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{emp.department || '-'}</td>
                        <td className="py-3 px-4">
                          <Badge variant={emp.is_active !== false ? 'success' : 'danger'} size="sm">
                            {emp.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleActive(emp)}
                              className={`p-2 transition-colors ${emp.is_active !== false ? 'text-gray-500 hover:text-yellow-500' : 'text-gray-500 hover:text-green-500'}`}
                              title={emp.is_active !== false ? 'Deactivate' : 'Activate'}
                            >
                              {emp.is_active !== false ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(emp)}
                              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Users Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || roleFilter ? 'Try adjusting your filters' : 'Add your first team member'}
                </p>
                {!searchQuery && !roleFilter && (
                  <Button onClick={handleOpenCreate}>Add User</Button>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Create/Edit Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Edit User' : 'Add User'}>
          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{formError}</div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="johndoe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <Input
                    type="text"
                    value={formData.full_name}
                    onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={editingUser ? '••••••••' : 'Enter password'}
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <Input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Engineering"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+977 98XXXXXXXX"
                />
              </div>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <div>
                  <p className="font-medium text-gray-800">Active Account</p>
                  <p className="text-xs text-gray-500">User can login and access the system</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting} className="flex-1">
                {editingUser ? 'Update User' : 'Add User'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default EmployeesPage;
