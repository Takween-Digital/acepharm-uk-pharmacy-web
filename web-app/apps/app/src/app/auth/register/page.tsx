'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Button, Badge } from '@acepharm/ui';
import { Mail, Lock, User, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  const selectedPlan = planParam === 'monthly' || planParam === 'yearly' ? planParam : null;

  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [optInMarketing, setOptInMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://acepharmexams.co.uk';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!agreedTerms) {
      setError('Please agree to the AcePharm Terms and acknowledge the Privacy Policy to proceed.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signUp(email, password, firstName, 'foundation');
      if (selectedPlan) {
        router.push(`/?plan=${selectedPlan}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const code = err instanceof ApiError ? err.data?.error : undefined;
      if (code === 'email_already_exists') {
        setError('An account with this email address already exists. Please log in.');
      } else if (code === 'weak_password') {
        setError('Please choose a stronger password (at least 8 characters).');
      } else if (err instanceof ApiError && err.status === 400) {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Could not complete registration. Please check your details.');
      }
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full p-6 sm:p-8 bg-surface border border-border shadow-card rounded-card relative overflow-hidden">
      <div className="text-center mb-6">
        <Badge variant="teal" className="mb-2 text-xs">
          Start Free Explorer Access
        </Badge>
        <h1 className="text-2xl font-bold text-ink tracking-tight">Start revising with clarity.</h1>
        <p className="text-xs text-slate mt-1.5 leading-relaxed">
          Create your free AcePharm account and complete your first pharmacy session.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-btn bg-danger-wash border border-danger-border text-danger text-xs leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
            First name
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Aisha"
              className="w-full text-sm py-2.5 pl-9 pr-3 rounded-btn border border-border bg-surface text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
            />
            <User className="w-4 h-4 text-slate-light absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
            Email address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.ac.uk"
              className="w-full text-sm py-2.5 pl-9 pr-3 rounded-btn border border-border bg-surface text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
            />
            <Mail className="w-4 h-4 text-slate-light absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full text-sm py-2.5 pl-9 pr-9 rounded-btn border border-border bg-surface text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
            />
            <Lock className="w-4 h-4 text-slate-light absolute left-3 top-3" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-light hover:text-ink transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Legal & Compliance Checkboxes */}
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-2.5">
            <input
              id="terms-consent"
              type="checkbox"
              required
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-indigo focus:ring-indigo/20 cursor-pointer shrink-0"
            />
            <label htmlFor="terms-consent" className="text-xs text-slate select-none cursor-pointer leading-relaxed">
              I agree to the AcePharm{' '}
              <a
                href={`${marketingUrl}/terms`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-indigo hover:text-indigo-deep underline underline-offset-2"
              >
                Terms
              </a>{' '}
              and acknowledge the{' '}
              <a
                href={`${marketingUrl}/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-indigo hover:text-indigo-deep underline underline-offset-2"
              >
                Privacy Policy
              </a>
              .
            </label>
          </div>

          <div className="flex items-start gap-2.5">
            <input
              id="marketing-consent"
              type="checkbox"
              checked={optInMarketing}
              onChange={(e) => setOptInMarketing(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-indigo focus:ring-indigo/20 cursor-pointer shrink-0"
            />
            <label htmlFor="marketing-consent" className="text-xs text-slate select-none cursor-pointer leading-relaxed">
              Send me useful revision guidance and AcePharm product updates.
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center gap-2 shadow-sm font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Setting up account...
            </>
          ) : (
            <>
              Create free account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center text-xs text-slate">
        Already have an account?{' '}
        <a href="/auth/login" className="font-bold text-indigo hover:text-indigo-deep transition-colors">
          Log in
        </a>
      </div>

      <div className="mt-5 pt-3 text-center text-[11px] text-slate-light flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-teal" />
        <span>Independent UK Platform &bull; No credit card required</span>
      </div>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-canvas px-4 py-12">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo to-teal flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
          A
        </div>
        <span className="text-2xl font-bold tracking-tight text-ink">AcePharm</span>
      </div>

      <Suspense fallback={
        <Card className="max-w-md w-full p-8 text-center bg-surface border border-border">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo" />
        </Card>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
