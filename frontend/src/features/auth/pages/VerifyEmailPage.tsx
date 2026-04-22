/**
 * Verify Email Page
 * User enters the 6-digit code emailed to them after registration
 * or after logging in with an unverified email.
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { authApi } from '@/features/auth/api/auth.api';
import { Button, Alert } from '@/components/ui';

export const VerifyEmailPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // If user is already verified or doesn't exist, bounce away.
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.is_email_verified || user.role === 'superadmin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Cooldown countdown tick
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await authApi.verifyEmail(trimmed);
      if (response.success) {
        setSuccess('Email verified. Redirecting…');
        await refreshUser();
        setTimeout(() => navigate('/dashboard', { replace: true }), 500);
      } else {
        setError(response.message || 'Verification failed.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Could not verify code. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError('');
    setSuccess('');
    try {
      setResending(true);
      const response = await authApi.resendVerificationCode();
      if (response.success) {
        setSuccess('A new verification code has been sent to your email.');
        setCooldown(60);
      } else {
        setError(response.message || 'Could not resend code.');
      }
    } catch (err: any) {
      const retry = err.response?.data?.retry_after_seconds;
      if (typeof retry === 'number') setCooldown(retry);
      setError(
        err.response?.data?.message ||
          'Could not resend code right now. Please try again shortly.'
      );
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 13H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Verify your email
          </h1>
          <p className="text-gray-500 text-sm">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-gray-700">
              {user?.email || 'your email'}
            </span>
            .<br />
            Enter it below to activate your account.
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
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
            }
            placeholder="000000"
            className="w-full text-center text-3xl tracking-[0.5em] font-semibold py-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 transition-all"
            autoFocus
          />

          <Button
            type="submit"
            fullWidth
            isLoading={submitting}
            disabled={submitting || code.length !== 6}
          >
            Verify Email
          </Button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-500">
          Didn't receive the email?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="text-primary-500 hover:text-primary-600 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : resending
              ? 'Sending…'
              : 'Resend code'}
          </button>
        </div>

        <div className="text-center mt-4 text-sm">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
