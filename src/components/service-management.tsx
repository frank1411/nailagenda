'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Scissors,
  Clock,
   DollarSign,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  Search,
  X,
} from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROSE_GOLD = '#B76E79';
const CHARCOAL = '#2D2D2D';

type ServiceCategory = 'HAIRCUT' | 'COLORING' | 'STYLING' | 'TREATMENT' | 'GENERAL';

const CATEGORY_CONFIG: Record<ServiceCategory, {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  HAIRCUT: {
    label: 'Corte',
    bgClass: 'bg-rose-100 dark:bg-rose-900/50',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-200 dark:border-rose-800',
  },
  COLORING: {
    label: 'Coloración',
    bgClass: 'bg-purple-100 dark:bg-purple-900/50',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-800',
  },
  STYLING: {
    label: 'Styling',
    bgClass: 'bg-amber-100 dark:bg-amber-900/50',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
  TREATMENT: {
    label: 'Tratamiento',
    bgClass: 'bg-green-100 dark:bg-green-900/50',
    textClass: 'text-green-700 dark:text-green-300',
    borderClass: 'border-green-200 dark:border-green-800',
  },
  GENERAL: {
    label: 'General',
    bgClass: 'bg-gray-100 dark:bg-gray-900/50',
    textClass: 'text-gray-700 dark:text-gray-300',
    borderClass: 'border-gray-200 dark:border-gray-800',
  },
};

type FilterTab = 'ALL' | ServiceCategory;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'HAIRCUT', label: 'Corte' },
  { id: 'COLORING', label: 'Coloración' },
  { id: 'STYLING', label: 'Styling' },
  { id: 'TREATMENT', label: 'Tratamiento' },
  { id: 'GENERAL', label: 'General' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Service Form Dialog
// ---------------------------------------------------------------------------

interface ServiceFormData {
  name: string;
  category: ServiceCategory;
  duration: number;
  price: number;
  description: string;
  active: boolean;
}

const EMPTY_FORM: ServiceFormData = {
  name: '',
  category: 'GENERAL',
  duration: 30,
  price: 0,
  description: '',
  active: true,
};

function ServiceFormDialog({
  open,
  onOpenChange,
  editingService,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingService: ServiceItem | null;
  onSave: (data: ServiceFormData, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or editingService changes
  useEffect(() => {
    if (open) {
      if (editingService) {
        setForm({
          name: editingService.name,
          category: editingService.category as ServiceCategory,
          duration: editingService.duration,
          price: editingService.price,
          description: editingService.description || '',
          active: editingService.active,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError(null);
      setSaving(false);
    }
  }, [open, editingService]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('El nombre del servicio es obligatorio');
      return;
    }
    if (form.duration <= 0) {
      setError('La duración debe ser mayor a 0 minutos');
      return;
    }
    if (form.price < 0) {
      setError('El precio no puede ser negativo');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        ...form,
        description: form.description.trim() || '',
      }, editingService?.id);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar servicio';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg" style={{ color: CHARCOAL }}>
            <Scissors className="h-5 w-5" style={{ color: ROSE_GOLD }} />
            {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="serviceName">Nombre *</Label>
            <Input
              id="serviceName"
              placeholder="Corte de Pelo"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="serviceCategory">Categoría</Label>
            <Select
              value={form.category}
              onValueChange={(value) => setForm((f) => ({ ...f, category: value as ServiceCategory }))}
            >
              <SelectTrigger id="serviceCategory">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration & Price row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceDuration">Duración (min)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="serviceDuration"
                  type="number"
                  min={1}
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
               <Label htmlFor="servicePrice">Precio ($)</Label>
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="servicePrice"
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="serviceDescription">Descripción</Label>
            <Textarea
              id="serviceDescription"
              placeholder="Descripción del servicio (opcional)..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="serviceActive" className="cursor-pointer">Servicio Activo</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Los servicios inactivos no aparecerán al crear citas
              </p>
            </div>
            <Switch
              id="serviceActive"
              checked={form.active}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
                <Scissors className="h-4 w-4 mr-2" />
                {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Dialog
// ---------------------------------------------------------------------------

function DeleteServiceDialog({
  open,
  onOpenChange,
  service,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceItem | null;
  onDelete: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!service) return;
    setDeleting(true);
    try {
      await onDelete(service.id);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar servicio';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
          <AlertDialogDescription>
            Se desactivará el servicio <strong>&quot;{service?.name}&quot;</strong>. Los servicios
            desactivados no aparecerán al crear nuevas citas, pero el historial de citas existentes
            no se verá afectado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Service Card
// ---------------------------------------------------------------------------

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: ServiceItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const categoryConfig = CATEGORY_CONFIG[service.category as ServiceCategory] || CATEGORY_CONFIG.GENERAL;

  return (
    <Card className="group transition-all hover:shadow-md">
      <CardContent className="p-4">
        {/* Top row: Name + Category Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-sm truncate" style={{ color: CHARCOAL }}>
            {service.name}
          </h3>
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ${categoryConfig.bgClass} ${categoryConfig.textClass}`}
          >
            {categoryConfig.label}
          </Badge>
        </div>

        {/* Duration & Price row */}
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{service.duration} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: CHARCOAL }}>
             <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span>{formatCurrency(service.price)}</span>
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {service.description}
          </p>
        )}

        {!service.description && <div className="mb-3" />}

        {/* Bottom row: Status + Actions */}
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 h-5 ${
              service.active
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400'
            }`}
          >
            {service.active ? 'Activo' : 'Inactivo'}
          </Badge>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onEdit}
              aria-label="Editar servicio"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={onDelete}
              aria-label="Eliminar servicio"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function ServiceCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-4 mb-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-3 w-full mb-3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-12 rounded-full" />
          <div className="flex gap-1">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main ServiceManagement Component
// ---------------------------------------------------------------------------

export default function ServiceManagement() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getServices();
      setServices(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar servicios';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Filtered services
  const filteredServices = services.filter((s) => {
    const matchesCategory = activeFilter === 'ALL' || s.category === activeFilter;
    const matchesSearch =
      !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Category counts
  const categoryCounts = {
    ALL: services.length,
    HAIRCUT: services.filter((s) => s.category === 'HAIRCUT').length,
    COLORING: services.filter((s) => s.category === 'COLORING').length,
    STYLING: services.filter((s) => s.category === 'STYLING').length,
    TREATMENT: services.filter((s) => s.category === 'TREATMENT').length,
    GENERAL: services.filter((s) => s.category === 'GENERAL').length,
  };

  // Handlers
  const handleSaveService = async (formData: ServiceFormData, id?: string) => {
    const previousServices = [...services];
    
    try {
      if (id) {
        // Update
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...formData } : s))
        );
        await api.updateService(id, formData);
        toast.success('Servicio actualizado correctamente');
      } else {
        // Create
        const tempId = `temp-${Date.now()}`;
        const newService: ServiceItem = {
          ...formData,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setServices((prev) => [...prev, newService]);
        
        const created = await api.createService(formData);
        setServices((prev) => prev.map((s) => (s.id === tempId ? created : s)));
        toast.success('Servicio creado correctamente');
      }
    } catch (err) {
      setServices(previousServices);
      throw err;
    }
  };

  const handleDeleteService = async (id: string) => {
    const previousServices = [...services];
    setServices((prev) => prev.filter((s) => s.id !== id));
    try {
      await api.deleteService(id);
      toast.success('Servicio eliminado correctamente');
    } catch (err) {
      setServices(previousServices);
      throw err;
    }
  };

  const handleEdit = (service: ServiceItem) => {
    setEditingService(service);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const handleDeleteConfirm = (service: ServiceItem) => {
    setDeleteTarget(service);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3">
          <Scissors className="h-5 w-5" style={{ color: ROSE_GOLD }} />
          <h2 className="text-xl font-bold" style={{ color: CHARCOAL }}>
            Servicios
          </h2>
          <Badge
            variant="secondary"
            className="text-xs h-6 px-2"
            style={{ backgroundColor: `${ROSE_GOLD}20`, color: ROSE_GOLD }}
          >
            {categoryCounts.ALL}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={handleNew}
          style={{ backgroundColor: ROSE_GOLD }}
          className="text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Nuevo Servicio</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="px-4 sm:px-6 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar servicios..."
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

      {/* Category Filter Tabs */}
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
                  {categoryCounts[tab.id as keyof typeof categoryCounts] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Service Grid */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ServiceCardSkeleton key={i} />
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
              onClick={fetchServices}
            >
              Reintentar
            </Button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
            <Scissors className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              {search || activeFilter !== 'ALL'
                ? 'No se encontraron servicios'
                : 'Sin servicios aún'}
            </p>
            <p className="text-xs text-muted-foreground">
              {search || activeFilter !== 'ALL'
                ? 'Prueba con otros filtros o búsqueda'
                : 'Agrega tu primer servicio para comenzar'}
            </p>
            {!search && activeFilter === 'ALL' && (
              <Button
                size="sm"
                className="mt-4 text-white hover:opacity-90"
                style={{ backgroundColor: ROSE_GOLD }}
                onClick={handleNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Servicio
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={() => handleEdit(service)}
                  onDelete={() => handleDeleteConfirm(service)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Service Form Dialog */}
      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingService={editingService}
        onSave={handleSaveService}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteServiceDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        service={deleteTarget}
        onDelete={handleDeleteService}
      />
    </div>
  );
}
