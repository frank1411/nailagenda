'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Mail, Lock, User, Store } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthDialog({ open, onOpenChange, onSuccess, defaultMode = 'login' }: AuthDialogProps) {
  const authStore = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>(defaultMode);

  useEffect(() => {
    setActiveTab(defaultMode);
  }, [defaultMode]);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerSalonName, setRegisterSalonName] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // Demo loading
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Por favor, completa todos los campos');
      return;
    }

    setLoginLoading(true);
    try {
      await authStore.login(loginEmail, loginPassword);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!registerName || !registerEmail || !registerPassword) {
      setRegisterError('Por favor, completa todos los campos obligatorios');
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setRegisterLoading(true);
    try {
      await authStore.register(registerEmail, registerName, registerPassword, registerSalonName || undefined);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setRegisterError(err.message || 'Error al registrarse');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      // ULTRA-SIMPLE: Bypass API entirely and set state locally
      authStore.loginDemo();
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Demo login failed:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  const resetForm = () => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterSalonName('');
    setRegisterError('');
  };

  const roseGold = '#B76E79';
  const charcoal = '#2D2D2D';

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" showCloseButton>
        {/* Header with brand accent */}
        <div className="relative px-6 pt-6 pb-0">
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, ${roseGold}, #D4949E)` }}
          />
          <DialogHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${roseGold}15` }}
              >
                <Store size={18} style={{ color: roseGold }} />
              </div>
              <DialogTitle className="text-xl" style={{ color: charcoal }}>
                Bienvenido a MayeNailsArt
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm" style={{ color: `${charcoal}99` }}>
              Gestiona tu peluquería con estilo
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full" style={{ background: `${charcoal}08` }}>
              <TabsTrigger
                value="login"
                className="flex-1 data-[state=active]:text-white"
                style={
                  activeTab === 'login'
                    ? { background: roseGold, color: 'white' }
                    : { color: charcoal }
                }
              >
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 data-[state=active]:text-white"
                style={
                  activeTab === 'register'
                    ? { background: roseGold, color: 'white' }
                    : { color: charcoal }
                }
              >
                Registrarse
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="login-email" style={{ color: charcoal }}>
                    Email
                  </Label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: `${charcoal}60` }}
                    />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-9"
                      style={{ borderColor: `${roseGold}20` }}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="login-password" style={{ color: charcoal }}>
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: `${charcoal}60` }}
                    />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-9"
                      style={{ borderColor: `${roseGold}20` }}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {loginError && (
                  <p className="text-sm text-red-500 text-center">{loginError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full text-white border-0 cursor-pointer"
                  style={{ background: roseGold }}
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="mt-4">
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="register-name" style={{ color: charcoal }}>
                    Nombre <span style={{ color: roseGold }}>*</span>
                  </Label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: `${charcoal}60` }}
                    />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Tu nombre"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="pl-9"
                      style={{ borderColor: `${roseGold}20` }}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="register-email" style={{ color: charcoal }}>
                    Email <span style={{ color: roseGold }}>*</span>
                  </Label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: `${charcoal}60` }}
                    />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-9"
                      style={{ borderColor: `${roseGold}20` }}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="register-password" style={{ color: charcoal }}>
                    Contraseña <span style={{ color: roseGold }}>*</span>
                  </Label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: `${charcoal}60` }}
                    />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="pl-9"
                      style={{ borderColor: `${roseGold}20` }}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="register-salon" style={{ color: charcoal }}>
                    Nombre del salón <span className="text-xs font-normal" style={{ color: `${charcoal}60` }}>(opcional)</span>
                  </Label>
                  <div className="relative">
                    <Store
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: `${charcoal}60` }}
                    />
                    <Input
                      id="register-salon"
                      type="text"
                      placeholder="Mi Peluquería"
                      value={registerSalonName}
                      onChange={(e) => setRegisterSalonName(e.target.value)}
                      className="pl-9"
                      style={{ borderColor: `${roseGold}20` }}
                    />
                  </div>
                </div>

                {registerError && (
                  <p className="text-sm text-red-500 text-center">{registerError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full text-white border-0 cursor-pointer"
                  style={{ background: roseGold }}
                  disabled={registerLoading}
                >
                  {registerLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Demo Button Separator */}
        <div className="px-6 pb-6 pt-2">
          <div className="flex items-center gap-3 my-2">
            <Separator className="flex-1" style={{ background: `${charcoal}15` }} />
            <span className="text-xs" style={{ color: `${charcoal}50` }}>
              o
            </span>
            <Separator className="flex-1" style={{ background: `${charcoal}15` }} />
          </div>

          <Button
            variant="outline"
            className="w-full cursor-pointer group"
            style={{ borderColor: `${roseGold}30`, color: charcoal }}
            onClick={handleDemo}
            disabled={demoLoading}
          >
            {demoLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Preparando demo...
              </>
            ) : (
              <>
                <Sparkles size={16} style={{ color: roseGold }} className="group-hover:scale-110 transition-transform" />
                Probar con Demo
              </>
            )}
          </Button>
          <p className="text-xs text-center mt-2" style={{ color: `${charcoal}50` }}>
            Explora MayeNailsArt con datos de ejemplo
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
