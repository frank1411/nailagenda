'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  Clock,
  GripVertical,
  Phone,
  Scissors,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  status: string;
  updatedAt: string;
  appointments: {
    id: string;
    date: string;
    startTime: string;
    service: { name: string; price: number };
  }[];
}

interface TodayAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  client: { id: string; firstName: string; lastName: string };
  service: { id: string; name: string; price: number };
}

interface RecentActivity {
  id: string;
  date: string;
  startTime: string;
  status: string;
  updatedAt: string;
  client: { id: string; firstName: string; lastName: string };
  service: { id: string; name: string };
}

interface DashboardData {
  totalClients: number;
  clientsByStatus: { NEW: number; RECURRING: number; INACTIVE: number };
  todayAppointments: TodayAppointment[];
  weekRevenue: number;
  recentActivity: RecentActivity[];
  clientsByStatusList: ClientItem[];
}

interface DashboardViewProps {
  onSelectClient: (clientId: string) => void;
}

type ClientStatus = 'NEW' | 'RECURRING' | 'INACTIVE';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLUMNS: { id: ClientStatus; label: string; color: string; bg: string; border: string; headerBg: string; headerText: string; badgeBg: string; badgeText: string }[] = [
  {
    id: 'NEW',
    label: 'Nuevos',
    color: '#22c55e',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    headerBg: 'bg-green-100 dark:bg-green-900/50',
    headerText: 'text-green-700 dark:text-green-300',
    badgeBg: 'bg-green-100 dark:bg-green-900/50',
    badgeText: 'text-green-700 dark:text-green-300',
  },
  {
    id: 'RECURRING',
    label: 'Recurrentes',
    color: '#f59e0b',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    headerBg: 'bg-amber-100 dark:bg-amber-900/50',
    headerText: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
  {
    id: 'INACTIVE',
    label: 'Inactivos',
    color: '#ef4444',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    headerBg: 'bg-red-100 dark:bg-red-900/50',
    headerText: 'text-red-700 dark:text-red-300',
    badgeBg: 'bg-red-100 dark:bg-red-900/50',
    badgeText: 'text-red-700 dark:text-red-300',
  },
];

const ROSE_GOLD = '#B76E79';
const CHARCOAL = '#2D2D2D';

// ---------------------------------------------------------------------------
// Helper: format currency
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Helper: format date/time
// ---------------------------------------------------------------------------

function formatTime(time: string): string {
  return time;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin}m`;
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return formatDate(dateStr);
}

// ---------------------------------------------------------------------------
// Appointment status badge
// ---------------------------------------------------------------------------

function AppointmentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' },
    CONFIRMED: { label: 'Confirmada', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
    COMPLETED: { label: 'Completada', className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
    CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
    NO_SHOW: { label: 'No asistió', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300' },
  };
  const c = config[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sortable client card (inside tablero columns)
// ---------------------------------------------------------------------------

function SortableClientCard({
  client,
  onSelectClient,
  colConfig,
}: {
  client: ClientItem;
  onSelectClient: (id: string) => void;
  colConfig: typeof STATUS_COLUMNS[number];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lastApt = client.appointments?.[0];
  const displayName = `${client.firstName} ${client.lastName}`;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...(isDragging ? { outline: `2px solid ${colConfig.color}`, outlineOffset: '2px' } : {}),
      }}
      className={`group rounded-lg border bg-white dark:bg-gray-900 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground shrink-0 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Mover tarjeta"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content */}
        <div
          className="flex-1 min-w-0"
          onClick={() => onSelectClient(client.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onSelectClient(client.id); }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate" style={{ color: CHARCOAL }}>
              {displayName}
            </span>
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold shrink-0 ${colConfig.badgeBg} ${colConfig.badgeText}`}>
              {colConfig.label}
            </span>
          </div>

          {client.phone && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.phone}</span>
            </div>
          )}

          {lastApt && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Scissors className="h-3 w-3 shrink-0" />
              <span className="truncate">{lastApt.service.name}</span>
              <span className="text-muted-foreground/60">·</span>
              <span>{formatDate(lastApt.date)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drag overlay card (ghost while dragging)
// ---------------------------------------------------------------------------

function DragOverlayCard({ client }: { client: ClientItem | null }) {
  if (!client) return null;
  const displayName = `${client.firstName} ${client.lastName}`;
  const col = STATUS_COLUMNS.find((c) => c.id === client.status) || STATUS_COLUMNS[0];
  const lastApt = client.appointments?.[0];

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 p-3 shadow-xl w-64">
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate" style={{ color: CHARCOAL }}>
              {displayName}
            </span>
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold shrink-0 ${col.badgeBg} ${col.badgeText}`}>
              {col.label}
            </span>
          </div>
          {client.phone && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.phone}</span>
            </div>
          )}
          {lastApt && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Scissors className="h-3 w-3 shrink-0" />
              <span className="truncate">{lastApt.service.name}</span>
              <span className="text-muted-foreground/60">·</span>
              <span>{formatDate(lastApt.date)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeletons
// ---------------------------------------------------------------------------

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableroSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, col) => (
            <div key={col} className="rounded-xl border p-3 space-y-3">
              <Skeleton className="h-8 w-24" />
              {Array.from({ length: 3 }).map((_, card) => (
                <div key={card} className="rounded-lg border p-3 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BottomSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DashboardView component
// ---------------------------------------------------------------------------

export default function DashboardView({ onSelectClient }: DashboardViewProps) {
  // -- State --
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tablero: local state for client items (supports DnD reordering & moves)
  const [tableroClients, setTableroClients] = useState<ClientItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // -- Fetch data --
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getDashboard();
      setData(result);
      setTableroClients(result.clientsByStatusList || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar el dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // -- DnD sensors --
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // -- Tablero helpers --
  const getColumnClients = useCallback(
    (status: ClientStatus) =>
      tableroClients.filter((c) => c.status === status),
    [tableroClients]
  );

  const findClientColumn = useCallback(
    (id: string): ClientStatus | null => {
      const client = tableroClients.find((c) => c.id === id);
      if (!client) return null;
      return client.status as ClientStatus;
    },
    [tableroClients]
  );

  // -- DnD handlers --
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeCol = findClientColumn(activeId);
    if (!activeCol) return;

    // Determine the target column
    let overCol = findClientColumn(overId);

    // If overId is not a client, it might be the column itself — check STATUS_COLUMNS
    if (!overCol) {
      const colMatch = STATUS_COLUMNS.find((c) => c.id === overId);
      if (colMatch) overCol = colMatch.id as ClientStatus;
    }

    if (!overCol || activeCol === overCol) return;

    // Move client to new column
    setTableroClients((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, status: overCol! } : c))
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeCol = findClientColumn(activeId);
    if (!activeCol) return;

    const overCol = findClientColumn(overId);

    // Same column reorder
    if (activeCol === overCol || !overCol) {
      if (activeId !== overId && overCol) {
        const colClients = getColumnClients(activeCol);
        const oldIndex = colClients.findIndex((c) => c.id === activeId);
        const newIndex = colClients.findIndex((c) => c.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(colClients, oldIndex, newIndex);
          // Rebuild full list: replace the column items
          setTableroClients((prev) => {
            const otherItems = prev.filter((c) => c.status !== activeCol);
            return [...otherItems, ...reordered];
          });
        }
      }
      return;
    }

    // Cross-column: the item was already moved in handleDragOver, now persist via API
    const client = tableroClients.find((c) => c.id === activeId);
    if (client && client.status !== activeCol) {
      // Client has already been moved locally; persist the new status
      try {
        await api.updateClient(activeId, { status: client.status });
      } catch {
        // Revert on error
        setTableroClients((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, status: activeCol } : c))
        );
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // -- Active client for drag overlay --
  const activeClient = activeId
    ? tableroClients.find((c) => c.id === activeId) ?? null
    : null;

  // -- Computed stats --
  const newClientsCount = data?.clientsByStatus?.NEW ?? 0;
  const todayAptsCount = data?.todayAppointments?.length ?? 0;

  // -- Render: Loading --
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <StatsSkeleton />
        <TableroSkeleton />
        <BottomSkeleton />
      </div>
    );
  }

  // -- Render: Error --
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Error al cargar</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: ROSE_GOLD }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  // -- Render: Dashboard --
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* ===================== STATS ROW ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clientes */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center h-12 w-12 rounded-xl"
                style={{ backgroundColor: `${CHARCOAL}15` }}
              >
                <Users className="h-6 w-6" style={{ color: CHARCOAL }} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>
                  {data?.totalClients ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clientes Nuevos */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/40">
                <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes Nuevos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {newClientsCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Citas Hoy */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/40">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Citas Hoy</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {todayAptsCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingresos Semana */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos últ 7 días</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(data?.weekRevenue ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===================== TABLERO BOARD ===================== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: CHARCOAL }}>
            <Users className="h-5 w-5" style={{ color: ROSE_GOLD }} />
            Tablero de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STATUS_COLUMNS.map((col) => {
                const colClients = getColumnClients(col.id);
                return (
                  <div
                    key={col.id}
                    className={`rounded-xl border ${col.border} ${col.bg} p-3 flex flex-col min-h-[300px]`}
                  >
                    {/* Column header */}
                    <div
                      className={`flex items-center justify-between rounded-lg px-3 py-2 mb-3 ${col.headerBg}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: col.color }}
                        />
                        <span className={`font-semibold text-sm ${col.headerText}`}>
                          {col.label}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${col.badgeBg} ${col.badgeText} border-0`}
                      >
                        {colClients.length}
                      </Badge>
                    </div>

                    {/* Sortable items */}
                    <SortableContext
                      items={colClients.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ScrollArea className="flex-1">
                        <div className="space-y-2 pr-1">
                          {colClients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                              <Users className="h-8 w-8 mb-2 opacity-30" />
                              <p className="text-xs">Sin clientes</p>
                            </div>
                          ) : (
                            colClients.map((client) => (
                              <SortableClientCard
                                key={client.id}
                                client={client}
                                onSelectClient={onSelectClient}
                                colConfig={col}
                              />
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </SortableContext>
                  </div>
                );
              })}
            </div>

            <DragOverlay>
              <DragOverlayCard client={activeClient} />
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>

      {/* ===================== BOTTOM SECTION ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Citas de Hoy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: CHARCOAL }}>
              <Calendar className="h-5 w-5" style={{ color: ROSE_GOLD }} />
              Citas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.todayAppointments || data.todayAppointments.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">No hay citas para hoy</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-3 pr-1">
                  {data.todayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => onSelectClient(apt.client.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') onSelectClient(apt.client.id); }}
                    >
                      {/* Time */}
                      <div className="flex flex-col items-center shrink-0 w-14">
                        <Clock className="h-4 w-4 text-muted-foreground mb-0.5" />
                        <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                          {formatTime(apt.startTime)}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-10 bg-border shrink-0" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: CHARCOAL }}>
                          {apt.client.firstName} {apt.client.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {apt.service.name}
                        </p>
                      </div>

                      {/* Status */}
                      <AppointmentStatusBadge status={apt.status} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: CHARCOAL }}>
              <Clock className="h-5 w-5" style={{ color: ROSE_GOLD }} />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!data?.recentActivity || data.recentActivity.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Sin actividad reciente</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-3 pr-1">
                  {data.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      {/* Status icon */}
                      <div className="shrink-0 mt-0.5">
                        <AppointmentStatusBadge status={activity.status} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: CHARCOAL }}>
                          {activity.client.firstName} {activity.client.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.service.name} · {formatDate(activity.date)} a las {formatTime(activity.startTime)}
                        </p>
                      </div>

                      {/* Timestamp */}
                      <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
                        {formatRelativeTime(activity.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
