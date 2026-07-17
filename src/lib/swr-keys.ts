// SWR fetcher keys — used for cache invalidation via mutate()
export const SWR_KEYS = {
  dashboard: 'dashboard',
  clients: (params?: string) => (params ? `clients?${params}` : 'clients'),
  client: (id: string) => `client:${id}`,
  services: 'services',
  appointments: (params?: string) => (params ? `appointments?${params}` : 'appointments'),
  automations: 'automations',
  settings: 'settings',
  admin: 'admin',
} as const;
