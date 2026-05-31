'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, useAppStore } from '@/stores/auth';
import LandingPage from '@/components/landing-page';
import AuthDialog from '@/components/auth-dialog';
import DashboardView from '@/components/dashboard-view';
import CalendarView from '@/components/calendar-view';
import ClientList from '@/components/client-list';
import ClientProfile from '@/components/client-profile';
import ServiceManagement from '@/components/service-management';
import AutomationPanel from '@/components/automation-panel';
import SettingsPanel from '@/components/settings-panel';
import OnboardingTour, { hasCompletedOnboarding } from '@/components/onboarding-tour';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Zap,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar' as const, label: 'Calendario', icon: Calendar },
  { id: 'clients' as const, label: 'Clientes', icon: Users },
  { id: 'services' as const, label: 'Servicios', icon: Scissors },
  { id: 'automations' as const, label: 'Automatizaciones', icon: Zap },
  { id: 'settings' as const, label: 'Configuración', icon: Settings },
];

function SidebarContent({ collapsed, onNavigate, onLogout }: { collapsed: boolean; onNavigate: () => void; onLogout: () => void }) {
  const { user } = useAuthStore();
  const { currentView, setView } = useAppStore();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#B76E79] to-[#9a5b64] flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#2D2D2D] tracking-tight">MayeNailsArt</span>
            <span className="text-[10px] text-gray-400 -mt-0.5">{user?.salonName || 'Mi Peluquería'}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  onNavigate();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'bg-[#B76E79]/10 text-[#B76E79]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#B76E79]' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B76E79]" />
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-gray-100 p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-[#B76E79] text-white text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-[#B76E79]/10 text-[#B76E79]">
              {user?.role === 'OWNER' ? 'Dueño' : 'Staff'}
            </Badge>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}

function AppShell() {
  const { logout } = useAuthStore();
  const { currentView, selectedClientId, selectClient, setView, sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleSelectClient = (clientId: string) => {
    selectClient(clientId);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onSelectClient={handleSelectClient} />;
      case 'calendar':
        return <CalendarView onSelectClient={handleSelectClient} />;
      case 'clients':
        if (selectedClientId) {
          return (
            <ClientProfile
              clientId={selectedClientId}
              onBack={() => selectClient(null)}
            />
          );
        }
        return (
          <ClientList
            onSelectClient={handleSelectClient}
            selectedClientId={selectedClientId}
          />
        );
      case 'services':
        return <ServiceManagement />;
      case 'automations':
        return <AutomationPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <DashboardView onSelectClient={handleSelectClient} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <SidebarContent
          collapsed={!sidebarOpen}
          onNavigate={() => {}}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
          <SidebarContent
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={toggleSidebar}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              {navItems.map((item) => {
                if (item.id !== currentView) return null;
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#B76E79]" />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-[#B76E79] hover:bg-[#9a5b64] text-white"
              onClick={() => {
                setView('calendar');
              }}
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Nueva Cita</span>
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, initialized, init, loginDemo } = useAuthStore();
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

  if (!initialized) {
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

  if (!user) {
    return (
      <>
        <LandingPage
          onGetStarted={() => {
            setAuthMode('register');
            setAuthOpen(true);
          }}
          onViewDemo={loginDemo}
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
