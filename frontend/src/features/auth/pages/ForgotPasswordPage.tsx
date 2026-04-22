/**
 * Forgot Password Page - user enters email, we send a 6-digit code.
 */

import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/features/auth/api/auth.api';
import { Button, Alert } from '@/components/ui';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await authApi.forgotPasswordEmail(trimmed);
      setSuccess(
        response.message ||
          'If an account with that email exists, a reset code has been sent.'
      );
      // After a short delay, move the user to the reset page with the email
      // prefilled in the URL, so they can enter the code they just received.
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(trimmed)}`, {
          replace: true,
        });
      }, 1200);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Could not send reset code right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Forgot your password?
          </h1>
          <p className="text-gray-500 text-sm">
            Enter your account email and we'll send you a 6-digit code to reset
            it.
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="mb-4">
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 transition-all"
              placeholder="you@example.com"
              autoFocus
              required
            />
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={submitting}
            disabled={submitting || !email.trim()}
          >
            Send reset code
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm mt-6">
          <Link
            to="/login"
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            ← Back to login
          </Link>
          <Link
            to="/reset-password"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            I have a code
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
