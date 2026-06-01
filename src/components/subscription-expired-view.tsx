'use client';

import { Button } from '@/components/ui/button';
import { Lock, AlertCircle, Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

export default function SubscriptionExpiredView() {
  const { logout } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
        <div className="flex justify-center">
          <div className="p-4 bg-red-50 rounded-full">
            <Lock className="h-12 w-12 text-red-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Suscripción Vencida</h1>
          <p className="text-gray-500">
            Tu periodo de acceso a CrmNailsAgency ha expirado. 
            Para continuar gestionando tu salón, por favor contacta al administrador para renovar tu suscripción.
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3 text-left">
          <AlertCircle className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            El administrador reactivará tu cuenta una vez confirmado el pago del nuevo periodo de 30 días.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            className="w-full bg-[#B76E79] hover:bg-[#9a5b64] text-white gap-2"
            onClick={() => window.location.href = 'mailto:admin@mayenailsart.com?subject=Renovación de Suscripción CrmNailsAgency'}
          >
            <Mail className="h-4 w-4" />
            Contactar Administrador
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-gray-500"
            onClick={logout}
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
