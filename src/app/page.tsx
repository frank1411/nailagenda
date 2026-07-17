'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import LandingPage from '@/components/landing-page';
import AuthDialog from '@/components/auth-dialog';
import { hasCompletedOnboarding } from '@/lib/onboarding';

const SubscriptionExpiredView = dynamic(
  () => import('@/components/subscription-expired-view'),
  { loading: () => <SubscriptionSkeleton /> }
);

// ── Lazy-loaded ──
const AppShell = dynamic(
  () => import('@/components/app-shell'),
  { loading: () => <AppShellSkeleton /> }
);
const OnboardingTour = dynamic(
  () => import('@/components/onboarding-tour'),
  { loading: () => null }
);

// ── Fallback para SubscriptionExpiredView ──
function SubscriptionSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B76E79] to-[#9a5b64] flex items-center justify-center animate-pulse">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Fallback mientras carga AppShell ──
function AppShellSkeleton() {
  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white animate-pulse">
        <div className="p-5 border-b border-gray-100">
          <div className="h-9 w-9 rounded-lg bg-gray-200" />
        </div>
        <div className="flex-1 p-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-gray-100" />
          ))}
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-gray-200 bg-white" />
        <main className="flex-1 p-6 space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
        </main>
      </div>
    </div>
  );
}

// ── Loader mientras auth se inicializa ──
function InitialLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B76E79] to-[#9a5b64] flex items-center justify-center animate-pulse">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#B76E79] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#B76E79] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#B76E79] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ── Home ──
export default function Home() {
  const { user, initialized, init } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  // Show onboarding for first-time users
  useEffect(() => {
    if (user && !hasCompletedOnboarding()) {
      const timer = setTimeout(() => setOnboardingOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!initialized) return <InitialLoader />;

  if (!user) {
    return (
      <>
        <LandingPage
          onGetStarted={() => {
            setAuthMode('register');
            setAuthOpen(true);
          }}
          onViewDemo={() => {
            setAuthMode('login');
            setAuthOpen(true);
          }}
        />
        <AuthDialog
          open={authOpen}
          onOpenChange={setAuthOpen}
          defaultMode={authMode}
          onSuccess={() => setAuthOpen(false)}
        />
      </>
    );
  }

  // Subscription check
  if (user.role !== 'ADMIN' && !user.isDemo && user.subscriptionExpiresAt) {
    const expirationDate = new Date(user.subscriptionExpiresAt);
    if (new Date() > expirationDate) {
      return <SubscriptionExpiredView />;
    }
  }

  return (
    <>
      <AppShell />
      <OnboardingTour
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={() => setOnboardingOpen(false)}
      />
    </>
  );
}
