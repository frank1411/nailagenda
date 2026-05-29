'use client';

import { useState } from 'react';
import {
  Rocket,
  Cloud,
  Database,
  Globe,
  Mail,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  Server,
  CheckCircle2,
  Circle,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Users,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROSE_GOLD = '#B76E79';
const CHARCOAL = '#2D2D2D';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CostRow {
  concepto: string;
  icon: React.ReactNode;
  mvp: string;
  mvpCost: number;
  growth: string;
  growthCost: number;
  scale: string;
  scaleCost: number;
}

interface DeploymentStep {
  id: string;
  label: string;
  optional?: boolean;
  command?: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const costRows: CostRow[] = [
  {
    concepto: 'Hosting (Vercel)',
    icon: <Cloud className="h-4 w-4" />,
    mvp: '$0 (Hobby)',
    mvpCost: 0,
    growth: '$240/año (Pro)',
    growthCost: 240,
    scale: '$600/año (Pro Team)',
    scaleCost: 600,
  },
  {
    concepto: 'Base de datos (Supabase)',
    icon: <Database className="h-4 w-4" />,
    mvp: '$0 (Free)',
    mvpCost: 0,
    growth: '$300/año (Pro)',
    growthCost: 300,
    scale: '$900/año (Pro 2x)',
    scaleCost: 900,
  },
  {
    concepto: 'Dominio',
    icon: <Globe className="h-4 w-4" />,
    mvp: '$12/año',
    mvpCost: 12,
    growth: '$12/año',
    growthCost: 12,
    scale: '$12/año',
    scaleCost: 12,
  },
  {
    concepto: 'Email (Resend)',
    icon: <Mail className="h-4 w-4" />,
    mvp: '$0 (100 gratis/día)',
    mvpCost: 0,
    growth: '$96/año',
    growthCost: 96,
    scale: '$240/año',
    scaleCost: 240,
  },
  {
    concepto: 'SMS (Twilio)',
    icon: <MessageSquare className="h-4 w-4" />,
    mvp: '$0 (trial)',
    mvpCost: 0,
    growth: '~$120/año',
    growthCost: 120,
    scale: '~$480/año',
    scaleCost: 480,
  },
  {
    concepto: 'Pagos (Stripe)',
    icon: <CreditCard className="h-4 w-4" />,
    mvp: '$0 (solo comisiones)',
    mvpCost: 0,
    growth: '$0',
    growthCost: 0,
    scale: '$0',
    scaleCost: 0,
  },
  {
    concepto: 'Monitoreo (Sentry)',
    icon: <ShieldCheck className="h-4 w-4" />,
    mvp: '$0 (Free)',
    mvpCost: 0,
    growth: '$312/año (Team)',
    growthCost: 312,
    scale: '$780/año (Business)',
    scaleCost: 780,
  },
];

const mvpTotal = costRows.reduce((sum, r) => sum + r.mvpCost, 0);
const growthTotal = costRows.reduce((sum, r) => sum + r.growthCost, 0);
const scaleTotal = costRows.reduce((sum, r) => sum + r.scaleCost, 0);

const deploymentSteps: DeploymentStep[] = [
  {
    id: 'step-1',
    label: 'Crear cuenta en Supabase y proyecto PostgreSQL',
  },
  {
    id: 'step-2',
    label: 'Crear cuenta en Vercel y conectar repositorio',
  },
  {
    id: 'step-3',
    label: 'Configurar variables de entorno en Vercel',
  },
  {
    id: 'step-4',
    label: 'Generar AUTH_SECRET con openssl rand -base64 32',
    command: 'openssl rand -base64 32',
  },
  {
    id: 'step-5',
    label: 'Ejecutar prisma migrate deploy en Supabase',
    command: 'npx prisma migrate deploy',
  },
  {
    id: 'step-6',
    label: 'Configurar dominio personalizado en Vercel',
  },
  {
    id: 'step-7',
    label: 'Crear cuenta en Resend para emails',
  },
  {
    id: 'step-8',
    label: 'Configurar Stripe para pagos SaaS',
  },
  {
    id: 'step-9',
    label: 'Configurar Twilio para SMS',
    optional: true,
  },
  {
    id: 'step-10',
    label: 'Configurar Sentry para monitoreo',
    optional: true,
  },
];

const completedChanges = [
  'Prisma migrado de SQLite a PostgreSQL',
  '.env.example creado con todas las variables',
  'next.config.ts optimizado para Vercel',
  'vercel.json configurado',
  'Scripts de producción añadidos (db:migrate:prod, vercel-build)',
  'Security headers configurados',
  'Rate limiting en middleware',
  'Seed endpoint deshabilitado en producción',
];

// ---------------------------------------------------------------------------
// Helper: Cost color
// ---------------------------------------------------------------------------

function getCostColorClass(cost: number): string {
  if (cost === 0) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (cost <= 120) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
  return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300';
}

function getTotalColorClass(cost: number): string {
  if (cost <= 50) return 'text-emerald-700 dark:text-emerald-400';
  if (cost <= 1200) return 'text-amber-700 dark:text-amber-400';
  return 'text-orange-700 dark:text-orange-400';
}

// ---------------------------------------------------------------------------
// Section A: Cost Breakdown
// ---------------------------------------------------------------------------

function CostBreakdownSection() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base" style={{ color: CHARCOAL }}>
          <DollarSign className="h-4 w-4" style={{ color: ROSE_GOLD }} />
          Desglose de Costes por Nivel
        </CardTitle>
        <CardDescription className="text-sm">
          Costes anuales estimados según el número de clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mobile-friendly scrollable table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[180px]">Concepto</TableHead>
                <TableHead className="min-w-[140px] text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="flex items-center gap-1">
                      <Rocket className="h-3.5 w-3.5" />
                      MVP Launch
                    </span>
                    <span className="text-[10px] font-normal text-muted-foreground">0-50 clientes</span>
                  </div>
                </TableHead>
                <TableHead className="min-w-[140px] text-center bg-primary/5 border-l-2 border-primary/30">
                  <div className="flex flex-col items-center gap-1">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Growth
                    </span>
                    <span className="text-[10px] font-normal text-muted-foreground">50-500 clientes</span>
                    <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">Recomendado</Badge>
                  </div>
                </TableHead>
                <TableHead className="min-w-[140px] text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Scale
                    </span>
                    <span className="text-[10px] font-normal text-muted-foreground">500+ clientes</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costRows.map((row) => (
                <TableRow key={row.concepto}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2" style={{ color: CHARCOAL }}>
                      <span className="text-muted-foreground">{row.icon}</span>
                      {row.concepto}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${getCostColorClass(row.mvpCost)}`}>
                      {row.mvp}
                    </span>
                  </TableCell>
                  <TableCell className="text-center bg-primary/5 border-l-2 border-primary/30">
                    <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${getCostColorClass(row.growthCost)}`}>
                      {row.growth}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${getCostColorClass(row.scaleCost)}`}>
                      {row.scale}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {/* Total row */}
              <TableRow className="bg-muted/30 font-bold">
                <TableCell className="font-bold" style={{ color: CHARCOAL }}>
                  TOTAL ANUAL
                </TableCell>
                <TableCell className="text-center">
                  <span className={`text-sm font-bold ${getTotalColorClass(mvpTotal)}`}>
                    ~${mvpTotal}
                  </span>
                  <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                    ~${(mvpTotal / 12).toFixed(0)}/mes
                  </div>
                </TableCell>
                <TableCell className="text-center bg-primary/5 border-l-2 border-primary/30">
                  <span className={`text-sm font-bold ${getTotalColorClass(growthTotal)}`}>
                    ~${growthTotal.toLocaleString()}
                  </span>
                  <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                    ~${(growthTotal / 12).toFixed(0)}/mes
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`text-sm font-bold ${getTotalColorClass(scaleTotal)}`}>
                    ~${scaleTotal.toLocaleString()}
                  </span>
                  <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                    ~${(scaleTotal / 12).toFixed(0)}/mes
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800" />
            Gratuito / Bajo coste
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800" />
            Coste moderado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-800" />
            Inversión significativa
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section B: Deployment Steps Checklist
// ---------------------------------------------------------------------------

function DeploymentChecklistSection() {
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const completedCount = Object.values(checkedSteps).filter(Boolean).length;
  const totalCount = deploymentSteps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const toggleStep = (stepId: string) => {
    setCheckedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleCopyCommand = (command: string, stepId: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(stepId);
    toast.success('Comando copiado al portapapeles');
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: CHARCOAL }}>
              <Server className="h-4 w-4" style={{ color: ROSE_GOLD }} />
              Pasos de Despliegue
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Checklist interactivo para desplegar en producción
            </CardDescription>
          </div>
          <Badge
            className="text-xs px-2.5 py-1"
            style={{ backgroundColor: `${ROSE_GOLD}20`, color: ROSE_GOLD, border: 'none' }}
          >
            {completedCount}/{totalCount}
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: progressPercent === 100 ? '#10b981' : ROSE_GOLD,
            }}
          />
        </div>
        {progressPercent === 100 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            ¡Todos los pasos completados! Tu despliegue está listo.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {deploymentSteps.map((step, index) => {
            const isChecked = checkedSteps[step.id] || false;
            return (
              <div
                key={step.id}
                className={`
                  flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors
                  ${isChecked ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'hover:bg-muted/50'}
                `}
              >
                <div className="flex items-center gap-3 shrink-0 pt-0.5">
                  <span className="text-xs font-mono text-muted-foreground w-5 text-right">
                    {index + 1}.
                  </span>
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleStep(step.id)}
                    className={isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : ''}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm ${isChecked ? 'line-through text-muted-foreground' : ''}`}
                      style={!isChecked ? { color: CHARCOAL } : undefined}
                    >
                      {step.label}
                    </span>
                    {step.optional && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">
                        Opcional
                      </Badge>
                    )}
                  </div>
                  {step.command && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {step.command}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleCopyCommand(step.command!, step.id)}
                      >
                        {copiedCommand === step.id ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section C: Architecture Diagram
// ---------------------------------------------------------------------------

function ArchitectureDiagramSection() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base" style={{ color: CHARCOAL }}>
          <Cloud className="h-4 w-4" style={{ color: ROSE_GOLD }} />
          Arquitectura de Producción
        </CardTitle>
        <CardDescription className="text-sm">
          Diagrama del flujo de la aplicación en producción
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10 p-4 sm:p-6">
          {/* Architecture Flow */}
          <div className="flex flex-col items-center gap-4">
            {/* Row 1: User → CDN → Vercel */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full justify-center">
              <ArchBox
                icon={<Users className="h-5 w-5" />}
                label="Usuario"
                sub="Navegador / App"
                color="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 sm:hidden" />
              <ArchBox
                icon={<Globe className="h-5 w-5" />}
                label="Cloudflare"
                sub="CDN & DNS"
                color="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 sm:hidden" />
              <ArchBox
                icon={<Cloud className="h-5 w-5" />}
                label="Vercel"
                sub="Next.js SSR/ISR"
                color="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
              />
            </div>

            {/* Arrow down from Vercel */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-4 bg-muted-foreground/30" />
              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            {/* Row 2: Database */}
            <ArchBox
              icon={<Database className="h-5 w-5" />}
              label="Supabase"
              sub="PostgreSQL"
              color="bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700"
              highlighted
            />

            {/* Arrow down from Vercel to services */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-4 bg-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground font-medium">Servicios externos</span>
            </div>

            {/* Row 3: External services */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full justify-center">
              <ArchBox
                icon={<Mail className="h-5 w-5" />}
                label="Resend"
                sub="Email"
                color="bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700"
                small
              />
              <ArchBox
                icon={<MessageSquare className="h-5 w-5" />}
                label="Twilio"
                sub="SMS"
                color="bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700"
                small
              />
              <ArchBox
                icon={<CreditCard className="h-5 w-5" />}
                label="Stripe"
                sub="Pagos"
                color="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700"
                small
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Architecture Box Sub-component
// ---------------------------------------------------------------------------

function ArchBox({
  icon,
  label,
  sub,
  color,
  highlighted = false,
  small = false,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: string;
  highlighted?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={`
        flex items-center gap-2.5 rounded-lg border-2 px-3 ${small ? 'py-2' : 'py-2.5'} min-w-[120px]
        justify-center transition-shadow
        ${color}
        ${highlighted ? 'shadow-md' : 'shadow-sm'}
      `}
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <div>
        <div className={`font-semibold ${small ? 'text-xs' : 'text-sm'}`} style={{ color: CHARCOAL }}>
          {label}
        </div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section D: Code Changes Already Made
// ---------------------------------------------------------------------------

function CodeChangesSection() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base" style={{ color: CHARCOAL }}>
          <ShieldCheck className="h-4 w-4" style={{ color: ROSE_GOLD }} />
          Cambios de Producción Aplicados
        </CardTitle>
        <CardDescription className="text-sm">
          Estas mejoras ya están implementadas en el código
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {completedChanges.map((change) => (
            <div
              key={change}
              className="flex items-start gap-2.5 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 px-3 py-2.5"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm" style={{ color: CHARCOAL }}>
                {change}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2" style={{ color: CHARCOAL }}>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            Variables de Entorno Requeridas
          </h4>
          <div className="space-y-1.5">
            {[
              'DATABASE_URL - Cadena de conexión PostgreSQL',
              'AUTH_SECRET - Clave secreta para JWT (openssl rand -base64 32)',
              'NEXTAUTH_URL - URL base de la aplicación',
              'NODE_ENV - production',
            ].map((env) => (
              <div key={env} className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground mt-0.5">•</span>
                <code className="text-muted-foreground">
                  {env.split(' - ')[0]}
                </code>
                <span className="text-muted-foreground">—</span>
                <span className="text-muted-foreground">
                  {env.split(' - ').slice(1).join(' - ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main ProductionGuide Component
// ---------------------------------------------------------------------------

export default function ProductionGuide() {
  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div
        className="rounded-xl p-4 sm:p-5 text-white"
        style={{
          background: `linear-gradient(135deg, ${ROSE_GOLD} 0%, ${CHARCOAL} 100%)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/20 p-2.5">
            <Rocket className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Guía de Producción</h3>
            <p className="text-sm text-white/80">
              Todo lo que necesitas para desplegar MayeNailsArt en producción
            </p>
          </div>
        </div>
      </div>

      {/* Section A: Cost Breakdown */}
      <CostBreakdownSection />

      {/* Section B: Deployment Steps */}
      <DeploymentChecklistSection />

      {/* Section C: Architecture Diagram */}
      <ArchitectureDiagramSection />

      {/* Section D: Code Changes */}
      <CodeChangesSection />
    </div>
  );
}
