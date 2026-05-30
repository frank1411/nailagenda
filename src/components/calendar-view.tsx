'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  getDay,
} from 'date-fns';

import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  User,
  Scissors,
  Phone,
  StickyNote,
  AlertCircle,
  Check,
  XCircle,
  EyeOff,
  Trash2,
  Loader2,
  Search,
  GripVertical,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROSE_GOLD = '#B76E79';
const CHARCOAL = '#2D2D2D';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string }> = {
  PENDING: {
    label: 'Pendiente',
    color: '#eab308',
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  CONFIRMED: {
    label: 'Confirmada',
    color: '#22c55e',
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-300',
  },
  COMPLETED: {
    label: 'Completada',
    color: '#3b82f6',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
  },
  CANCELLED: {
    label: 'Cancelada',
    color: '#ef4444',
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-700 dark:text-red-300',
  },
  NO_SHOW: {
    label: 'No asistió',
    color: '#6b7280',
    bg: 'bg-gray-100 dark:bg-gray-900/40',
    text: 'text-gray-700 dark:text-gray-300',
  },
};

const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 8;
const END_HOUR = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

interface ServiceItem {
  id: string;
  name: string;
  duration: number;
  price: number;
  active: boolean;
}

interface AppointmentItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  client: { id: string; firstName: string; lastName: string; phone?: string | null };
  service: { id: string; name: string; duration: number; price: number };
}

interface CalendarViewProps {
  onSelectClient: (clientId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getMonday(date: Date): Date {
  const day = getDay(date);
  const diff = day === 0 ? 6 : day - 1;
  return addDays(date, -diff);
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function CalendarSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Month View
// ---------------------------------------------------------------------------

function MonthView({
  currentDate,
  appointments,
  selectedDate,
  onSelectDate,
  onSelectAppointment,
}: {
  currentDate: Date;
  appointments: AppointmentItem[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onSelectAppointment: (apt: AppointmentItem) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter((apt) => apt.date === dateStr);
  };

  return (
    <div className="rounded-lg border overflow-hidden bg-card">
      {/* Day names header */}
      <div className="grid grid-cols-7 bg-muted/50">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-b"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayApts = getAppointmentsForDay(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const statusColors = dayApts.slice(0, 2).map((a) => STATUS_CONFIG[a.status]?.color || '#6b7280');

          return (
            <div
              key={idx}
              className={`
                min-h-[80px] sm:min-h-[100px] border-b border-r p-1 sm:p-2 cursor-pointer transition-colors
                hover:bg-muted/30
                ${!isCurrentMonth ? 'bg-muted/20 opacity-50' : ''}
              `}
              onClick={() => onSelectDate(day)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelectDate(day); }}
            >
              <div className="flex items-center justify-center mb-1">
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full transition-colors
                    ${isCurrentDay ? 'text-white' : ''}
                    ${isSelected && !isCurrentDay ? 'text-white' : ''}
                  `}
                  style={{
                    backgroundColor: isCurrentDay
                      ? ROSE_GOLD
                      : isSelected
                        ? CHARCOAL
                        : 'transparent',
                  }}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-0.5 hidden sm:block">
                {dayApts.slice(0, 2).map((apt, i) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-1 text-[10px] leading-tight rounded px-1 py-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: `${statusColors[i]}18`,
                      borderLeft: `2px solid ${statusColors[i]}`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAppointment(apt);
                    }}
                  >
                    <span className="font-medium truncate" style={{ color: statusColors[i] }}>
                      {apt.startTime}
                    </span>
                    <span className="text-muted-foreground truncate">
                      {apt.client.firstName}
                    </span>
                  </div>
                ))}
                {dayApts.length > 2 && (
                  <div className="text-[10px] text-muted-foreground pl-1">
                    +{dayApts.length - 2} más
                  </div>
                )}
              </div>

              {/* Mobile: colored dots */}
              <div className="flex gap-0.5 justify-center sm:hidden">
                {dayApts.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: STATUS_CONFIG[apt.status]?.color || '#6b7280' }}
                  />
                ))}
                {dayApts.length > 3 && (
                  <span className="text-[8px] text-muted-foreground">+{dayApts.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Week View - Droppable Slot
// ---------------------------------------------------------------------------

function DroppableSlot({
  dayIndex,
  hour,
  isHalfHour,
  isLastRow,
  onClick,
}: {
  dayIndex: number;
  hour: number;
  isHalfHour: boolean;
  isLastRow: boolean;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${dayIndex}-${hour}-${isHalfHour ? '30' : '00'}`,
    data: { dayIndex, hour, isHalfHour },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative border-b border-r last:border-r-0 cursor-pointer transition-colors min-h-[30px]
        ${isOver ? 'bg-rose-100/50 dark:bg-rose-900/20' : 'hover:bg-muted/20'}
        ${isLastRow ? 'border-b-0' : ''}
      `}
      style={{ height: HOUR_HEIGHT / 2 }}
      onClick={onClick}
    >
      {/* 30-min separator (top half) */}
      <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-border/30" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Week View - Draggable Appointment
// ---------------------------------------------------------------------------

function DraggableAppointment({
  appointment,
  isDragging,
  onClick,
}: {
  appointment: AppointmentItem;
  isDragging: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: appointment.id,
    data: { appointment },
  });

  const style = useMemo(() => {
    const startMin = timeToMinutes(appointment.startTime);
    const endMin = timeToMinutes(appointment.endTime);
    const offsetMin = startMin - START_HOUR * 60;
    const durationMin = endMin - startMin;
    const top = (offsetMin / 60) * HOUR_HEIGHT;
    const height = Math.max((durationMin / 60) * HOUR_HEIGHT, 20);
    const t = transform
      ? { x: transform.x, y: transform.y }
      : { x: 0, y: 0 };
    return {
      top,
      height,
      transform: `translate3d(${t.x}px, ${t.y}px, 0)`,
    };
  }, [appointment, transform]);

  const color = STATUS_CONFIG[appointment.status]?.color || '#6b7280';

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 cursor-grab overflow-hidden z-10 transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-40 shadow-xl z-50' : ''
      }`}
      style={{
        ...style,
        backgroundColor: `${color}20`,
        borderLeft: `3px solid ${color}`,
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
    >
      <div className="flex items-start gap-1">
        <GripVertical className="h-3 w-3 mt-0.5 shrink-0 opacity-40" />
        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] sm:text-xs font-semibold truncate"
            style={{ color }}
          >
            {appointment.client.firstName} {appointment.client.lastName}
          </div>
          <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
            {appointment.service.name} · {formatTime12(appointment.startTime)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Week View
// ---------------------------------------------------------------------------

function WeekView({
  currentDate,
  appointments,
  onSelectAppointment,
  onEmptySlotClick,
  onDragEnd: onDragEndProp,
}: {
  currentDate: Date;
  appointments: AppointmentItem[];
  onSelectAppointment: (apt: AppointmentItem) => void;
  onEmptySlotClick: (date: Date, hour: number, isHalfHour: boolean) => void;
  onDragEnd: (aptId: string, dayIndex: number, hour: number, isHalfHour?: boolean) => Promise<void>;
}) {
  const weekStart = getMonday(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const halfHours = Array.from({ length: TOTAL_HOURS * 2 }, (_, i) => i); // 30-min slots

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter((apt) => apt.date === dateStr);
  };

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active) return;

    const aptId = String(active.id);
    const overData = over.data.current;
    if (!overData) return;

    const { dayIndex, hour, isHalfHour } = overData as { dayIndex: number; hour: number; isHalfHour: boolean };
    await onDragEndProp(aptId, dayIndex, hour, isHalfHour);
  };

  const activeAppointment = activeId
    ? appointments.find((a) => a.id === activeId) ?? null
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="rounded-lg border overflow-hidden bg-card">
        {/* Day headers */}
        <div className="grid border-b bg-muted/30" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          <div className="px-1 py-2 text-center text-xs text-muted-foreground border-r" />
          {weekDays.map((day, i) => {
            const isCurrentDay = isToday(day);
            return (
              <div
                key={i}
                className="px-1 py-2 text-center border-r last:border-r-0"
              >
                <div className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">
                  {DAY_NAMES[i]}
                </div>
                <div
                  className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 text-sm sm:text-base font-bold rounded-full mt-0.5 ${
                    isCurrentDay ? 'text-white' : ''
                  }`}
                  style={{ backgroundColor: isCurrentDay ? ROSE_GOLD : 'transparent' }}
                >
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid with scroll */}
        <ScrollArea className="h-[500px] sm:h-[600px]">
          <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
            {/* Time labels column */}
            <div className="border-r">
              {Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i).map((hour) => (
                <div
                  key={hour}
                  className="relative text-[10px] sm:text-xs text-muted-foreground text-right pr-2 border-b"
                  style={{ height: HOUR_HEIGHT }}
                >
                  <span className="absolute -top-2 right-2">
                    {formatTime12(`${String(hour).padStart(2, '0')}:00`)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns with droppable slots and draggable appointments */}
            {weekDays.map((day, dayIdx) => {
              const dayApts = getAppointmentsForDay(day);

              return (
                <div key={dayIdx} className="relative border-r last:border-r-0">
                  {/* Droppable half-hour slots */}
                  {halfHours.map((slotIdx) => {
                    const hour = START_HOUR + Math.floor(slotIdx / 2);
                    const isHalfHour = slotIdx % 2 === 1;
                    const isLastRow = slotIdx === halfHours.length - 1;
                    return (
                      <DroppableSlot
                        key={slotIdx}
                        dayIndex={dayIdx}
                        hour={hour}
                        isHalfHour={isHalfHour}
                        isLastRow={isLastRow}
                        onClick={() => onEmptySlotClick(day, hour, isHalfHour)}
                      />
                    );
                  })}

                  {/* Appointments overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {dayApts.map((apt) => (
                      <div key={apt.id} className="pointer-events-auto">
                        <DraggableAppointment
                          appointment={apt}
                          isDragging={activeId === apt.id}
                          onClick={() => onSelectAppointment(apt)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeAppointment ? (
          <div
            className="rounded-lg px-3 py-2 shadow-xl w-52 border bg-background"
            style={{
              borderLeft: `4px solid ${STATUS_CONFIG[activeAppointment.status]?.color || '#6b7280'}`,
            }}
          >
            <div className="flex items-start gap-1.5">
              <GripVertical className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: STATUS_CONFIG[activeAppointment.status]?.color || '#6b7280' }}
                >
                  {activeAppointment.client.firstName} {activeAppointment.client.lastName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {activeAppointment.service.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTime12(activeAppointment.startTime)} - {formatTime12(activeAppointment.endTime)}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ---------------------------------------------------------------------------
// New Appointment Dialog
// ---------------------------------------------------------------------------

function NewAppointmentDialog({
  open,
  onOpenChange,
  clients,
  services,
  initialDate,
  initialHour,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientItem[];
  services: ServiceItem[];
  initialDate: Date | null;
  initialHour: number | null;
  onCreated: () => void;
}) {
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setClientId('');
      setServiceId('');
      setDate(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      setStartTime(initialHour ? `${String(Math.floor(initialHour)).padStart(2, '0')}:${initialHour % 1 !== 0 ? '30' : '00'}` : '09:00');
      setNotes('');
      setClientSearch('');
    }
  }, [open, initialDate, initialHour]);

  const selectedService = services.find((s) => s.id === serviceId);
  const endTime = useMemo(() => {
    if (!selectedService || !startTime) return '';
    const startMin = timeToMinutes(startTime);
    return minutesToTime(startMin + selectedService.duration);
  }, [selectedService, startTime]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [clients, clientSearch]);

  const handleSubmit = async () => {
    if (!clientId || !serviceId || !date || !startTime || !endTime) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    setSubmitting(true);
    try {
      await api.createAppointment({
        clientId,
        serviceId,
        date,
        startTime,
        endTime,
        notes: notes || undefined,
      });
      toast.success('Cita creada exitosamente');
      onOpenChange(false);
      onCreated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la cita';
      if (message.includes('overlaps') || message.includes('409')) {
        toast.error('Conflicto: ya existe una cita en ese horario');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: CHARCOAL }}>Nueva Cita</DialogTitle>
          <DialogDescription>Programa una nueva cita para un cliente</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Client selector */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-8 mb-1"
              />
            </div>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {filteredClients.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    No se encontraron clientes
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                      {client.phone ? ` · ${client.phone}` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Service selector */}
          <div className="space-y-2">
            <Label>Servicio *</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} · {service.duration}min · {formatCurrency(service.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hora inicio *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {/* End time (auto-calculated) */}
          {endTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              <Clock className="h-4 w-4" />
              <span>
                Hasta las <strong>{formatTime12(endTime)}</strong>
                {selectedService && ` (${selectedService.duration} min)`}
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Notas opcionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !clientId || !serviceId}
            style={{ backgroundColor: ROSE_GOLD }}
            className="text-white hover:opacity-90"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Cita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Appointment Detail Dialog
// ---------------------------------------------------------------------------

interface AppointmentDetailDialogProps {
  appointment: AppointmentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (updatedApt?: AppointmentItem) => void;
  onDeleted: () => void;
  onSelectClient: (clientId: string) => void;
}

function AppointmentDetailDialog({
  appointment,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
  onSelectClient,
}: AppointmentDetailDialogProps) {
  const [updating, setUpdating] = useState(false);

  if (!appointment) return null;

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    const previousAppointment = { ...appointment };

    try {
      // Optimistic Update: trigger parent update immediately
      onUpdated({ ...appointment, status: newStatus });
      
      await api.updateAppointment(appointment.id, { status: newStatus });
      toast.success(`Estado actualizado a "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
      onOpenChange(false);
    } catch (err: unknown) {
      // Revert in parent
      onUpdated(previousAppointment);
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setUpdating(false);
    }
  };


  const handleDelete = async () => {
    setUpdating(true);
    try {
      await api.deleteAppointment(appointment.id);
      toast.success('Cita eliminada');
      onDeleted();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: CHARCOAL }}>Detalle de Cita</DialogTitle>
          <DialogDescription>
            {format(parseISO(appointment.date + 'T00:00:00'), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Client info */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => {
              onSelectClient(appointment.client.id);
              onOpenChange(false);
            }}
            role="button"
            tabIndex={0}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{ backgroundColor: `${ROSE_GOLD}20` }}
            >
              <User className="h-5 w-5" style={{ color: ROSE_GOLD }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm" style={{ color: CHARCOAL }}>
                {appointment.client.firstName} {appointment.client.lastName}
              </p>
              {appointment.client.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Phone className="h-3 w-3" />
                  {appointment.client.phone}
                </div>
              )}
            </div>
          </div>

          {/* Service info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{ backgroundColor: `${CHARCOAL}15` }}
            >
              <Scissors className="h-5 w-5" style={{ color: CHARCOAL }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm" style={{ color: CHARCOAL }}>
                {appointment.service.name}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {appointment.service.duration} min
                </span>
                <span>{formatCurrency(appointment.service.price)}</span>
              </div>
            </div>
          </div>

          {/* Time & Status */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {formatTime12(appointment.startTime)} - {formatTime12(appointment.endTime)}
            </span>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <StatusBadge status={appointment.status} />
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/30">
              <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{appointment.notes}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {appointment.status === 'PENDING' && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/30"
              onClick={() => handleStatusChange('CONFIRMED')}
              disabled={updating}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Confirmar
            </Button>
          )}
          {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
            <Button
              size="sm"
              variant="outline"
              className="text-blue-700 border-blue-300 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/30"
              onClick={() => handleStatusChange('COMPLETED')}
              disabled={updating}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Completar
            </Button>
          )}
          {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/30"
              onClick={() => handleStatusChange('CANCELLED')}
              disabled={updating}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Cancelar
            </Button>
          )}
          {appointment.status !== 'NO_SHOW' && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
            <Button
              size="sm"
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-900/30"
              onClick={() => handleStatusChange('NO_SHOW')}
              disabled={updating}
            >
              <EyeOff className="h-3.5 w-3.5 mr-1" />
              No asistió
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 ml-auto dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
            onClick={handleDelete}
            disabled={updating}
          >
            {updating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Day Panel (side panel for selected day in month view)
// ---------------------------------------------------------------------------

function DayPanel({
  date,
  appointments,
  onSelectAppointment,
  onNewAppointment,
  onClose,
}: {
  date: Date;
  appointments: AppointmentItem[];
  onSelectAppointment: (apt: AppointmentItem) => void;
  onNewAppointment: () => void;
  onClose: () => void;
}) {
  const dayApts = appointments
    .filter((apt) => apt.date === format(date, 'yyyy-MM-dd'))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: CHARCOAL }}>
            <Calendar className="h-4 w-4" style={{ color: ROSE_GOLD }} />
            <span className="capitalize">
              {format(date, "EEEE d 'de' MMMM", { locale: es })}
            </span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {dayApts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">Sin citas</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={onNewAppointment}
              style={{ borderColor: ROSE_GOLD, color: ROSE_GOLD }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Agregar cita
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-72">
            <div className="space-y-2 pr-1">
              {dayApts.map((apt) => {
                const color = STATUS_CONFIG[apt.status]?.color || '#6b7280';
                return (
                  <div
                    key={apt.id}
                    className="flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onSelectAppointment(apt)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSelectAppointment(apt); }}
                  >
                    <div
                      className="w-1 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: CHARCOAL }}>
                        {apt.client.firstName} {apt.client.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {apt.service.name} · {formatTime12(apt.startTime)} - {formatTime12(apt.endTime)}
                      </p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main CalendarView Component
// ---------------------------------------------------------------------------

export default function CalendarView({ onSelectClient }: CalendarViewProps) {
  // -- State --
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [newAptOpen, setNewAptOpen] = useState(false);
  const [newAptDate, setNewAptDate] = useState<Date | null>(null);
  const [newAptHour, setNewAptHour] = useState<number | null>(null);
  const [detailApt, setDetailApt] = useState<AppointmentItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // -- Computed date ranges --
  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') };
    } else {
      const weekStart = getMonday(currentDate);
      const weekEnd = addDays(weekStart, 6);
      return { startDate: format(weekStart, 'yyyy-MM-dd'), endDate: format(weekEnd, 'yyyy-MM-dd') };
    }
  }, [currentDate, viewMode]);

  const weekStart = useMemo(() => getMonday(currentDate), [currentDate]);

  // -- Fetch data --
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getAppointments({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      setAppointments(result || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const fetchClients = useCallback(async () => {
    try {
      const result = await api.getClients();
      setClients(result || []);
    } catch {
      // Silent - clients will be empty
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const result = await api.getServices();
      setServices(result || []);
    } catch {
      // Silent - services will be empty
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchClients();
    fetchServices();
  }, [fetchClients, fetchServices]);

  // -- Navigation --
  const goPrev = () => {
    setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : addDays(currentDate, -7));
  };

  const goNext = () => {
    setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addDays(currentDate, 7));
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  // -- Handlers --
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSelectAppointment = (apt: AppointmentItem) => {
    setDetailApt(apt);
    setDetailOpen(true);
  };

  const handleEmptySlotClick = (date: Date, hour: number, isHalfHour: boolean) => {
    setNewAptDate(date);
    setNewAptHour(isHalfHour ? hour + 0.5 : hour);
    setNewAptOpen(true);
  };

  const handleNewAptClick = () => {
    setNewAptDate(selectedDate || new Date());
    setNewAptHour(null);
    setNewAptOpen(true);
  };

  const handleDragEnd = async (aptId: string, dayIndex: number, hour: number, isHalfHour?: boolean) => {
    const apt = appointments.find((a) => a.id === aptId);
    if (!apt) return;

    const newDate = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
    const startMin = timeToMinutes(apt.startTime);
    const durationMin = timeToMinutes(apt.endTime) - startMin;
    const newStartMin = hour * 60 + (isHalfHour ? 30 : 0);
    const newStartTime = minutesToTime(newStartMin);
    const newEndTime = minutesToTime(newStartMin + durationMin);

    if (apt.date === newDate && apt.startTime === newStartTime) return;

    // --- OPTIMISTIC UPDATE ---
    const previousAppointments = [...appointments];
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === aptId
          ? { ...a, date: newDate, startTime: newStartTime, endTime: newEndTime }
          : a
      )
    );

    try {
      await api.updateAppointment(aptId, {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
      });
      toast.success('Cita movida');
    } catch (err: unknown) {
      // Revert on error
      setAppointments(previousAppointments);
      const message = err instanceof Error ? err.message : 'Error al mover la cita';
      if (message.includes('overlaps') || message.includes('409')) {
        toast.error('Conflicto: la cita se superpone con otra existente');
      } else {
        toast.error(message);
      }
    }
  };

  const handleAppointmentUpdated = (updatedApt?: AppointmentItem) => {
    if (updatedApt) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === updatedApt.id ? updatedApt : a))
      );
    } else {
      fetchAppointments();
    }
  };

  // -- Title text --
  const titleText = viewMode === 'month'
    ? format(currentDate, 'MMMM yyyy', { locale: es })
    : (() => {
        const ws = getMonday(currentDate);
        const we = addDays(ws, 6);
        return `${format(ws, 'd MMM', { locale: es })} - ${format(we, 'd MMM yyyy', { locale: es })}`;
      })();

  // -- Render --
  if (loading && appointments.length === 0) {
    return <CalendarSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Error al cargar</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button
          onClick={fetchAppointments}
          style={{ backgroundColor: ROSE_GOLD }}
          className="text-white hover:opacity-90"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Prev */}
          <Button variant="outline" size="icon" onClick={goPrev} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Title */}
          <h2
            className="text-lg sm:text-xl font-bold capitalize min-w-[180px] text-center"
            style={{ color: CHARCOAL }}
          >
            {titleText}
          </h2>

          {/* Next */}
          <Button variant="outline" size="icon" onClick={goNext} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Today */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToday}
            className="ml-1 text-xs font-medium"
            style={{ borderColor: ROSE_GOLD, color: ROSE_GOLD }}
          >
            Hoy
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week')}>
            <TabsList>
              <TabsTrigger value="month" className="text-xs px-3">Mes</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3">Semana</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* New appointment */}
          <Button
            size="sm"
            onClick={handleNewAptClick}
            style={{ backgroundColor: ROSE_GOLD }}
            className="text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Nueva Cita</span>
            <span className="sm:hidden">Cita</span>
          </Button>
        </div>
      </div>

      {/* ===================== CALENDAR BODY ===================== */}
      <div className={selectedDate && viewMode === 'month' ? 'grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4' : ''}>
        {/* Main calendar */}
        <div>
          {viewMode === 'month' ? (
            <MonthView
              currentDate={currentDate}
              appointments={appointments}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onSelectAppointment={handleSelectAppointment}
            />
          ) : (
            <WeekView
              currentDate={currentDate}
              appointments={appointments}
              onSelectAppointment={handleSelectAppointment}
              onEmptySlotClick={handleEmptySlotClick}
              onDragEnd={handleDragEnd}
            />
          )}
        </div>

        {/* Side panel for selected day (month view only) */}
        {selectedDate && viewMode === 'month' && (
          <DayPanel
            date={selectedDate}
            appointments={appointments}
            onSelectAppointment={handleSelectAppointment}
            onNewAppointment={() => {
              setNewAptDate(selectedDate);
              setNewAptHour(null);
              setNewAptOpen(true);
            }}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </div>

      {/* ===================== LEGEND ===================== */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      {/* ===================== DIALOGS ===================== */}
      <NewAppointmentDialog
        open={newAptOpen}
        onOpenChange={setNewAptOpen}
        clients={clients}
        services={services}
        initialDate={newAptDate}
        initialHour={newAptHour}
        onCreated={fetchAppointments}
      />

      <AppointmentDetailDialog
        appointment={detailApt}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={handleAppointmentUpdated}
        onDeleted={handleAppointmentUpdated}
        onSelectClient={onSelectClient}
      />
    </div>
  );
}
