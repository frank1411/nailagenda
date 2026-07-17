'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { useClients, invalidate } from '@/lib/use-data';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientListItem {
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
  totalVisits: number;
  lastAppointment: {
    id: string;
    date: string;
    startTime: string;
    service: { name: string; price: number };
  } | null;
}

interface ClientListProps {
  onSelectClient: (clientId: string) => void;
  selectedClientId: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROSE_GOLD = '#B76E79';
const CHARCOAL = '#2D2D2D';

type ClientStatus = 'NEW' | 'RECURRING' | 'INACTIVE';

const STATUS_CONFIG: Record<ClientStatus, { label: string; bgClass: string; textClass: string; avatarBg: string }> = {
  NEW: {
    label: 'Nuevo',
    bgClass: 'bg-green-100 dark:bg-green-900/50',
    textClass: 'text-green-700 dark:text-green-300',
    avatarBg: '#22c55e',
  },
  RECURRING: {
    label: 'Recurrente',
    bgClass: 'bg-amber-100 dark:bg-amber-900/50',
    textClass: 'text-amber-700 dark:text-amber-300',
    avatarBg: '#f59e0b',
  },
  INACTIVE: {
    label: 'Inactivo',
    bgClass: 'bg-red-100 dark:bg-red-900/50',
    textClass: 'text-red-700 dark:text-red-300',
    avatarBg: '#ef4444',
  },
};

type FilterTab = 'ALL' | 'NEW' | 'RECURRING' | 'INACTIVE';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'NEW', label: 'Nuevos' },
  { id: 'RECURRING', label: 'Recurrentes' },
  { id: 'INACTIVE', label: 'Inactivos' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// New Client Dialog
// ---------------------------------------------------------------------------

interface NewClientForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  notes: string;
  preferredStylist: string;
}

function NewClientDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<NewClientForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    notes: '',
    preferredStylist: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthday: '',
      notes: '',
      preferredStylist: '',
    });
    setError(null);
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Nombre y apellido son obligatorios');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const newClient = await api.createClient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        birthday: form.birthday || null,
        notes: form.notes.trim() || null,
        preferredStylist: form.preferredStylist.trim() || null,
      });
      
      toast.success('Cliente creado exitosamente');
      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear cliente';
      setError(msg);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg" style={{ color: CHARCOAL }}>
            <UserPlus className="h-5 w-5" style={{ color: ROSE_GOLD }} />
            Nuevo Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                placeholder="María"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido *</Label>
              <Input
                id="lastName"
                placeholder="García"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="maria@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+34 612 345 678"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthday">Cumpleaños</Label>
              <Input
                id="birthday"
                type="date"
                value={form.birthday}
                onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredStylist">Estilista Preferido</Label>
              <Input
                id="preferredStylist"
                placeholder="Nombre del estilista"
                value={form.preferredStylist}
                onChange={(e) => setForm((f) => ({ ...f, preferredStylist: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas sobre el cliente..."
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false); }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            style={{ backgroundColor: ROSE_GOLD }}
            className="text-white hover:opacity-90"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Cliente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Client Card
// ---------------------------------------------------------------------------

function ClientCard({
  client,
  isSelected,
  onSelect,
}: {
  client: ClientListItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const statusConfig = STATUS_CONFIG[client.status as ClientStatus] || STATUS_CONFIG.NEW;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? 'ring-2 shadow-md'
          : 'hover:border-muted-foreground/30'
      }`}
      style={isSelected ? { borderColor: ROSE_GOLD } : undefined}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(); }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarFallback
              className="text-white font-semibold text-sm"
              style={{ backgroundColor: statusConfig.avatarBg }}
            >
              {getInitials(client.firstName, client.lastName)}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm truncate" style={{ color: CHARCOAL }}>
                {client.firstName} {client.lastName}
              </span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ${statusConfig.bgClass} ${statusConfig.textClass}`}
              >
                {statusConfig.label}
              </Badge>
            </div>

            {/* Phone */}
            {client.phone && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="truncate">{client.phone}</span>
              </div>
            )}

            {/* Email */}
            {client.email && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
            )}

            {/* Last visit & total visits */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {client.lastAppointment && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>Última visita: {formatDate(client.lastAppointment.date)}</span>
                </div>
              )}
              <span className="shrink-0">
                {client.totalVisits} {client.totalVisits === 1 ? 'visita' : 'visitas'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function ClientCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-11 w-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main ClientList Component
// ---------------------------------------------------------------------------

export default function ClientList({ onSelectClient, selectedClientId }: ClientListProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [newClientOpen, setNewClientOpen] = useState(false);

  // Debounced search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  // SWR: filtered clients list
  const fetchParams: { status?: string; search?: string } = {};
  if (activeFilter !== 'ALL') fetchParams.status = activeFilter;
  if (debouncedSearch.trim()) fetchParams.search = debouncedSearch.trim();
  const { data: clients = [], error, isLoading, mutate } = useClients(fetchParams);

  // SWR: all clients for status counts (deduplicated by SWR)
  const { data: allClients = [] } = useClients({});

  const statusCounts = {
    ALL: allClients.length,
    NEW: allClients.filter((c) => c.status === 'NEW').length,
    RECURRING: allClients.filter((c) => c.status === 'RECURRING').length,
    INACTIVE: allClients.filter((c) => c.status === 'INACTIVE').length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5" style={{ color: ROSE_GOLD }} />
          <h2 className="text-xl font-bold" style={{ color: CHARCOAL }}>
            Clientes
          </h2>
          <Badge
            variant="secondary"
            className="text-xs h-6 px-2"
            style={{ backgroundColor: `${ROSE_GOLD}20`, color: ROSE_GOLD }}
          >
            {statusCounts.ALL}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={() => setNewClientOpen(true)}
          style={{ backgroundColor: ROSE_GOLD }}
          className="text-white hover:opacity-90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Nuevo Cliente</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="px-4 sm:px-6 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 sm:px-6 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                style={isActive ? { backgroundColor: ROSE_GOLD } : undefined}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center h-4 min-w-4 rounded-full px-1 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-muted-foreground/15 text-muted-foreground'
                  }`}
                >
                  {statusCounts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Client List */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ClientCardSkeleton key={i} />
              ))}
            </div>
          </ScrollArea>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Error al cargar</p>
            <p className="text-xs text-muted-foreground mb-3">{error}</p>
            <Button
               variant="outline"
               size="sm"
               onClick={() => mutate()}
             >
               Reintentar

            </Button>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              {debouncedSearch || activeFilter !== 'ALL'
                ? 'No se encontraron clientes'
                : 'Sin clientes aún'}
            </p>
            <p className="text-xs text-muted-foreground">
              {debouncedSearch || activeFilter !== 'ALL'
                ? 'Prueba con otros filtros o búsqueda'
                : 'Agrega tu primer cliente para comenzar'}
            </p>
            {!debouncedSearch && activeFilter === 'ALL' && (
              <Button
                size="sm"
                className="mt-4 text-white hover:opacity-90"
                style={{ backgroundColor: ROSE_GOLD }}
                onClick={() => setNewClientOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 space-y-3">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  isSelected={selectedClientId === client.id}
                  onSelect={() => onSelectClient(client.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* New Client Dialog */}
      <NewClientDialog
        open={newClientOpen}
        onOpenChange={setNewClientOpen}
        onCreated={() => invalidate('clients')}
      />
    </div>
  );
}
