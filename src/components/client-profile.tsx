'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Symmetry,
  ArrowLeft,
  Phone,
  Mail,
  Cake,
  Scissors,
  UserCheck,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  Plus,
  Loader2,
  StickyNote,
  Star,
  AlertTriangle,
  X,
  CheckCircle2,
  Circle,
  XCircle,
  Ban,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientNote {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  clientId: string;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: string;
  active: boolean;
}

interface AppointmentItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  clientId: string;
  serviceId: string;
  service: { id: string; name: string; price: number; duration: number };
}

interface ClientDetail {
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
  appointments: AppointmentItem[];
  clientNotes: ClientNote[];
}

interface ClientProfileProps {
  clientId: string;
  onBack: () => void;
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

const APPOINTMENT_STATUS: Record<string, { label: string; bgClass: string; textClass: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pendiente', bgClass: 'bg-yellow-100 dark:bg-yellow-900/50', textClass: 'text-yellow-700 dark:text-yellow-300', icon: Clock },
  CONFIRMED: { label: 'Confirmada', bgClass: 'bg-blue-100 dark:bg-blue-900/50', textClass: 'text-blue-700 dark:text-blue-300', icon: CheckCircle2 },
  COMPLETED: { label: 'Completada', bgClass: 'bg-green-100 dark:bg-green-900/50', textClass: 'text-green-700 dark:text-green-300', icon: Circle },
  CANCELLED: { label: 'Cancelada', bgClass: 'bg-red-100 dark:bg-red-900/50', textClass: 'text-red-700 dark:text-red-300', icon: XCircle },
  NO_SHOW: { label: 'No asistió', bgClass: 'bg-gray-100 dark:bg-gray-900/50', textClass: 'text-gray-700 dark:text-gray-300', icon: Ban },
};

const NOTE_TYPE_CONFIG: Record<string, { label: string; bgClass: string; textClass: string; icon: React.ElementType }> = {
  NOTE: { label: 'Nota', bgClass: 'bg-blue-100 dark:bg-blue-900/50', textClass: 'text-blue-700 dark:text-blue-300', icon: StickyNote },
  PREFERENCE: { label: 'Preferencia', bgClass: 'bg-green-100 dark:bg-green-900/50', textClass: 'text-green-700 dark:text-green-300', icon: Star },
  ALERT: { label: 'Alerta', bgClass: 'bg-amber-100 dark:bg-amber-900/50', textClass: 'text-amber-700 dark:text-amber-300', icon: AlertTriangle },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function calculateFrequency(appointments: AppointmentItem[]): string {
  const completedDates = appointments
    .filter((a) => a.status === 'COMPLETED')
    .map((a) => new Date(a.date + 'T00:00:00'))
    .sort((a, b) => a.getTime() - b.getTime());

  if (completedDates.length < 2) return completedDates.length === 1 ? '1 visita' : '-';

  let totalDiffDays = 0;
  for (let i = 1; i < completedDates.length; i++) {
    const diff = completedDates[i].getTime() - completedDates[i - 1].getTime();
    totalDiffDays += diff / (1000 * 60 * 60 * 24);
  }

  const avgDays = Math.round(totalDiffDays / (completedDates.length - 1));
  return `Cada ${avgDays} días`;
}

// ---------------------------------------------------------------------------
// Edit Client Dialog
// ---------------------------------------------------------------------------

interface EditClientForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  notes: string;
  preferredStylist: string;
}

function EditClientDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientDetail | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EditClientForm>(() => {
    if (client) {
      return {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email || '',
        phone: client.phone || '',
        birthday: client.birthday || '',
        notes: client.notes || '',
        preferredStylist: client.preferredStylist || '',
      };
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthday: '',
      notes: '',
      preferredStylist: '',
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && client) {
      setForm({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email || '',
        phone: client.phone || '',
        birthday: client.birthday || '',
        notes: client.notes || '',
        preferredStylist: client.preferredStylist || '',
      });
      setError(null);
      setSaving(false);
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Nombre y apellido son obligatorios');
      return;
    }
    if (!client) return;

    setSaving(true);
    setError(null);

    try {
      await api.updateClient(client.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        birthday: form.birthday || null,
        notes: form.notes.trim() || null,
        preferredStylist: form.preferredStylist.trim() || null,
      });
      toast.success('Cliente actualizado exitosamente');
      onOpenChange(false);
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar cliente';
      setError(msg);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg" style={{ color: CHARCOAL }}>
            <Edit2 className="h-5 w-5" style={{ color: ROSE_GOLD }} />
            Editar Cliente
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
              <Label htmlFor="edit-firstName">Nombre *</Label>
              <Input
                id="edit-firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Apellido *</Label>
              <Input
                id="edit-lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-birthday">Cumpleaños</Label>
              <Input
                id="edit-birthday"
                type="date"
                value={form.birthday}
                onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-preferredStylist">Estilista Preferido</Label>
              <Input
                id="edit-preferredStylist"
                value={form.preferredStylist}
                onChange={(e) => setForm((f) => ({ ...f, preferredStylist: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notas</Label>
            <Textarea
              id="edit-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
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
              'Guardar Cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// New Appointment Dialog
// ---------------------------------------------------------------------------

function NewAppointmentDialog({
  open,
  onOpenChange,
  clientId,
  services,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  services: ServiceItem[];
  onCreated: () => void;
}) {
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setServiceId('');
    setDate('');
    setStartTime('');
    setManualEndTime('');
    setNotes('');
    setError(null);
    setSaving(false);
  };

  // Compute end time from service duration
  const computedEndTime = (() => {
    if (serviceId && startTime) {
      const svc = services.find((s) => s.id === serviceId);
      if (svc) {
        const [h, m] = startTime.split(':').map(Number);
        const totalMin = h * 60 + m + svc.duration;
        const endH = Math.floor(totalMin / 60);
        const endM = totalMin % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }
    }
    return manualEndTime;
  })();

  const handleSubmit = async () => {
    if (!serviceId || !date || !startTime || !computedEndTime) {
      setError('Servicio, fecha y hora son obligatorios');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.createAppointment({
        clientId,
        serviceId,
        date,
        startTime,
        endTime: computedEndTime,
        notes: notes.trim() || null,
      });
      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear cita';
      setError(msg);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg" style={{ color: CHARCOAL }}>
            <Calendar className="h-5 w-5" style={{ color: ROSE_GOLD }} />
            Nueva Cita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Servicio *</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((svc) => (
                  <SelectItem key={svc.id} value={svc.id}>
                    {svc.name} - {formatCurrency(svc.price)} ({svc.duration}min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apt-date">Fecha *</Label>
            <Input
              id="apt-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apt-start">Hora inicio *</Label>
              <Input
                id="apt-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apt-end">Hora fin *</Label>
              <Input
                id="apt-end"
                type="time"
                value={computedEndTime}
                onChange={(e) => setManualEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apt-notes">Notas</Label>
            <Textarea
              id="apt-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre la cita..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={saving}>
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
                Creando...
              </>
            ) : (
              'Crear Cita'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Service History Timeline Item
// ---------------------------------------------------------------------------

function TimelineItem({ appointment, isLast }: { appointment: AppointmentItem; isLast: boolean }) {
  const statusConf = APPOINTMENT_STATUS[appointment.status] || APPOINTMENT_STATUS.PENDING;

  return (
    <div className="flex gap-3">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className="h-3 w-3 rounded-full border-2 mt-1 shrink-0"
          style={{ borderColor: ROSE_GOLD, backgroundColor: appointment.status === 'COMPLETED' ? ROSE_GOLD : 'white' }}
        />
        {!isLast && <div className="w-px flex-1 bg-border min-h-[20px]" />}
      </div>

      {/* Content */}
      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm" style={{ color: CHARCOAL }}>
              {appointment.service.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDateShort(appointment.date)} · {appointment.startTime} - {appointment.endTime}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold" style={{ color: ROSE_GOLD }}>
              {formatCurrency(appointment.service.price)}
            </span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 h-5 ${statusConf.bgClass} ${statusConf.textClass}`}
            >
              {statusConf.label}
            </Badge>
          </div>
        </div>
        {appointment.notes && (
          <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-1">
            {appointment.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ClientProfile Component
// ---------------------------------------------------------------------------

export default function ClientProfile({ clientId, onBack }: ClientProfileProps) {
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [newAptOpen, setNewAptOpen] = useState(false);

  // Notes state
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('NOTE');
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Fetch client
  const fetchClient = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getClient(clientId);
      setClient(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar cliente';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Fetch services (for new appointment)
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await api.getServices();
        setServices(data || []);
      } catch {
        // silently fail
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  // Computed stats
  const completedAppointments = client?.appointments.filter((a) => a.status === 'COMPLETED') || [];
  const totalSpent = completedAppointments.reduce((sum, a) => sum + (a.service?.price || 0), 0);
  const totalVisits = completedAppointments.length;
  const frequency = client ? calculateFrequency(client.appointments) : '-';

  // Split appointments into upcoming and past
  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = client?.appointments.filter((a) => a.date >= today && a.status !== 'CANCELLED' && a.status !== 'COMPLETED') || [];
  const pastAppointments = client?.appointments.filter((a) => a.date < today || a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW') || [];

  // Status change handler
  const handleStatusChange = async (newStatus: string) => {
    if (!client || newStatus === client.status) return;
    try {
      setStatusUpdating(true);
      await api.updateClient(client.id, { status: newStatus });
      setClient((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch {
      // silently fail
    } finally {
      setStatusUpdating(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!client) return;
    try {
      setDeleting(true);
      await api.deleteClient(client.id);
      toast.success('Cliente eliminado permanentemente');
      onBack();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar cliente';
      toast.error(msg);
      setDeleting(false);
    }
  };

  // Add note handler
  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      setNoteError('El contenido es obligatorio');
      return;
    }
    try {
      setAddingNote(true);
      setNoteError(null);
      await api.addClientNote(clientId, noteContent.trim(), noteType);
      toast.success('Nota agregada exitosamente');
      setNoteContent('');
      setNoteType('NOTE');
      fetchClient();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al agregar nota';
      setNoteError(msg);
      toast.error(msg);
    } finally {
      setAddingNote(false);
    }
  };

  // Current status config
  const currentStatusConfig = STATUS_CONFIG[(client?.status as ClientStatus) || 'NEW'] || STATUS_CONFIG.NEW;

  // ---- Loading State ----
  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // ---- Error State ----
  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Error al cargar</p>
        <p className="text-xs text-muted-foreground mb-3">{error || 'Cliente no encontrado'}</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  // ---- Main Render ----
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a clientes
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarFallback
              className="text-white font-bold text-xl"
              style={{ backgroundColor: currentStatusConfig.avatarBg }}
            >
              {getInitials(client.firstName, client.lastName)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-2xl font-bold" style={{ color: CHARCOAL }}>
                {client.firstName} {client.lastName}
              </h1>

              {/* Status Dropdown */}
              <Select value={client.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
                <SelectTrigger
                  className={`w-auto h-7 text-xs border-0 ${currentStatusConfig.bgClass} ${currentStatusConfig.textClass}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Nuevo
                    </span>
                  </SelectItem>
                  <SelectItem value="RECURRING">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Recurrente
                    </span>
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Inactivo
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contact details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {client.phone}
                </a>
              )}
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {client.email}
                </a>
              )}
              {client.birthday && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Cake className="h-3.5 w-3.5" />
                  {formatDate(client.birthday)}
                </div>
              )}
              {client.preferredStylist && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5" />
                  {client.preferredStylist}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 p-4 sm:p-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg mb-2" style={{ backgroundColor: `${ROSE_GOLD}15` }}>
              <Scissors className="h-5 w-5" style={{ color: ROSE_GOLD }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>{totalVisits}</p>
            <p className="text-xs text-muted-foreground">Total de Visitas</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 mb-2">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-muted-foreground">Gasto Total</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 mb-2">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{frequency}</p>
            <p className="text-xs text-muted-foreground">Frecuencia</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Tabs */}
      <div className="flex-1 min-h-0">
        <Tabs defaultValue="history" className="flex flex-col h-full">
          <TabsList className="mx-4 sm:mx-6 mt-4 w-fit">
            <TabsTrigger value="history">Historial de Servicios</TabsTrigger>
            <TabsTrigger value="notes">Notas y Preferencias</TabsTrigger>
            <TabsTrigger value="appointments">Citas</TabsTrigger>
          </TabsList>

          {/* Tab 1: Historial de Servicios */}
          <TabsContent value="history" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6">
                {client.appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Scissors className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">Sin historial de servicios</p>
                    <p className="text-xs mt-1">Las citas completadas aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {client.appointments
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((apt, idx, arr) => (
                        <TimelineItem
                          key={apt.id}
                          appointment={apt}
                          isLast={idx === arr.length - 1}
                        />
                      ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab 2: Notas y Preferencias */}
          <TabsContent value="notes" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 space-y-4">
                {/* Add note section */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Agregar nota, preferencia o alerta..."
                        rows={3}
                        value={noteContent}
                        onChange={(e) => { setNoteContent(e.target.value); setNoteError(null); }}
                      />
                      {noteError && (
                        <p className="text-xs text-red-500">{noteError}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={noteType} onValueChange={setNoteType}>
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOTE">
                            <span className="flex items-center gap-1.5">
                              <StickyNote className="h-3 w-3 text-blue-500" />
                              Nota
                            </span>
                          </SelectItem>
                          <SelectItem value="PREFERENCE">
                            <span className="flex items-center gap-1.5">
                              <Star className="h-3 w-3 text-green-500" />
                              Preferencia
                            </span>
                          </SelectItem>
                          <SelectItem value="ALERT">
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                              Alerta
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleAddNote}
                        disabled={addingNote || !noteContent.trim()}
                        style={{ backgroundColor: ROSE_GOLD }}
                        className="text-white hover:opacity-90 ml-auto"
                      >
                        {addingNote ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes list */}
                {client.clientNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <StickyNote className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">Sin notas</p>
                    <p className="text-xs mt-1">Agrega notas, preferencias o alertas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {client.clientNotes.map((note) => {
                      const typeConf = NOTE_TYPE_CONFIG[note.type] || NOTE_TYPE_CONFIG.NOTE;
                      const TypeIcon = typeConf.icon;
                      return (
                        <Card key={note.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className={`shrink-0 mt-0.5 flex items-center justify-center h-7 w-7 rounded-full ${typeConf.bgClass}`}>
                                <TypeIcon className={`h-3.5 w-3.5 ${typeConf.textClass}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] px-1.5 py-0 h-5 ${typeConf.bgClass} ${typeConf.textClass}`}
                                  >
                                    {typeConf.label}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground">
                                    {formatDate(note.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm" style={{ color: CHARCOAL }}>
                                  {note.content}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab 3: Citas */}
          <TabsContent value="appointments" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 space-y-5">
                {/* New Appointment Button */}
                <Button
                  onClick={() => setNewAptOpen(true)}
                  style={{ backgroundColor: ROSE_GOLD }}
                  className="text-white hover:opacity-90 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cita
                </Button>

                {/* Upcoming Appointments */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: CHARCOAL }}>
                    <Calendar className="h-4 w-4" style={{ color: ROSE_GOLD }} />
                    Próximas Citas
                  </h3>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No hay citas próximas</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingAppointments
                        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                        .map((apt) => {
                          const statusConf = APPOINTMENT_STATUS[apt.status] || APPOINTMENT_STATUS.PENDING;
                          return (
                            <Card key={apt.id} className="hover:shadow-sm transition-shadow">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-sm" style={{ color: CHARCOAL }}>
                                      {apt.service.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(apt.date)} · {apt.startTime} - {apt.endTime}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ${statusConf.bgClass} ${statusConf.textClass}`}
                                  >
                                    {statusConf.label}
                                  </Badge>
                                </div>
                                {apt.notes && (
                                  <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 rounded px-2 py-1">
                                    {apt.notes}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Past Appointments */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: CHARCOAL }}>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Citas Pasadas
                  </h3>
                  {pastAppointments.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No hay citas pasadas</p>
                  ) : (
                    <div className="space-y-2">
                      {pastAppointments
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((apt) => {
                          const statusConf = APPOINTMENT_STATUS[apt.status] || APPOINTMENT_STATUS.PENDING;
                          return (
                            <Card key={apt.id} className="hover:shadow-sm transition-shadow opacity-80">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-sm" style={{ color: CHARCOAL }}>
                                      {apt.service.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(apt.date)} · {apt.startTime} - {apt.endTime}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-medium" style={{ color: ROSE_GOLD }}>
                                      {formatCurrency(apt.service.price)}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className={`text-[10px] px-1.5 py-0 h-5 ${statusConf.bgClass} ${statusConf.textClass}`}
                                    >
                                      {statusConf.label}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <EditClientDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
        onSaved={fetchClient}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente{' '}
              <strong>{client.firstName} {client.lastName}</strong> y todas sus citas y notas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Appointment Dialog */}
      <NewAppointmentDialog
        open={newAptOpen}
        onOpenChange={setNewAptOpen}
        clientId={clientId}
        services={services}
        onCreated={fetchClient}
      />
    </div>
  );
}
