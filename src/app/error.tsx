'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-lg text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Algo salió mal</h2>
        <p className="text-sm text-gray-500 mb-6">
          Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
        </p>
        <Button
          onClick={reset}
          className="bg-[#B76E79] hover:bg-[#9a5b64] text-white cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}
