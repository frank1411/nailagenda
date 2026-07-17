'use client';

import useSWR, { SWRConfiguration, mutate as globalMutate } from 'swr';
import { api } from '@/lib/api';
import { SWR_KEYS } from '@/lib/swr-keys';
import type {
  DashboardData,
  ClientListItem,
  ClientWithDetails,
  Service,
  AppointmentWithDetails,
  AutomationRule,
  AdminUser,
} from '@/types/api';

// ── Global config ──
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,         // No refetch al cambiar de pestaña
  dedupingInterval: 5_000,          // Deduplica requests en 5s
  keepPreviousData: true,           // Mantiene datos viejos mientras carga nuevos
  errorRetryCount: 2,               // Reintentos máximos
};

// ── Mutate helper ──
export function invalidate(key: string) {
  globalMutate(key);
}

// ── Hooks ──

export function useDashboard() {
  return useSWR<DashboardData>(SWR_KEYS.dashboard, () => api.getDashboard(), swrConfig);
}

export function useClients(params?: { status?: string; search?: string }) {
  const qs = params ? new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
  ).toString() : '';
  const key = SWR_KEYS.clients(qs || undefined);
  return useSWR<ClientListItem[]>(key, () => api.getClients(params || {}), swrConfig);
}

export function useClient(clientId: string) {
  return useSWR<ClientWithDetails>(SWR_KEYS.client(clientId), () => api.getClient(clientId), swrConfig);
}

export function useServices() {
  return useSWR<Service[]>(SWR_KEYS.services, () => api.getServices(), swrConfig);
}

export function useAppointments(params?: { date?: string; startDate?: string; endDate?: string; clientId?: string; status?: string }) {
  const qs = params ? new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
  ).toString() : '';
  const key = SWR_KEYS.appointments(qs || undefined);
  return useSWR<AppointmentWithDetails[]>(key, () => api.getAppointments(params || {}), swrConfig);
}

export function useAutomations() {
  return useSWR<AutomationRule[]>(SWR_KEYS.automations, () => api.getAutomations(), swrConfig);
}
