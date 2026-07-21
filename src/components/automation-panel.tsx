'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Bell,
  RefreshCw,
  Gift,
  Brain,
  Play,
  Settings,
  Trash2,
  Plus,
  Clock,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Send,
  Calendar,
  Mail,
  Heart,
  TrendingUp,
  TrendingDown,
  UserCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Switch } from '@/components/ui/switch';
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
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROSE_GOLD = '#B76E79';
const CHARCOAL = '#2D2D2D';

const AUTOMATION_TYPES = ['REMINDER', 'REACTIVATION', 'LOYALTY', 'SMART_CONTACT', 'STATUS_FLOW'] as const;
type AutomationType = (typeof AUTOMATION_TYPES)[number];

const TYPE_CONFIG: Record<
  AutomationType,
  {
    label: string;
    icon: typeof Bell;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
    iconColor: string;
    description: string;
  }
> = {
  REMINDER: {
    label: 'Recordatorio',
    icon: Bell,
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    description: 'Envía recordatorios antes de las citas',
  },
  REACTIVATION: {
    label: 'Reactivación',
    icon: RefreshCw,
    badgeBg: 'bg-red-100 dark:bg-red-900/40',
    badgeText: 'text-red-700 dark:text-red-300',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    iconColor: 'text-red-600 dark:text-red-400',
    description: 'Contacta clientes inactivos automáticamente',
  },
  LOYALTY: {
    label: 'Fidelización',
    icon: Gift,
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'Premia a tus clientes más fieles',
  },
  SMART_CONTACT: {
    label: 'Contacto Inteligente',
    icon: Brain,
    badgeBg: 'bg-purple-100 dark:bg-purple-900/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
    description: 'Analiza patrones y sugiere el mejor momento para contactar',
  },
  STATUS_FLOW: {
    label: 'Ciclo de Vida',
    icon: Users,
    badgeBg: 'bg-sky-100 dark:bg-sky-900/40',
    badgeText: 'text-sky-700 dark:text-sky-300',
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
    description: 'Gestiona el cambio de estado de clientes automáticamente',
  },
};

const DEFAULT_CONFIGS: Record<AutomationType, Record<string, string | number>> = {
  REMINDER: { hoursBefore: 24, hoursAfter: 0, messageTemplate: 'Hola {nombre}, te recordamos tu cita de {servicio} el {fecha} a las {hora}. ¡Te esperamos!' },
  REACTIVATION: { daysInactiveThreshold: 30, messageTemplate: 'Hola {nombre}, hace tiempo que no te vemos en {salon}. ¡Te echamos de menos! Ven pronto y llévate un descuento especial.' },
  LOYALTY: { minimumVisits: 5, messageTemplate: '🎉 ¡Felicidades {nombre}! Has completado {visitas} visitas en {salon}. ¡Gracias por tu preferencia!' },
  SMART_CONTACT: { analysisPeriodDays: 90, contactWindowDays: 7, antiSpamCooldownDays: 7, messageTemplate: 'Hola {nombre}, hace {dias} días que no nos visitas. ¿Te gustaría reservar una cita? ¡Te esperamos!' },
  STATUS_FLOW: { completedVisitsForRecurring: 5, inactiveDaysThreshold: 45 },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  type: AutomationType;
  active: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  _count?: { logs: number };
}

interface RunAction {
  clientId: string;
  clientName: string;
  action: string;
  details: string;
}

interface RunResult {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  actions: RunAction[];
}

interface RunData {
  rulesProcessed: number;
  results: RunResult[];
  runAt: string;
}

interface SmartContactSuggestion {
  clientId: string;
  clientName: string;
  avgDaysBetween: number;
  daysSinceLastVisit: number;
  suggestedContactDate: string;
  messageTemplate: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseConfig(config: Record<string, unknown>): Record<string, string | number> {
  return config as Record<string, string | number>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActionIcon(action: string) {
  switch (action) {
    case 'SEND_REMINDER':
      return Bell;
    case 'THANK_YOU':
      return Heart;
    case 'REACTIVATION_OUTREACH':
      return RefreshCw;
    case 'LOYALTY_REWARD':
      return Gift;
    case 'SMART_CONTACT':
      return Brain;
    case 'STATUS_PROMOTION':
      return TrendingUp;
    case 'STATUS_DEMOTION':
      return TrendingDown;
    case 'STATUS_REACTIVATION':
      return UserCheck;
    default:
      return MessageSquare;
  }
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'SEND_REMINDER':
      return 'Recordatorio enviado';
    case 'THANK_YOU':
      return 'Agradecimiento enviado';
    case 'REACTIVATION_OUTREACH':
      return 'Reactivación sugerida';
    case 'LOYALTY_REWARD':
      return 'Premio de fidelidad';
    case 'SMART_CONTACT':
      return 'Contacto inteligente';
    case 'STATUS_PROMOTION':
      return 'Promovido a Recurrente';
    case 'STATUS_DEMOTION':
      return 'Degradado a Inactivo';
    case 'STATUS_REACTIVATION':
      return 'Reactivado a Recurrente';
    default:
      return action;
  }
}

function getActionColor(action: string): { bg: string; text: string } {
  switch (action) {
    case 'SEND_REMINDER':
      return { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' };
    case 'THANK_YOU':
      return { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300' };
    case 'REACTIVATION_OUTREACH':
      return { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' };
    case 'LOYALTY_REWARD':
      return { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' };
    case 'SMART_CONTACT':
      return { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' };
    case 'STATUS_PROMOTION':
      return { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300' };
    case 'STATUS_DEMOTION':
      return { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' };
    case 'STATUS_REACTIVATION':
      return { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300' };
    default:
      return { bg: 'bg-gray-100 dark:bg-gray-900/40', text: 'text-gray-700 dark:text-gray-300' };
  }
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function AutomationSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AutomationPanel() {
  // -- State --
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Run results
  const [runData, setRunData] = useState<RunData | null>(null);
  const [running, setRunning] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Smart contact suggestions
  const [smartSuggestions, setSmartSuggestions] = useState<SmartContactSuggestion[]>([]);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AutomationRule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<AutomationType>('REMINDER');
  const [formActive, setFormActive] = useState(true);
  const [formConfig, setFormConfig] = useState<Record<string, string | number>>(DEFAULT_CONFIGS.REMINDER);
  const [formError, setFormError] = useState<string | null>(null);

  // -- Fetch automations --
  const fetchAutomations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAutomations();
      setAutomations(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar las automatizaciones';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  // -- Toggle active --
  const handleToggleActive = async (automation: AutomationRule) => {
    const newActive = !automation.active;
    // Optimistic update
    setAutomations((prev) =>
      prev.map((a) => (a.id === automation.id ? { ...a, active: newActive } : a))
    );
    try {
      await api.updateAutomation(automation.id, { active: newActive });
    } catch {
      // Revert
      setAutomations((prev) =>
        prev.map((a) => (a.id === automation.id ? { ...a, active: automation.active } : a))
      );
    }
  };

  // -- Run automations --
  const handleRunAutomations = async () => {
    try {
      setRunning(true);
      setRunData(null);
      setSmartSuggestions([]);
      const data = await api.runAutomations();
      setRunData(data);

      // Extract smart contact suggestions from results
      const suggestions: SmartContactSuggestion[] = [];
      for (const result of data.results || []) {
        if (result.ruleType === 'SMART_CONTACT') {
          for (const action of result.actions) {
            // Parse details to extract metrics
            const avgMatch = action.details.match(/cada (\d+) días/);
            const daysMatch = action.details.match(/hace (\d+) días/);
            const avgDays = avgMatch ? parseInt(avgMatch[1]) : 0;
            const daysSince = daysMatch ? parseInt(daysMatch[1]) : 0;

            const config = parseConfig(
              automations.find((a) => a.id === result.ruleId)?.config || {}
            );
            const contactWindow = (config.contactWindowDays as number) || 7;
            const templateStr = (config.messageTemplate as string) || 'Hola {nombre}, hace {dias} días que no nos visitas. ¿Te gustaría reservar una cita? ¡Te esperamos!';

            const suggestedDate = new Date();
            suggestedDate.setDate(suggestedDate.getDate() + contactWindow);

            suggestions.push({
              clientId: action.clientId,
              clientName: action.clientName,
              avgDaysBetween: avgDays,
              daysSinceLastVisit: daysSince,
              suggestedContactDate: formatDate(suggestedDate.toISOString()),
              messageTemplate: templateStr
                .replace('{nombre}', action.clientName)
                .replace('{dias}', String(daysSince)),
            });
          }
        }
      }
      setSmartSuggestions(suggestions);

      // Open all sections by default
      const sections: Record<string, boolean> = {};
      for (const result of data.results || []) {
        sections[result.ruleId] = true;
      }
      setOpenSections(sections);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al ejecutar las automatizaciones';
      setError(message);
    } finally {
      setRunning(false);
    }
  };

  // -- Open create dialog --
  const handleCreate = () => {
    setEditingAutomation(null);
    setFormName('');
    setFormDescription('');
    setFormType('REMINDER');
    setFormActive(true);
    setFormConfig({ ...DEFAULT_CONFIGS.REMINDER });
    setFormError(null);
    setDialogOpen(true);
  };

  // -- Open edit dialog --
  const handleEdit = (automation: AutomationRule) => {
    setEditingAutomation(automation);
    setFormName(automation.name);
    setFormDescription(automation.description || '');
    setFormType(automation.type as AutomationType);
    setFormActive(automation.active);
    const parsed = parseConfig(automation.config);
    setFormConfig({
      ...DEFAULT_CONFIGS[automation.type as AutomationType],
      ...parsed,
    } as Record<string, string | number>);
    setFormError(null);
    setDialogOpen(true);
  };

  // -- Save automation (create or update) --
  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    
    const previousAutomations = [...automations];
    
    try {
      setSaving(true);
      setFormError(null);

      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        type: formType,
        active: formActive,
        config: formConfig,
      };

      if (editingAutomation) {
        // Optimistic Update
        setAutomations((prev) =>
          prev.map((a) => (a.id === editingAutomation.id ? { ...a, ...payload, config: formConfig } : a))
        );
        await api.updateAutomation(editingAutomation.id, payload);
        toast.success('Automatización actualizada correctamente');
      } else {
        // Optimistic Create
        const tempId = `temp-${Date.now()}`;
        const newAutomation: AutomationRule = {
          ...payload,
          config: formConfig,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAutomations((prev) => [...prev, newAutomation]);
        
        const created = await api.createAutomation(payload);
        setAutomations((prev) => prev.map((a) => (a.id === tempId ? created : a)));
        toast.success('Automatización creada correctamente');
      }

      setDialogOpen(false);
    } catch (err: unknown) {
      setAutomations(previousAutomations);
      const message = err instanceof Error ? err.message : 'Error al guardar la automatización';
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // -- Delete automation --
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    
    const previousAutomations = [...automations];
    setAutomations((prev) => prev.filter((a) => a.id !== deletingId));
    
    try {
      await api.deleteAutomation(deletingId);
      toast.success('Automatización eliminada correctamente');
    } catch (err: unknown) {
      setAutomations(previousAutomations);
      const message = err instanceof Error ? err.message : 'Error al eliminar la automatización';
      toast.error(message);
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  // -- Toggle collapsible section --
  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // -- Compute run stats --
  const runStats = runData
    ? {
        clientsContacted: runData.results.reduce(
          (sum, r) => sum + r.actions.filter((a) => a.action === 'SMART_CONTACT').length,
          0
        ),
        remindersSent: runData.results.reduce(
          (sum, r) => sum + r.actions.filter((a) => a.action === 'SEND_REMINDER').length,
          0
        ),
        thanksSent: runData.results.reduce(
          (sum, r) => sum + r.actions.filter((a) => a.action === 'THANK_YOU').length,
          0
        ),
        reactivationsSuggested: runData.results.reduce(
          (sum, r) => sum + r.actions.filter((a) => a.action === 'REACTIVATION_OUTREACH').length,
          0
        ),
        loyaltyRewards: runData.results.reduce(
          (sum, r) => sum + r.actions.filter((a) => a.action === 'LOYALTY_REWARD').length,
          0
        ),
        statusChanges: runData.results.reduce(
          (sum, r) => sum + r.actions.filter((a) => a.action.startsWith('STATUS_')).length,
          0
        ),
      }
    : null;

  // -- Render: Loading --
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">
        <AutomationSkeleton />
      </div>
    );
  }

  // -- Render: Error --
  if (error && automations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Error al cargar</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchAutomations}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors cursor-pointer"
          style={{ backgroundColor: ROSE_GOLD }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  // -- Render --
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: CHARCOAL }}>
            <Zap className="h-6 w-6" style={{ color: ROSE_GOLD }} />
            Automatizaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configura reglas automáticas para optimizar la gestión de tus clientes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunAutomations}
            disabled={running || automations.filter((a) => a.active).length === 0}
            className="text-white border-0 cursor-pointer"
            style={{ backgroundColor: ROSE_GOLD }}
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {running ? 'Ejecutando...' : 'Ejecutar Todas'}
          </Button>
          <Button
            onClick={handleCreate}
            className="text-white border-0 cursor-pointer"
            style={{ backgroundColor: CHARCOAL }}
          >
            <Plus className="h-4 w-4" />
            Nueva Regla
          </Button>
        </div>
      </div>

      {/* ===================== AUTOMATION RULES ===================== */}
      {automations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: `${ROSE_GOLD}15` }}
            >
              <Zap className="h-8 w-8" style={{ color: ROSE_GOLD }} />
            </div>
            <p className="text-lg font-medium mb-1" style={{ color: CHARCOAL }}>
              Sin automatizaciones
            </p>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Crea tu primera regla de automatización para comenzar a optimizar la gestión de tus
              clientes de forma automática.
            </p>
            <Button
              onClick={handleCreate}
              className="text-white border-0 cursor-pointer"
              style={{ backgroundColor: ROSE_GOLD }}
            >
              <Plus className="h-4 w-4" />
              Crear Automatización
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {automations.map((automation) => {
            const typeConf = TYPE_CONFIG[automation.type as AutomationType] || TYPE_CONFIG.REMINDER;
            const IconComp = typeConf.icon;
            const parsedConfig = parseConfig(automation.config);

            return (
              <Card
                key={automation.id}
                className="hover:shadow-md transition-shadow"
                style={{
                  opacity: automation.active ? 1 : 0.6,
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${typeConf.iconBg}`}
                    >
                      <IconComp className={`h-6 w-6 ${typeConf.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate" style={{ color: CHARCOAL }}>
                            {automation.name}
                          </h3>
                          {automation.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {automation.description}
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={automation.active}
                          onCheckedChange={() => handleToggleActive(automation)}
                          className="shrink-0"
                        />
                      </div>

                      {/* Type badge + Last run */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${typeConf.badgeBg} ${typeConf.badgeText}`}
                        >
                          <IconComp className="h-3 w-3" />
                          {typeConf.label}
                        </span>
                        {automation._count && automation._count.logs > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {automation._count.logs} ejecucion{automation._count.logs !== 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>

                      {/* Config preview */}
                      <div className="mt-3 text-xs text-muted-foreground space-y-1">
                        {automation.type === 'REMINDER' && parsedConfig.hoursBefore && (
                          <p>
                            <span className="font-medium">Horas antes:</span> {String(parsedConfig.hoursBefore)}h
                          </p>
                        )}
                        {automation.type === 'REMINDER' && parsedConfig.hoursAfter && Number(parsedConfig.hoursAfter) > 0 && (
                          <p>
                            <span className="font-medium">Agradecimiento post:</span> {String(parsedConfig.hoursAfter)}h
                          </p>
                        )}
                        {automation.type === 'REACTIVATION' && parsedConfig.daysInactiveThreshold && (
                          <p>
                            <span className="font-medium">Días inactivo:</span> {String(parsedConfig.daysInactiveThreshold)}d
                          </p>
                        )}
                        {automation.type === 'LOYALTY' && parsedConfig.minimumVisits && (
                          <p>
                            <span className="font-medium">Visitas mínimas:</span> {String(parsedConfig.minimumVisits)}
                          </p>
                        )}
                        {automation.type === 'SMART_CONTACT' && (
                          <>
                            {parsedConfig.analysisPeriodDays && (
                              <p>
                                <span className="font-medium">Período análisis:</span> {String(parsedConfig.analysisPeriodDays)}d
                              </p>
                            )}
                            {parsedConfig.contactWindowDays && (
                              <p>
                                <span className="font-medium">Ventana contacto:</span> {String(parsedConfig.contactWindowDays)}d
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(automation)}
                          className="h-8 text-xs cursor-pointer"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingId(automation.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===================== RUN RESULTS + SMART CONTACT SUGGESTIONS ===================== */}
      {runData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: CHARCOAL }}>
              <Play className="h-5 w-5" style={{ color: ROSE_GOLD }} />
              Resultados de Ejecución
            </CardTitle>
            <CardDescription>
              Ejecutado el {formatDateTime(runData.runAt)} · {runData.rulesProcessed} regla{runData.rulesProcessed !== 1 ? 's' : ''} procesada{runData.rulesProcessed !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            {runStats && (
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="rounded-xl border p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Bell className="h-4 w-4 text-amber-600" />
                    <span className="text-2xl font-bold" style={{ color: CHARCOAL }}>
                      {runStats.remindersSent}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Recordatorios</p>
                </div>
                <div className="rounded-xl border p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Heart className="h-4 w-4 text-pink-600" />
                    <span className="text-2xl font-bold" style={{ color: CHARCOAL }}>
                      {runStats.thanksSent}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Agradecimientos</p>
                </div>
                <div className="rounded-xl border p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <RefreshCw className="h-4 w-4 text-red-600" />
                    <span className="text-2xl font-bold" style={{ color: CHARCOAL }}>
                      {runStats.reactivationsSuggested}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Reactivaciones</p>
                </div>
                <div className="rounded-xl border p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Gift className="h-4 w-4 text-emerald-600" />
                    <span className="text-2xl font-bold" style={{ color: CHARCOAL }}>
                      {runStats.loyaltyRewards}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Premios</p>
                </div>
                <div className="rounded-xl border p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="text-2xl font-bold" style={{ color: CHARCOAL }}>
                      {runStats.clientsContacted}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Contactos</p>
                </div>
                <div className="rounded-xl border p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Users className="h-4 w-4 text-sky-600" />
                    <span className="text-2xl font-bold" style={{ color: CHARCOAL }}>
                      {runStats.statusChanges}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Cambios de estado</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Detailed Results by Type */}
            <div className="space-y-3">
              {runData.results
                .filter((r) => r.actions.length > 0)
                .map((result) => {
                  const typeConf = TYPE_CONFIG[result.ruleType as AutomationType];
                  const IconComp = typeConf?.icon || MessageSquare;
                  const isOpen = openSections[result.ruleId] !== false;

                  return (
                    <Collapsible
                      key={result.ruleId}
                      open={isOpen}
                      onOpenChange={() => toggleSection(result.ruleId)}
                    >
                      <div className="rounded-xl border">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-xl">
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-8 w-8 rounded-lg flex items-center justify-center ${typeConf?.iconBg || 'bg-gray-100'}`}
                              >
                                <IconComp className={`h-4 w-4 ${typeConf?.iconColor || 'text-gray-600'}`} />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-sm" style={{ color: CHARCOAL }}>
                                  {result.ruleName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {result.actions.length} accion{result.actions.length !== 1 ? 'es' : ''}
                                </p>
                              </div>
                            </div>
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-2">
                            {result.actions.map((action, idx) => {
                              const ActionIcon = getActionIcon(action.action);
                              const colors = getActionColor(action.action);
                              return (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3 rounded-lg bg-muted/30 p-3"
                                >
                                  <div
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colors.bg}`}
                                  >
                                    <ActionIcon className={`h-3.5 w-3.5 ${colors.text}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-sm" style={{ color: CHARCOAL }}>
                                        {action.clientName}
                                      </span>
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text}`}
                                      >
                                        {getActionLabel(action.action)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {action.details}
                                    </p>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                                    {formatDateTime(runData.runAt)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}

                {runData.results.every((r) => r.actions.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">No se generaron acciones con las reglas activas</p>
                  </div>
                )}
            </div>

            {/* ===================== SMART CONTACT SUGGESTIONS (merged inside results) ===================== */}
            {smartSuggestions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-4" style={{ color: CHARCOAL }}>
                    <Brain className="h-5 w-5" style={{ color: ROSE_GOLD }} />
                    Sugerencias de Contacto Inteligente
                  </h3>
                  <div className="space-y-3">
                    {smartSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.clientId}
                        className="rounded-xl border p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div
                            className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-lg"
                            style={{ backgroundColor: ROSE_GOLD }}
                          >
                            {suggestion.clientName.charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-sm" style={{ color: CHARCOAL }}>
                                  {suggestion.clientName}
                                </h4>
                              </div>
                              <Button
                                size="sm"
                                className="h-8 text-xs text-white border-0 shrink-0 cursor-pointer"
                                style={{ backgroundColor: ROSE_GOLD }}
                              >
                                <Send className="h-3.5 w-3.5" />
                                Contactar
                              </Button>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-3 mt-3">
                              <div className="text-center rounded-lg bg-muted/50 p-2">
                                <p className="text-xs text-muted-foreground mb-0.5">Frecuencia</p>
                                <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                                  Cada {suggestion.avgDaysBetween}d
                                </p>
                              </div>
                              <div className="text-center rounded-lg bg-muted/50 p-2">
                                <p className="text-xs text-muted-foreground mb-0.5">Última visita</p>
                                <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                                  Hace {suggestion.daysSinceLastVisit}d
                                </p>
                              </div>
                              <div className="text-center rounded-lg bg-muted/50 p-2">
                                <p className="text-xs text-muted-foreground mb-0.5">Contactar antes</p>
                                <p className="text-sm font-semibold" style={{ color: ROSE_GOLD }}>
                                  {suggestion.suggestedContactDate}
                                </p>
                              </div>
                            </div>

                            {/* Suggested message */}
                            <div className="mt-3 rounded-lg border p-3 bg-background">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  Mensaje sugerido
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {suggestion.messageTemplate}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===================== CREATE/EDIT DIALOG ===================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: CHARCOAL }}>
              <Zap className="h-5 w-5" style={{ color: ROSE_GOLD }} />
              {editingAutomation ? 'Editar Automatización' : 'Nueva Automatización'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="auto-name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="auto-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Recordatorio 24h antes de cita"
                className="w-full"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="auto-desc">Descripción</Label>
              <Textarea
                id="auto-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe qué hace esta automatización..."
                rows={2}
                className="w-full resize-none"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="auto-type">Tipo de automatización</Label>
              <Select
                value={formType}
                onValueChange={(val: string) => {
                  const newType = val as AutomationType;
                  setFormType(newType);
                  setFormConfig({ ...DEFAULT_CONFIGS[newType] });
                }}
              >
                <SelectTrigger id="auto-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTOMATION_TYPES.map((t) => {
                    const conf = TYPE_CONFIG[t];
                    const TypeIcon = conf.icon;
                    return (
                      <SelectItem key={t} value={t}>
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`h-4 w-4 ${conf.iconColor}`} />
                          <span>{conf.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TYPE_CONFIG[formType].description}
              </p>
            </div>

            {/* Config fields based on type */}
            <div className="rounded-xl border p-4 space-y-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium" style={{ color: CHARCOAL }}>
                  Configuración
                </span>
              </div>

              {formType === 'REMINDER' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-hours">Horas antes de la cita</Label>
                    <Input
                      id="cfg-hours"
                      type="number"
                      min={1}
                      max={168}
                      value={String(formConfig.hoursBefore ?? 24)}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          hoursBefore: parseInt(e.target.value) || 24,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Se enviará el recordatorio esta cantidad de horas antes de la cita
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-hours-after">Horas después de la cita</Label>
                    <Input
                      id="cfg-hours-after"
                      type="number"
                      min={0}
                      max={168}
                      value={String(formConfig.hoursAfter ?? 0)}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          hoursAfter: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Enviar agradecimiento N horas después de una cita completada (0 = desactivado)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-reminder-msg">Plantilla de mensaje</Label>
                    <Textarea
                      id="cfg-reminder-msg"
                      value={String(formConfig.messageTemplate ?? '')}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          messageTemplate: e.target.value,
                        }))
                      }
                      placeholder="Hola {nombre}, te recordamos..."
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{nombre}'}, {'{servicio}'}, {'{fecha}'}, {'{hora}'}
                    </p>
                  </div>
                </>
              )}

              {formType === 'REACTIVATION' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-days">Días de inactividad</Label>
                    <Input
                      id="cfg-days"
                      type="number"
                      min={7}
                      max={365}
                      value={String(formConfig.daysInactiveThreshold ?? 30)}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          daysInactiveThreshold: parseInt(e.target.value) || 30,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Se contactará a los clientes que lleven más de este número de días sin visitar
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-react-msg">Plantilla de mensaje</Label>
                    <Textarea
                      id="cfg-react-msg"
                      value={String(formConfig.messageTemplate ?? '')}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          messageTemplate: e.target.value,
                        }))
                      }
                      placeholder="Hola {nombre}, hace tiempo que..."
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{nombre}'}, {'{salon}'}
                    </p>
                  </div>
                </>
              )}

              {formType === 'LOYALTY' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-visits">Visitas mínimas</Label>
                    <Input
                      id="cfg-visits"
                      type="number"
                      min={1}
                      max={100}
                      value={String(formConfig.minimumVisits ?? 5)}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          minimumVisits: parseInt(e.target.value) || 5,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Los clientes con este número de visitas completadas recibirán el premio
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-loy-msg">Plantilla de mensaje</Label>
                    <Textarea
                      id="cfg-loy-msg"
                      value={String(formConfig.messageTemplate ?? '🎉 ¡Felicidades {nombre}! Has completado {visitas} visitas. ¡Gracias por tu preferencia!')}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          messageTemplate: e.target.value,
                        }))
                      }
                      placeholder="🎉 ¡Felicidades {nombre}! Has completado {visitas} visitas. ¡Gracias por tu preferencia!"
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{nombre}'}, {'{visitas}'}, {'{salon}'}
                    </p>
                  </div>
                </>
              )}

              {formType === 'STATUS_FLOW' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-visits-flow">Visitas completadas para Recurrente</Label>
                    <Input
                      id="cfg-visits-flow"
                      type="number"
                      min={1}
                      max={100}
                      value={String(formConfig.completedVisitsForRecurring ?? 5)}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          completedVisitsForRecurring: parseInt(e.target.value) || 5,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Clientes con este número de visitas completadas pasan automáticamente a Recurrentes
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-inactive">Días sin citas para Inactivo</Label>
                    <Input
                      id="cfg-inactive"
                      type="number"
                      min={7}
                      max={365}
                      value={String(formConfig.inactiveDaysThreshold ?? 45)}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          inactiveDaysThreshold: parseInt(e.target.value) || 45,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Clientes Recurrentes sin citas completadas por más de este número de días pasan a Inactivos
                    </p>
                  </div>
                </>
              )}

              {formType === 'SMART_CONTACT' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-period">Período de análisis (días)</Label>
                    <Input
                      id="cfg-period"
                      type="number"
                      min={30}
                      max={365}
                      value={String(formConfig.analysisPeriodDays ?? 90)}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          analysisPeriodDays: parseInt(e.target.value) || 90,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Se analizarán los patrones de visita de los últimos días indicados
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-window">Ventana de contacto (días)</Label>
                    <Input
                      id="cfg-window"
                      type="number"
                      min={1}
                      max={30}
                      value={String(formConfig.contactWindowDays ?? 7)}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          contactWindowDays: parseInt(e.target.value) || 7,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Días antes del patrón estimado para sugerir el contacto
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-cooldown">Anti-spam (días entre contactos)</Label>
                    <Input
                      id="cfg-cooldown"
                      type="number"
                      min={1}
                      max={60}
                      value={String(formConfig.antiSpamCooldownDays ?? 7)}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          antiSpamCooldownDays: parseInt(e.target.value) || 7,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Días mínimos que deben pasar antes de contactar al mismo cliente otra vez
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-sc-msg">Plantilla de mensaje</Label>
                    <Textarea
                      id="cfg-sc-msg"
                      value={String(formConfig.messageTemplate ?? '')}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          messageTemplate: e.target.value,
                        }))
                      }
                      placeholder="Hola {nombre}, hace {dias} días que no nos visitas..."
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{nombre}'}, {'{dias}'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: formActive ? `${ROSE_GOLD}20` : '#f3f4f6' }}
                >
                  <Zap
                    className="h-4 w-4"
                    style={{ color: formActive ? ROSE_GOLD : '#9ca3af' }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: CHARCOAL }}>
                    Activar automatización
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formActive
                      ? 'Se ejecutará automáticamente según la configuración'
                      : 'No se ejecutará hasta que la actives'}
                  </p>
                </div>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>

            {/* Error */}
            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-3">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formName.trim()}
              className="text-white border-0 cursor-pointer"
              style={{ backgroundColor: ROSE_GOLD }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingAutomation ? 'Guardar Cambios' : 'Crear Regla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== DELETE CONFIRMATION ===================== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar automatización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la regla de automatización y todo su
              historial de ejecuciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
