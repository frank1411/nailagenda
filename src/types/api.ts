// ─────────────────────────────────────────────
// Tipos de respuesta del API de NailAgenda
// ─────────────────────────────────────────────

// ── Envoltorio de respuesta genérico ──
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

// ── Usuario / Auth ──
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  isActive: boolean;
  isDemo: boolean;
  subscriptionExpiresAt: string | null;
  phone: string | null;
  salonName: string;
  salonAddress: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  salonName: string;
  role: string;
  isDemo: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
  salonName?: string;
}

// ── Cliente ──
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  preferredStylist: string | null;
  birthday: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface LastAppointment {
  id: string;
  date: string;
  startTime: string;
  status: string;
  service: { name: string; price: number } | null;
}

export interface ClientListItem extends Omit<Client, 'userId'> {
  totalVisits: number;
  lastAppointment: LastAppointment | null;
}

export interface ClientWithDetails extends Client {
  clientNotes: ClientNote[];
  appointments: AppointmentWithService[];
}

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  preferredStylist?: string | null;
  birthday?: string | null;
  status?: string;
}

export interface UpdateClientInput {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  preferredStylist?: string | null;
  birthday?: string | null;
  status?: string;
}

// ── Servicio ──
export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  duration: number;
  price: number;
  category: string;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string | null;
  duration?: number;
  price?: number;
  category?: string;
}

// ── Cita ──
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  serviceId: string;
  userId: string;
}

export interface AppointmentWithService extends Appointment {
  service: Service;
}

export interface AppointmentWithDetails extends Appointment {
  client: Pick<Client, 'id' | 'firstName' | 'lastName' | 'phone' | 'email'>;
  service: Service;
}

export interface CreateAppointmentInput {
  clientId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status?: string;
}

// ── Notas del Cliente ──
export type NoteType = 'NOTE' | 'PREFERENCE' | 'ALERT';

export interface ClientNote {
  id: string;
  content: string;
  type: NoteType;
  createdAt: string;
  clientId: string;
}

export interface CreateNoteInput {
  content: string;
  type: string;
}

// ── Dashboard ──
export interface DashboardData {
  totalClients: number;
  clientsByStatus: {
    NEW: number;
    RECURRING: number;
    INACTIVE: number;
  };
  todayAppointments: AppointmentWithDetails[];
  weekRevenue: number;
  recentActivity: AppointmentWithActivity[];
  clientsByStatusList: ClientListItem[];
}

export type AppointmentWithActivity = Appointment & {
  client: Pick<Client, 'id' | 'firstName' | 'lastName'>;
  service: Pick<Service, 'id' | 'name'>;
};

// ── Automatización ──
export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  type: string;
  active: boolean;
  config: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  _count: { logs: number };
}

export interface CreateAutomationInput {
  name: string;
  description?: string | null;
  type: string;
  config?: Record<string, unknown>;
  active?: boolean;
}

export interface AutomationRunResult {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  actions: Array<{
    clientId: string;
    clientName: string;
    action: string;
    details: string;
  }>;
}

export interface RunAutomationsResponse {
  rulesProcessed: number;
  results: AutomationRunResult[];
  runAt: string;
}

export interface AutomationLog {
  id: string;
  action: string;
  result: string | null;
  createdAt: string;
  ruleId: string | null;
  clientId: string;
}

// ── Admin ──
export interface AdminUser extends User {
  _count: {
    clients: number;
    appointments: number;
    services: number;
  };
}

export interface DeleteResponse {
  message: string;
}
