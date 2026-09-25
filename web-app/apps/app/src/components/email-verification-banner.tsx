'use client';

import React, { useState } from 'react';
import { Button } from '@acepharm/ui';
import { AlertCircle, Mail, Check, Loader2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import * as authClient from '@/lib/auth-client';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  // Don't show banner if user is already verified or if dismissed
  if (!user || user.emailVerifiedAt || dismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    setResending(true);
    setResendError(null);

    try {
      await authClient.apiResendVerification();
      setResendSuccess(true);
      // Reset success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (error: any) {
      setResendError(
        error.message || 'Failed to resend verification email. Please try again later.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 pt-1">
            <div className="flex-shrink-0">
              <Mail className="h-5 w-5 text-amber-600 mt-0.5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">
                Verify your email address
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                We've sent a verification link to <strong>{user.email}</strong>. Click the link in that email to verify your account and unlock all features.
              </p>
              {resendSuccess && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-700 font-medium">
                  <Check className="w-4 h-4" />
                  Verification email resent successfully!
                </div>
              )}
              {resendError && (
                <div className="mt-2 text-xs text-rose-700 font-medium">
                  {resendError}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendVerification}
              disabled={resending || resendSuccess}
              className="text-xs font-semibold whitespace-nowrap"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Resending...</span>
                </>
              ) : resendSuccess ? (
                <>
                  <Check className="w-3 h-3" />
                  <span className="hidden sm:inline">Sent</span>
                </>
              ) : (
                <>
                  <Mail className="w-3 h-3 hidden sm:inline" />
                  <span>Resend</span>
                </>
              )}
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors text-amber-600 hover:text-amber-700"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
