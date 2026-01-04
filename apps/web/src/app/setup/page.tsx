'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SetupWizard } from '@/components/setup';
import { Spinner } from '@/components/ui/spinner';
import { useSetupStatus } from '@/lib/hooks';

/**
 * Setup page - shown for fresh installs before any users exist.
 *
 * Checks setup status and either shows the wizard or redirects to login.
 */
export default function SetupPage() {
  const router = useRouter();
  const { data: status, isLoading, error } = useSetupStatus({ validateKeys: true });

  // Redirect to login if setup is not needed
  useEffect(() => {
    if (status && !status.needs_setup) {
      router.replace('/login');
    }
  }, [status, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-sc-bg-dark">
        <Spinner size="lg" color="purple" />
        <p className="mt-4 text-sc-fg-muted text-sm">Checking server status...</p>
      </div>
    );
  }

  // Connection error
  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-sc-bg-dark px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sc-red/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-sc-red"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-sc-fg-primary mb-2">
            Cannot Connect to Server
          </h1>
          <p className="text-sc-fg-muted mb-6">
            Unable to reach the Sibyl API server. Please ensure the server is running and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-sc-purple text-white font-medium text-sm hover:bg-sc-purple/90 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Already set up - show loading while redirecting
  if (status && !status.needs_setup) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-sc-bg-dark">
        <Spinner size="lg" color="purple" />
        <p className="mt-4 text-sc-fg-muted text-sm">Redirecting to login...</p>
      </div>
    );
  }

  // Fresh install - show setup wizard
  return (
    <div className="min-h-dvh flex flex-col bg-sc-bg-dark">
      {/* Header */}
      <header className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center group">
          <div className="relative mb-2">
            <div className="absolute -inset-4 rounded-2xl bg-sc-purple/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Image
              src="/sibyl-logo.png"
              alt="Sibyl"
              width={180}
              height={52}
              className="h-12 w-auto relative z-10"
              priority
            />
          </div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-sc-fg-muted font-medium">
            First-Time Setup
          </p>
        </div>
      </header>

      {/* Wizard */}
      <main className="flex-1 flex items-start justify-center px-4 pb-12">
        <SetupWizard
          initialStatus={status}
          onComplete={() => router.push('/login?setup=complete')}
        />
      </main>
    </div>
  );
}
