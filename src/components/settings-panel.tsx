'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Mail,
  Phone,
  MapPin,
  Store,
  Shield,
  Calendar,
  Lock,
  LogOut,
  Database,
  Loader2,
  AlertTriangle,
  Rocket,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ProductionGuide from '@/components/production-guide';
import OnboardingTour from '@/components/onboarding-tour';
import { BookOpen, FileText, Presentation, Download } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROSE_GOLD = '#B76E79';
const CHARCOAL = '#2D2D2D';

// ---------------------------------------------------------------------------
// Main SettingsPanel Component
// ---------------------------------------------------------------------------

export default function SettingsPanel() {
  const { user, updateUser, logout } = useAuthStore();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    salonName: user?.salonName || '',
    salonAddress: user?.salonAddress || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Seed dialog state
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Onboarding tour state
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Google Calendar integration state
  const [gcConnecting, setGcConnecting] = useState(false);
  const [gcConnected, setGcConnected] = useState(false);
  const [gcEmail, setGcEmail] = useState<string | null>(null);
  const [gcLoading, setGcLoading] = useState(true);
  const [gcDisconnecting, setGcDisconnecting] = useState(false);

  // Check Google Calendar status on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/integrations/google/status');
        if (!res.ok) throw new Error('No se pudo verificar estado');
        const data = await res.json();
        setGcConnected(data.connected);
        setGcEmail(data.email);
      } catch {
        // Not connected or error — show as disconnected
        setGcConnected(false);
        setGcEmail(null);
      } finally {
        setGcLoading(false);
      }
    })();
  }, []);

  // Connect Google Calendar
  const handleGoogleConnect = async () => {
    setGcConnecting(true);
    try {
      const res = await fetch('/api/integrations/google/auth');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Error al iniciar conexión');
      }
      const data = await res.json();
      // Redirect to Google OAuth
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar';
      toast.error(msg);
      setGcConnecting(false);
    }
  };

  // Disconnect Google Calendar
  const handleGoogleDisconnect = async () => {
    setGcDisconnecting(true);
    try {
      const res = await fetch('/api/integrations/google/disconnect', { method: 'POST' });
      if (!res.ok) throw new Error('Error al desconectar');
      setGcConnected(false);
      setGcEmail(null);
      toast.success('Google Calendar desconectado');
    } catch {
      toast.error('Error al desconectar Google Calendar');
    } finally {
      setGcDisconnecting(false);
    }
  };

  // Handle profile save (just updates local store for MVP)
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      // For MVP, just update the local store
      updateUser({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        salonName: profileForm.salonName.trim(),
        salonAddress: profileForm.salonAddress.trim(),
      });
      toast.success('Perfil actualizado correctamente');
    } catch {
      toast.error('Error al actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle database seed
  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.seedDatabase();
      toast.success('Datos de demostración cargados correctamente');
      setSeedDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos';
      if (msg.includes('already seeded') || msg.includes('409')) {
        toast.error('Los datos de demostración ya existen');
      } else {
        toast.error(msg);
      }
    } finally {
      setSeeding(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Format member since date
  const memberSince = user
    ? new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5" style={{ color: ROSE_GOLD }} />
          <h2 className="text-xl font-bold" style={{ color: CHARCOAL }}>
            Configuración
          </h2>
        </div>
      </div>

      <Separator />

      {/* Tabs: General / Producción */}
      <div className="px-4 pt-3 sm:px-6 sm:pt-4">
         <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="general" className="gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                General
              </TabsTrigger>
              {user?.role === 'ADMIN' && (
                <TabsTrigger value="produccion" className="gap-1.5">
                  <Rocket className="h-3.5 w-3.5" />
                  Producción
                </TabsTrigger>
              )}
            </TabsList>
 
           {/* ====== GENERAL TAB ====== */}
           <TabsContent value="general">
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">

          {/* =================== PROFILE SECTION =================== */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: CHARCOAL }}>
                <User className="h-4 w-4" style={{ color: ROSE_GOLD }} />
                Perfil
              </CardTitle>
              <CardDescription className="text-sm">
                Información personal y del salón
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarFallback
                    className="text-white font-bold text-xl"
                    style={{ backgroundColor: ROSE_GOLD }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: CHARCOAL }}>
                    {user?.name || 'Usuario'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.email || ''}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settingsName" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Nombre
                  </Label>
                  <Input
                    id="settingsName"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settingsEmail" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="settingsEmail"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="settingsPhone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Teléfono
                </Label>
                <Input
                  id="settingsPhone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+34 612 345 678"
                />
              </div>

              <Separator />

              {/* Salon Name */}
              <div className="space-y-2">
                <Label htmlFor="settingsSalonName" className="flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  Nombre del Salón
                </Label>
                <Input
                  id="settingsSalonName"
                  value={profileForm.salonName}
                  onChange={(e) => setProfileForm((f) => ({ ...f, salonName: e.target.value }))}
                  placeholder="Mi Peluquería"
                />
              </div>

              {/* Salon Address */}
              <div className="space-y-2">
                <Label htmlFor="settingsSalonAddress" className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Dirección del Salón
                </Label>
                <Input
                  id="settingsSalonAddress"
                  value={profileForm.salonAddress}
                  onChange={(e) => setProfileForm((f) => ({ ...f, salonAddress: e.target.value }))}
                  placeholder="Calle Principal 123, Madrid"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                style={{ backgroundColor: ROSE_GOLD }}
                className="text-white hover:opacity-90 w-full sm:w-auto"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* =================== ACCOUNT SECTION =================== */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: CHARCOAL }}>
                <Shield className="h-4 w-4" style={{ color: ROSE_GOLD }} />
                Cuenta
              </CardTitle>
              <CardDescription className="text-sm">
                Información de la cuenta y seguridad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rol</span>
                </div>
                <Badge
                  className="text-xs px-2.5 py-0.5"
                  style={{ backgroundColor: `${ROSE_GOLD}20`, color: ROSE_GOLD, border: 'none' }}
                >
                  {user?.role === 'OWNER' ? 'PROPIETARIO' : user?.role || 'OWNER'}
                </Badge>
              </div>

              {/* Member Since */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Miembro desde</span>
                </div>
                <span className="text-sm font-medium capitalize" style={{ color: CHARCOAL }}>
                  {memberSince}
                </span>
              </div>

              <Separator />

              {/* Change Password (UI only for MVP) */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm" style={{ color: CHARCOAL }}>
                    Cambiar Contraseña
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-xs">Contraseña actual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      disabled
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-xs">Nueva contraseña</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-xs">Confirmar contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        disabled
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  El cambio de contraseña no está disponible en esta versión.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* =================== DATA SECTION =================== */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: CHARCOAL }}>
                <Database className="h-4 w-4" style={{ color: ROSE_GOLD }} />
                Datos
              </CardTitle>
              <CardDescription className="text-sm">
                Gestión de datos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm" style={{ color: CHARCOAL }}>
                      Cargar Datos de Demostración
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Carga datos de ejemplo incluyendo servicios, clientes, citas y automatizaciones
                      para explorar todas las funcionalidades de CrmNailsAgency.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSeedDialogOpen(true)}
                  className="w-full sm:w-auto"
                  style={{ borderColor: ROSE_GOLD, color: ROSE_GOLD }}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Cargar Datos de Demostración
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* =================== PRESENTATION DOWNLOAD SECTION =================== */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: CHARCOAL }}>
                <Presentation className="h-4 w-4" style={{ color: ROSE_GOLD }} />
                Presentación Comercial
              </CardTitle>
              <CardDescription className="text-sm">
                Descarga y comparte CrmNailsAgency con posibles clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 shrink-0 mt-0.5" style={{ color: ROSE_GOLD }} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm" style={{ color: CHARCOAL }}>
                      Presentación de CrmNailsAgency
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Presentación profesional de 10 diapositivas para compartir por correo electrónico,
                      Telegram o WhatsApp con posibles clientes.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { window.open('/api/download?format=pdf', '_blank'); toast.success('Descargando PDF...'); }}
                    className="w-full"
                    style={{ borderColor: ROSE_GOLD, color: ROSE_GOLD }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { window.open('/api/download?format=pptx', '_blank'); toast.success('Descargando PPTX...'); }}
                    className="w-full"
                    style={{ borderColor: ROSE_GOLD, color: ROSE_GOLD }}
                  >
                    <Presentation className="h-4 w-4 mr-2" />
                    Descargar PPTX
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  PDF ideal para WhatsApp y Telegram · PPTX editable en PowerPoint y Google Slides
                </p>
              </div>
            </CardContent>
          </Card>

          {/* =================== ONBOARDING SECTION =================== */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: CHARCOAL }}>
                <BookOpen className="h-4 w-4" style={{ color: ROSE_GOLD }} />
                Guía de Uso
              </CardTitle>
              <CardDescription className="text-sm">
                Aprende a usar CrmNailsAgency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Rocket className="h-5 w-5 shrink-0 mt-0.5" style={{ color: ROSE_GOLD }} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm" style={{ color: CHARCOAL }}>
                      Tour Guiado de CrmNailsAgency
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Repasa el recorrido interactivo para conocer todas las funcionalidades
                      disponibles: dashboard, calendario, clientes, servicios y automatizaciones.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setOnboardingOpen(true)}
                  className="w-full sm:w-auto"
                  style={{ borderColor: ROSE_GOLD, color: ROSE_GOLD }}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver Tour Guiado
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* =================== INTEGRATIONS SECTION =================== */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: CHARCOAL }}>
                <Calendar className="h-4 w-4" style={{ color: ROSE_GOLD }} />
                Integraciones
              </CardTitle>
              <CardDescription className="text-sm">
                Conecta Nailagenda con otros servicios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm" style={{ color: CHARCOAL }}>
                      Google Calendar
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sincroniza tus citas de Nailagenda con Google Calendar.
                      Las citas se reflejarán automáticamente en ambos sentidos.
                    </p>
                  </div>
                </div>
                <div id="google-calendar-status" className="text-xs">
                  {gcLoading ? (
                    <span className="text-muted-foreground">Verificando conexión...</span>
                  ) : gcConnected ? (
                    <span className="text-green-600 dark:text-green-400">
                      Conectado como <strong>{gcEmail}</strong>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      No conectado — las citas no se sincronizan con Google Calendar
                    </span>
                  )}
                </div>
                {gcConnected ? (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={handleGoogleDisconnect}
                    disabled={gcDisconnecting}
                  >
                    {gcDisconnecting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Desconectando...</>
                    ) : (
                      <><Calendar className="h-4 w-4 mr-2" /> Desconectar Google Calendar</>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    style={{ borderColor: ROSE_GOLD, color: ROSE_GOLD }}
                    onClick={handleGoogleConnect}
                    disabled={gcConnecting}
                  >
                    {gcConnecting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Conectando...</>
                    ) : (
                      <><Calendar className="h-4 w-4 mr-2" /> Conectar Google Calendar</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* =================== DANGER ZONE =================== */}
          <Card className="border-red-200 dark:border-red-900/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Zona de Peligro
              </CardTitle>
              <CardDescription className="text-sm">
                Acciones irreversibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <LogOut className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-red-700 dark:text-red-300">
                      Cerrar Sesión
                    </h4>
                    <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                      Se cerrará tu sesión y tendrás que iniciar sesión de nuevo para acceder
                      a tu cuenta.
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </CardContent>
          </Card>

            </div>
          </ScrollArea>
        </TabsContent>

        {/* ====== PRODUCTION TAB ====== */}
        <TabsContent value="produccion">
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 sm:p-6 max-w-3xl mx-auto">
              <ProductionGuide />
            </div>
          </ScrollArea>
        </TabsContent>
         </Tabs>
       </div>
 
       {/* Onboarding Tour */}
       <OnboardingTour
         open={onboardingOpen}
         onClose={() => setOnboardingOpen(false)}
         onComplete={() => setOnboardingOpen(false)}
       />

      {/* Seed Confirmation Dialog */}
      <AlertDialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cargar datos de demostración?</AlertDialogTitle>
            <AlertDialogDescription>
              Se crearán datos de ejemplo incluyendo servicios, clientes, citas y reglas de
              automatización. Si ya existen datos de demostración, se mostrará un error.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={seeding}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSeed}
              disabled={seeding}
              style={{ backgroundColor: ROSE_GOLD }}
              className="text-white hover:opacity-90"
            >
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Cargar Datos
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
