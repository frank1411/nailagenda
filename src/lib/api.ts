import type {
  ApiResponse,
  AuthResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
  ClientListItem,
  ClientWithDetails,
  CreateClientInput,
  UpdateClientInput,
  Service,
  CreateServiceInput,
  UpdateServiceInput,
  AppointmentWithDetails,
  CreateAppointmentInput,
  ClientNote,
  CreateNoteInput,
  DashboardData,
  AutomationRule,
  CreateAutomationInput,
  AdminUser,
  DeleteResponse,
} from '@/types/api';

const API_BASE = '/api';

class ApiClient {
  private headers(): HeadersInit {
    return { 'Content-Type': 'application/json' };
  }

  // El método interno request retorna any para no romper componentes
  // que tienen sus propias definiciones de tipos locales.
  // Los tipos exportados en @/types/api están disponibles para
  // quienes quieran tipar sus componentes.
  private async request(path: string, options?: RequestInit): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: this.headers(),
      credentials: 'include',
      ...options,
    });

    const contentType = res.headers.get('content-type');
    const data =
      contentType && contentType.includes('application/json')
        ? await res.json()
        : { error: `Server returned non-JSON response (${res.status})` };

    if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
    return data.data;
  }

  // ── Auth ──
  async login(input: LoginInput) {
    return this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', ...input }),
    });
  }

  async register(input: RegisterInput) {
    return this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'register', ...input }),
    });
  }

  async getMe() {
    return this.request('/auth');
  }

  async logout() {
    return this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'logout' }),
    });
  }

  async demoLogin() {
    return this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'demo' }),
    });
  }

  // ── Clients ──
  async getClients(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return this.request(`/clients${qs ? `?${qs}` : ''}`);
  }

  async getClient(id: string) {
    return this.request(`/clients/${id}`);
  }

  async createClient(data: CreateClientInput) {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: string, data: UpdateClientInput) {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: string) {
    return this.request(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // ── Client Notes ──
  async getClientNotes(clientId: string) {
    return this.request(`/clients/${clientId}/notes`);
  }

  async addClientNote(clientId: string, data: CreateNoteInput) {
    return this.request(`/clients/${clientId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ── Appointments ──
  async getAppointments(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    clientId?: string;
    status?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return this.request(`/appointments${qs ? `?${qs}` : ''}`);
  }

  async createAppointment(data: CreateAppointmentInput) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointment(id: string, data: Partial<CreateAppointmentInput>) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAppointment(id: string) {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // ── Services ──
  async getServices() {
    return this.request('/services');
  }

  async createService(data: CreateServiceInput) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: UpdateServiceInput) {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string) {
    return this.request(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // ── Automations ──
  async getAutomations() {
    return this.request('/automations');
  }

  async createAutomation(data: CreateAutomationInput) {
    return this.request('/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAutomation(id: string, data: Partial<CreateAutomationInput>) {
    return this.request(`/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAutomation(id: string) {
    return this.request(`/automations/${id}`, {
      method: 'DELETE',
    });
  }

  async runAutomations() {
    return this.request('/automations/run', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // ── Dashboard ──
  async getDashboard() {
    return this.request('/dashboard');
  }

  // ── Seed ──
  async seedDatabase() {
    return this.request('/seed', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // ── Admin ──
  async getAdminUsers() {
    return this.request('/admin/users');
  }

  async updateUserStatus(id: string, isActive: boolean) {
    return this.request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async extendUserSubscription(id: string) {
    return this.request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ extendSubscription: true }),
    });
  }
}

export const api = new ApiClient();
