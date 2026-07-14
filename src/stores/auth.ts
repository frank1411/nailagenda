import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isDemo?: boolean;
  phone?: string;
  salonName: string;
  salonAddress?: string;
  image?: string;
  subscriptionExpiresAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;

  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, salonName?: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,
 
  init: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('glam-token');
      if (token) {
        const user = await api.getMe();
        set({ user, token, initialized: true, loading: false });
      } else {
        set({ initialized: true, loading: false });
      }
    } catch (error) {
      localStorage.removeItem('glam-token');
      set({ user: null, token: null, initialized: true, loading: false });
    }
  },
 
  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await api.login(email, password);
      localStorage.setItem('glam-token', data.token);
      set({ user: data.user, token: data.token, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (email, name, password, salonName) => {
    set({ loading: true });
    try {
      const data = await api.register(email, name, password, salonName);
      localStorage.setItem('glam-token', data.token);
      set({ user: data.user, token: data.token, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('glam-token');
    set({ user: null, token: null });
  },

  updateUser: (data) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...data } });
    }
  },
}));

type AppView = 'dashboard' | 'calendar' | 'clients' | 'services' | 'automations' | 'settings' | 'admin';

interface AppState {
  currentView: AppView;
  selectedClientId: string | null;
  sidebarOpen: boolean;

  setView: (view: AppView) => void;
  selectClient: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedClientId: null,
  sidebarOpen: true,

  setView: (view) => set({ currentView: view, selectedClientId: view !== 'clients' ? null : undefined }),
  selectClient: (id) => set({ selectedClientId: id }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
