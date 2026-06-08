import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../lib/api';

interface Verificacion {
  id: number;
  profesional_id: number;
  tipo_documento: string;
  documento_url: string;
  documento_trasero_url?: string;
  selfie_url?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  notas_admin?: string;
  fecha_solicitud: string;
  fecha_resolucion?: string;
  profesional?: {
    usuario?: { nombre_completo: string; email: string };
    categoria?: { nombre: string };
  };
}

const estadoBadge = (estado: string) => {
  const map: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    aprobado: 'bg-green-100 text-green-700 border-green-200',
    rechazado: 'bg-red-100 text-red-700 border-red-200',
  };
  return map[estado] ?? 'bg-gray-100 text-gray-600';
};

const estadoLabel = (estado: string) => {
  const map: Record<string, string> = {
    pendiente: 'Pendiente',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
  };
  return map[estado] ?? estado;
};

function RevisarModal({
  v,
  onClose,
  onRevisar,
}: {
  v: Verificacion;
  onClose: () => void;
  onRevisar: (id: number, estado: string, notas_admin: string) => void;
}) {
  const [notas, setNotas] = useState(v.notas_admin ?? '');
  const [nuevoEstado, setNuevoEstado] = useState<'aprobado' | 'rechazado'>('aprobado');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Revisar verificación #{v.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Info profesional */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
            <p><span className="font-medium text-gray-700">Profesional:</span>{' '}
              <span className="text-gray-600">{v.profesional?.usuario?.nombre_completo ?? '—'}</span>
            </p>
            <p><span className="font-medium text-gray-700">Email:</span>{' '}
              <span className="text-gray-600">{v.profesional?.usuario?.email ?? '—'}</span>
            </p>
            <p><span className="font-medium text-gray-700">Categoría:</span>{' '}
              <span className="text-gray-600">{v.profesional?.categoria?.nombre ?? '—'}</span>
            </p>
            <p><span className="font-medium text-gray-700">Documento:</span>{' '}
              <span className="text-gray-600">{v.tipo_documento}</span>
            </p>
          </div>

          {/* Documentos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Documento frontal</label>
              <a href={v.documento_url} target="_blank" rel="noopener noreferrer"
                className="block aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 transition-colors">
                <img src={v.documento_url} alt="Documento frontal" className="w-full h-full object-cover" />
              </a>
            </div>
            {v.documento_trasero_url && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Documento trasero</label>
                <a href={v.documento_trasero_url} target="_blank" rel="noopener noreferrer"
                  className="block aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 transition-colors">
                  <img src={v.documento_trasero_url} alt="Documento trasero" className="w-full h-full object-cover" />
                </a>
              </div>
            )}
            {v.selfie_url && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Selfie</label>
                <a href={v.selfie_url} target="_blank" rel="noopener noreferrer"
                  className="block aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 transition-colors">
                  <img src={v.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                </a>
              </div>
            )}
          </div>

          {/* Resolución */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Decisión</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setNuevoEstado('aprobado')}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  nuevoEstado === 'aprobado'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                ✓ Aprobar
              </button>
              <button
                onClick={() => setNuevoEstado('rechazado')}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  nuevoEstado === 'rechazado'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                ✕ Rechazar
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Notas para el profesional {nuevoEstado === 'rechazado' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder={
                nuevoEstado === 'rechazado'
                  ? 'Indica el motivo del rechazo (obligatorio)'
                  : 'Notas opcionales...'
              }
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
            {nuevoEstado === 'rechazado' && !notas.trim() && (
              <p className="text-xs text-red-500 mt-1">Campo requerido al rechazar</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (nuevoEstado === 'rechazado' && !notas.trim()) return;
                onRevisar(v.id, nuevoEstado, notas);
                onClose();
              }}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerificacionesAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('pendiente');
  const [selected, setSelected] = useState<Verificacion | null>(null);

  const { data, isLoading, refetch } = useQuery<Verificacion[]>({
    queryKey: ['admin', 'verificaciones'],
    queryFn: () => api.get('/verificaciones').then((r) => r.data),
  });

  const revisarMutation = useMutation({
    mutationFn: ({ id, estado, notas_admin }: { id: number; estado: string; notas_admin: string }) =>
      api.patch(`/verificaciones/${id}/revisar`, { estado, notas_admin }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'verificaciones'] }),
  });

  const verificaciones = data ?? [];
  const pendientes = verificaciones.filter((v) => v.estado === 'pendiente').length;
  const aprobadas = verificaciones.filter((v) => v.estado === 'aprobado').length;
  const rechazadas = verificaciones.filter((v) => v.estado === 'rechazado').length;

  const filtered = verificaciones.filter((v) => {
    const matchEstado = !estadoFiltro || v.estado === estadoFiltro;
    const matchSearch =
      !search ||
      v.profesional?.usuario?.nombre_completo?.toLowerCase().includes(search.toLowerCase()) ||
      v.profesional?.usuario?.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.tipo_documento.toLowerCase().includes(search.toLowerCase());
    return matchEstado && matchSearch;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verificaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendientes > 0
              ? `${pendientes} solicitud(es) pendiente(s) de revisión`
              : 'Sin solicitudes pendientes'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setEstadoFiltro(estadoFiltro === 'pendiente' ? '' : 'pendiente')}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
            estadoFiltro === 'pendiente' ? 'border-yellow-300 shadow-sm' : 'border-transparent'
          } bg-white`}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-yellow-600 bg-yellow-50">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{pendientes}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
        </button>
        <button
          onClick={() => setEstadoFiltro(estadoFiltro === 'aprobado' ? '' : 'aprobado')}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
            estadoFiltro === 'aprobado' ? 'border-green-300 shadow-sm' : 'border-transparent'
          } bg-white`}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-green-600 bg-green-50">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{aprobadas}</p>
            <p className="text-xs text-gray-500">Aprobadas</p>
          </div>
        </button>
        <button
          onClick={() => setEstadoFiltro(estadoFiltro === 'rechazado' ? '' : 'rechazado')}
          className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
            estadoFiltro === 'rechazado' ? 'border-red-300 shadow-sm' : 'border-transparent'
          } bg-white`}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-red-600 bg-red-50">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{rechazadas}</p>
            <p className="text-xs text-gray-500">Rechazadas</p>
          </div>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o tipo de documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobado">Aprobadas</option>
          <option value="rechazado">Rechazadas</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Sin verificaciones con ese filtro.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Profesional</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Documento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Solicitud</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{v.id}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900 truncate max-w-[160px]">
                        {v.profesional?.usuario?.nombre_completo ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">
                        {v.profesional?.usuario?.email}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800">{v.tipo_documento}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoBadge(v.estado)}`}>
                        {estadoLabel(v.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {format(new Date(v.fecha_solicitud), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setSelected(v)}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
                      >
                        {v.estado === 'pendiente' ? 'Revisar' : 'Ver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <RevisarModal
          v={selected}
          onClose={() => setSelected(null)}
          onRevisar={(id, estado, notas_admin) =>
            revisarMutation.mutate({ id, estado, notas_admin })
          }
        />
      )}
    </div>
  );
}
