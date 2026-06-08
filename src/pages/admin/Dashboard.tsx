import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Megaphone, Clock, CheckCircle, XCircle, Users, TrendingUp,
  UserCheck, Camera, AlertTriangle,
} from 'lucide-react';
import api from '../../lib/api';
import type { Promocion } from '../../types/promocion';

function StatCard({
  icon: Icon, label, value, color, to,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  to?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const { data: promosData } = useQuery<Promocion[]>({
    queryKey: ['admin', 'promociones', 'all'],
    queryFn: () => api.get('/promociones').then((r) => r.data),
  });

  const { data: usuariosData } = useQuery<{ data: any[]; meta: { total: number } }>({
    queryKey: ['admin', 'usuarios'],
    queryFn: () => api.get('/usuarios?limit=1&page=1').then((r) => r.data),
  });

  const promos = promosData ?? [];
  const pendientesAprobacion = promos.filter((p) => p.estado === 'pendiente_aprobacion').length;
  const pendientesPago = promos.filter((p) => p.estado === 'pendiente_pago').length;
  const activas = promos.filter((p) => p.estado === 'activa').length;
  const rechazadas = promos.filter((p) => p.estado === 'rechazada').length;
  const finalizadas = promos.filter((p) => p.estado === 'finalizada').length;
  const total = promos.length;
  const totalUsuarios = usuariosData?.meta?.total ?? 0;

  const recientes = [...promos]
    .filter((p) => p.estado === 'pendiente_aprobacion')
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 5);

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      pendiente_pago: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      pendiente_aprobacion: 'bg-blue-100 text-blue-700 border-blue-200',
      activa: 'bg-green-100 text-green-700 border-green-200',
      rechazada: 'bg-red-100 text-red-700 border-red-200',
      cancelada: 'bg-gray-100 text-gray-600 border-gray-200',
      finalizada: 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-600';
  };

  const estadoLabel = (estado: string) => {
    const map: Record<string, string> = {
      pendiente_pago: 'Pend. pago',
      pendiente_aprobacion: 'Pend. aprob.',
      activa: 'Activa',
      rechazada: 'Rechazada',
      cancelada: 'Cancelada',
      finalizada: 'Finalizada',
    };
    return map[estado] ?? estado;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen general de OficiosApp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Clock} label="Pend. aprobación" value={pendientesAprobacion} color="bg-blue-500" to="/admin/promociones" />
        <StatCard icon={CheckCircle} label="Promociones activas" value={activas} color="bg-green-500" to="/admin/promociones" />
        <StatCard icon={Users} label="Usuarios" value={totalUsuarios} color="bg-indigo-500" to="/admin/usuarios" />
        <StatCard icon={Camera} label="Total promociones" value={total} color="bg-violet-500" to="/admin/promociones" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Promociones por estado</p>
          <div className="space-y-2">
            {[
              { label: 'Pend. pago', key: 'pendiente_pago', count: pendientesPago, color: 'bg-yellow-400' },
              { label: 'Pend. aprobación', key: 'pendiente_aprobacion', count: pendientesAprobacion, color: 'bg-blue-500' },
              { label: 'Activas', key: 'activa', count: activas, color: 'bg-green-500' },
              { label: 'Rechazadas', key: 'rechazada', count: rechazadas, color: 'bg-red-500' },
              { label: 'Finalizadas', key: 'finalizada', count: finalizadas, color: 'bg-purple-400' },
            ].map(({ label, key, count, color }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-700">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {total === 0 && (
              <p className="text-sm text-center text-gray-400 py-4">Sin datos aún</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-900">Pendientes de revisión</h2>
              {pendientesAprobacion > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {pendientesAprobacion}
                </span>
              )}
            </div>
            <Link to="/admin/promociones" className="text-xs text-indigo-600 hover:underline font-semibold">
              Ver todas →
            </Link>
          </div>

          {recientes.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No hay promociones pendientes
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recientes.map((p) => (
                <Link
                  key={p.id}
                  to="/admin/promociones"
                  className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {p.profesional?.usuario?.nombre_completo ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {p.tipo} · {p.plan?.nombre}
                    </p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${estadoBadge(p.estado)}`}>
                    {estadoLabel(p.estado)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pendientesAprobacion > 0 && (
          <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{pendientesAprobacion}</strong> promoción(es) esperan aprobación.
              {' '}<Link to="/admin/promociones" className="font-semibold underline">Revisar ahora</Link>
            </p>
          </div>
        )}
        {pendientesPago > 0 && (
          <div className="flex items-center gap-3 px-5 py-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>{pendientesPago}</strong> promoción(es) con pago pendiente por verificar.
            </p>
          </div>
        )}
        {pendientesAprobacion === 0 && pendientesPago === 0 && (
          <div className="flex items-center gap-3 px-5 py-4 bg-green-50 border border-green-200 rounded-xl lg:col-span-2">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-800">Todo al día — no hay promociones pendientes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
