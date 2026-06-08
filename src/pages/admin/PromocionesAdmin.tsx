import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Eye, Filter, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../lib/api';

interface Promocion {
  id: number;
  tipo: string;
  estado: string;
  vistas: number;
  clics: number;
  created_at: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  plan: { nombre: string; precio: number; duracionDias: number };
  profesional: {
    id: number;
    usuario: { nombre_completo: string; email: string };
  };
  pagos: { monto: number; metodo_pago: string; referencia_externa: string | null; estado: string }[];
  banner?: { imagenUrl?: string; titulo?: string };
}

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'pendiente_pago', label: 'Pend. pago' },
  { value: 'pendiente_aprobacion', label: 'Pend. aprobación' },
  { value: 'activa', label: 'Activa' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'finalizada', label: 'Finalizada' },
];

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
    pendiente_pago: 'Pendiente pago',
    pendiente_aprobacion: 'Pend. aprobación',
    activa: 'Activa',
    rechazada: 'Rechazada',
    cancelada: 'Cancelada',
    finalizada: 'Finalizada',
  };
  return map[estado] ?? estado;
};

const estadoPagoBadge = (estado: string) => {
  const map: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    aprobado: 'bg-green-100 text-green-700 border-green-200',
    rechazado: 'bg-red-100 text-red-700 border-red-200',
    reembolsado: 'bg-purple-100 text-purple-700 border-purple-200',
  };
  return map[estado] ?? 'bg-gray-100 text-gray-600';
};

const tipoLabel = (tipo: string) => {
  const map: Record<string, string> = {
    banner: '🖼 Banner',
    perfil: '👤 Perfil',
    publicacion: '📄 Publicación',
  };
  return map[tipo] ?? tipo;
};

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const tiempoRestante = (fecha_fin?: string): string => {
  if (!fecha_fin) return '—';
  try {
    const fin = new Date(fecha_fin);
    const ahora = new Date();
    const diff = fin.getTime() - ahora.getTime();
    if (diff <= 0) return 'Vencida';
    const dias = Math.floor(diff / 86400000);
    const horas = Math.floor((diff % 86400000) / 3600000);
    if (dias > 0) return `${dias}d ${horas}h`;
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${horas}h ${mins}m`;
  } catch {
    return '—';
  }
};

// ── Modal detalle / acción ─────────────────────────────────────────────────────
function DetalleModal({
  promo,
  onClose,
  onAprobar,
  onRechazar,
}: {
  promo: Promocion;
  onClose: () => void;
  onAprobar: (id: number) => void;
  onRechazar: (id: number, motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [step, setStep] = useState<'detail' | 'reject'>('detail');
  const pago = promo.pagos?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Promoción #{promo.id} — {tipoLabel(promo.tipo)}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {step === 'detail' && (
          <div className="px-6 py-5 space-y-5">
            {/* Estado */}
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoBadge(promo.estado)}`}>
                {estadoLabel(promo.estado)}
              </span>
              <span className="text-xs text-gray-400">{tipoLabel(promo.tipo)}</span>
            </div>

            {/* Profesional */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Profesional</p>
              <p className="text-sm font-semibold text-gray-900">{promo.profesional?.usuario?.nombre_completo}</p>
              <p className="text-xs text-gray-500">{promo.profesional?.usuario?.email}</p>
            </div>

            {/* Plan */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Plan</p>
                <p className="text-sm font-semibold text-gray-900">{promo.plan?.nombre}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Precio</p>
                <p className="text-sm font-semibold text-gray-900">{formatCOP(promo.plan?.precio ?? 0)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Duración</p>
                <p className="text-sm font-semibold text-gray-900">{promo.plan?.duracionDias} días</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Creada</p>
                <p className="text-sm font-semibold text-gray-900">
                  {(() => {
                    try { return format(new Date(promo.created_at), 'dd/MM/yyyy', { locale: es }); }
                    catch { return ''; }
                  })()}
                </p>
              </div>
              {promo.fecha_fin && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Tiempo restante</p>
                  <p className={`text-sm font-semibold ${tiempoRestante(promo.fecha_fin) === 'Vencida' ? 'text-red-500' : 'text-gray-900'}`}>
                    {tiempoRestante(promo.fecha_fin)}
                  </p>
                </div>
              )}
            </div>

            {/* Pago */}
            {pago ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Comprobante de pago</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monto pagado</span>
                    <span className="font-semibold text-gray-900">{formatCOP(pago.monto)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Método</span>
                    <span className="font-medium text-gray-700 capitalize">{pago.metodo_pago}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Referencia</span>
                    <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      {pago.referencia_externa ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estado</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${estadoPagoBadge(pago.estado)}`}>
                      {pago.estado}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">Sin comprobante de pago</p>
              </div>
            )}

            {/* Estadísticas */}
            <div className="flex gap-4">
              <div className="text-center flex-1 bg-blue-50 rounded-lg py-2">
                <p className="text-lg font-bold text-blue-700">{promo.vistas ?? 0}</p>
                <p className="text-xs text-blue-500">Vistas</p>
              </div>
              <div className="text-center flex-1 bg-indigo-50 rounded-lg py-2">
                <p className="text-lg font-bold text-indigo-700">{promo.clics ?? 0}</p>
                <p className="text-xs text-indigo-500">Clics</p>
              </div>
            </div>

            {/* Acciones */}
            {promo.estado === 'pendiente_aprobacion' && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('reject')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
                <button
                  onClick={() => { onAprobar(promo.id); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'reject' && (
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-600">
              Escribe el motivo del rechazo. El profesional recibirá un correo con este mensaje.
            </p>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: El comprobante de pago no es legible. Por favor envía una imagen más clara."
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep('detail')}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={!motivo.trim()}
                onClick={() => { onRechazar(promo.id, motivo); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Confirmar rechazo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PromocionesAdmin() {
  const qc = useQueryClient();
  const [estadoFiltro, setEstadoFiltro] = useState('pendiente_aprobacion');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Promocion | null>(null);

  const { data: promos = [], isLoading, refetch } = useQuery<Promocion[]>({
    queryKey: ['admin', 'promociones', estadoFiltro],
    queryFn: () =>
      api.get('/promociones', { params: estadoFiltro ? { estado: estadoFiltro } : {} }).then((r) => r.data),
  });

  const aprobarMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/promociones/${id}/aprobar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promociones'] }),
  });

  const rechazarMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      api.patch(`/promociones/${id}/rechazar`, { motivo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promociones'] }),
  });

  const filtered = promos.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.profesional?.usuario?.nombre_completo.toLowerCase().includes(q) ||
      p.profesional?.usuario?.email.toLowerCase().includes(q) ||
      p.tipo.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
          <p className="text-sm text-gray-500 mt-1">Aprueba o rechaza las solicitudes de promoción</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por profesional, email o tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        {/* Estado */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No hay promociones con ese filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Profesional</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo / Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiempo rest.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pago</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => {
                  const pago = p.pagos?.[0];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{p.id}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900 truncate max-w-[160px]">
                          {p.profesional?.usuario?.nombre_completo}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">
                          {p.profesional?.usuario?.email}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-800">{tipoLabel(p.tipo)}</p>
                        <p className="text-xs text-gray-400">{p.plan?.nombre}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${estadoBadge(p.estado)}`}>
                          {estadoLabel(p.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        {(['activa', 'pendiente_aprobacion', 'pendiente_pago'].includes(p.estado)) ? (
                          <span className={tiempoRestante(p.fecha_fin) === 'Vencida' ? 'text-red-500 font-semibold' : 'text-gray-500'}>
                            {tiempoRestante(p.fecha_fin)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {pago ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{formatCOP(pago.monto)}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${estadoPagoBadge(pago.estado)}`}>
                              {pago.estado === 'aprobado' ? 'Pagado' : pago.estado === 'pendiente' ? 'Pendiente' : pago.estado}
                            </span>
                            <span className="text-xs text-gray-400 hidden lg:inline capitalize">{pago.metodo_pago}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Sin pago</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {(() => {
                          try { return format(new Date(p.created_at), 'dd MMM yyyy', { locale: es }); }
                          catch { return ''; }
                        })()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelected(p)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {p.estado === 'pendiente_aprobacion' && (
                            <>
                              <button
                                onClick={() => aprobarMutation.mutate(p.id)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Aprobar"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelected(p)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Rechazar"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <DetalleModal
          promo={selected}
          onClose={() => setSelected(null)}
          onAprobar={(id) => aprobarMutation.mutate(id)}
          onRechazar={(id, motivo) => rechazarMutation.mutate({ id, motivo })}
        />
      )}
    </div>
  );
}
