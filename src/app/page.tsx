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

// ── Home ──
export default function Home() {
  const { user, init, login: authLogin } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Safety net: re-check on the client in case the server missed a session
  // (e.g., Authorization-header fallback). AuthProvider already set
  // initialized=true, so this won't cause a loading flash — the LandingPage
  // or AppShell renders immediately.
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

  const handleViewDemo = async () => {
    setDemoLoading(true);
    try {
      await authLogin(
        process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@mayenailsart.com',
        process.env.NEXT_PUBLIC_DEMO_PASSWORD || ''
      );
    } catch (err: any) {
      console.error('Demo login failed:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <LandingPage
          onGetStarted={() => {
            setAuthMode('register');
            setAuthOpen(true);
          }}
          onViewDemo={() => {
            handleViewDemo();
          }}
        />
        <AuthDialog
          open={authOpen}
          onOpenChange={setAuthOpen}
          defaultMode={authMode}
          onSuccess={() => setAuthOpen(false)}
        />
        {demoLoading && (
          <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#B76E79] flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-[#2D2D2D]">Preparando demo...</p>
            </div>
          </div>
        )}
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
