const API_BASE = '/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('glam-token');
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async get(path: string): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, { headers: this.headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data.data;
  }

  async post(path: string, body: any): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get('content-type');
    const data = (contentType && contentType.includes('application/json')) 
      ? await res.json() 
      : { error: `Server returned non-JSON response (${res.status})` };

    if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
    return data.data;
  }

  async put(path: string, body: any): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data.data;
  }

  async patch(path: string, body: any): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data.data;
  }

  async delete(path: string): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data.data;
  }

  // Auth
  async register(email: string, name: string, password: string, salonName?: string) {
    return this.post('/auth', { action: 'register', email, name, password, salonName });
  }

  async login(email: string, password: string) {
    return this.post('/auth', { action: 'login', email, password });
  }

  async getMe() {
    return this.get('/auth');
  }

  // Clients
  async getClients(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return this.get(`/clients${qs ? `?${qs}` : ''}`);
  }

  async getClient(id: string) {
    return this.get(`/clients/${id}`);
  }

  async createClient(data: any) {
    return this.post('/clients', data);
  }

  async updateClient(id: string, data: any) {
    return this.put(`/clients/${id}`, data);
  }

  async deleteClient(id: string) {
    return this.delete(`/clients/${id}`);
  }

  // Client Notes
  async getClientNotes(clientId: string) {
    return this.get(`/clients/${clientId}/notes`);
  }

  async addClientNote(clientId: string, content: string, type: string) {
    return this.post(`/clients/${clientId}/notes`, { content, type });
  }

  // Appointments
  async getAppointments(params?: { date?: string; startDate?: string; endDate?: string; clientId?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return this.get(`/appointments${qs ? `?${qs}` : ''}`);
  }

  async createAppointment(data: any) {
    return this.post('/appointments', data);
  }

  async updateAppointment(id: string, data: any) {
    return this.put(`/appointments/${id}`, data);
  }

  async deleteAppointment(id: string) {
    return this.delete(`/appointments/${id}`);
  }

  // Services
  async getServices() {
    return this.get('/services');
  }

  async createService(data: any) {
    return this.post('/services', data);
  }

  async updateService(id: string, data: any) {
    return this.put(`/services/${id}`, data);
  }

  async deleteService(id: string) {
    return this.delete(`/services/${id}`);
  }

  // Automations
  async getAutomations() {
    return this.get('/automations');
  }

  async createAutomation(data: any) {
    return this.post('/automations', data);
  }

  async updateAutomation(id: string, data: any) {
    return this.put(`/automations/${id}`, data);
  }

  async deleteAutomation(id: string) {
    return this.delete(`/automations/${id}`);
  }

  async runAutomations() {
    return this.post('/automations/run', {});
  }

  // Dashboard
  async getDashboard() {
    return this.get('/dashboard');
  }

  // Seed
  async seedDatabase() {
    return this.post('/seed', {});
  }

  // Admin
  async getAdminUsers() {
    return this.get('/admin/users');
  }

  async updateUserStatus(id: string, isActive: boolean) {
    return this.patch(`/admin/users/${id}`, { isActive });
  }
}

export const api = new ApiClient();
