'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  UserX, 
  UserCheck,
  MoreHorizontal
} from 'lucide-react';
import { api } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminView() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Note: We'll add this method to the api object in a moment
      const result = await (api as any).getAdminUsers();
      setUsers(result);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId);
    try {
      await (api as any).updateUserStatus(userId, !currentStatus);
      toast.success(`Usuario ${!currentStatus ? 'habilitado' : 'inhabilitado'} correctamente`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el estado del usuario');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <ShieldAlert className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Error de Acceso</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchUsers} variant="outline">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#2D2D2D' }}>
            <ShieldCheck className="h-6 w-6" style={{ color: '#B76E79' }} />
            Panel de Administración
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión de usuarios y control de acceso a la plataforma
          </p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar usuario..." 
            className="pl-9" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>
            Lista de todas las cuentas creadas. Puedes habilitar o inhabilitar el acceso a cualquier usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Usuario</th>
                      <th className="px-4 py-3 font-medium">Rol</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No se encontraron usuarios
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{user.name}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-[10px]">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {user.isActive ? (
                                <UserCheck className="h-4 w-4 text-green-500" />
                              ) : (
                                <UserX className="h-4 w-4 text-red-500" />
                              )}
                              <span className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                                {user.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Switch 
                              checked={user.isActive} 
                              onCheckedChange={(checked) => toggleUserStatus(user.id, user.isActive)}
                              disabled={updatingId === user.id}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
