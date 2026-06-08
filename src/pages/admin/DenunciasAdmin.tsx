import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, RefreshCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../lib/api';

interface Denuncia {
  id: number;
  motivo: string;
  descripcion?: string;
  estado: 'pendiente' | 'resuelta' | 'desestimada';
  fecha_creacion: string;
  fecha_resolucion?: string;
  notas_admin?: string;
  denunciante?: { nombre_completo: string; email: string };
  profesional?: { usuario?: { nombre_completo: string } };
}

const estadoBadge = (estado: string) => {
  const map: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    resuelta: 'bg-green-100 text-green-700',
    desestimada: 'bg-gray-100 text-gray-600',
  };
  return map[estado] ?? 'bg-gray-100 text-gray-600';
};

function ResolverModal({
  denuncia,
  onClose,
  onResolver,
}: {
  denuncia: Denuncia;
  onClose: () => void;
  onResolver: (id: number, estado: string, notas: string) => void;
}) {
  const [notas, setNotas] = useState(denuncia.notas_admin ?? '');
  const [nuevoEstado, setNuevoEstado] = useState<'resuelta' | 'desestimada'>('resuelta');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Resolver denuncia #{denuncia.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-gray-700">Motivo: <span className="font-normal text-gray-600">{denuncia.motivo}</span></p>
            {denuncia.descripcion && (
              <p className="text-gray-500 mt-1">{denuncia.descripcion}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Resolución</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setNuevoEstado('resuelta')}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  nuevoEstado === 'resuelta'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                ✓ Resuelta
              </button>
              <button
                onClick={() => setNuevoEstado('desestimada')}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  nuevoEstado === 'desestimada'
                    ? 'bg-gray-700 text-white border-gray-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                ✕ Desestimada
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Notas internas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones sobre la resolución..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onResolver(denuncia.id, nuevoEstado, notas); onClose(); }}
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

export default function DenunciasAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('pendiente');
  const [selected, setSelected] = useState<Denuncia | null>(null);

  const { data, isLoading, refetch } = useQuery<{ data: Denuncia[]; total: number }>({
    queryKey: ['admin', 'denuncias'],
    queryFn: () => api.get('/denuncias?limit=100').then((r) => r.data),
  });

  const resolverMutation = useMutation({
    mutationFn: ({ id, estado, notas_admin }: { id: number; estado: string; notas_admin: string }) =>
      api.patch(`/denuncias/${id}`, { estado, notas_admin }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'denuncias'] }),
  });

  const denuncias = data?.data ?? [];
  const pendientes = denuncias.filter((d) => d.estado === 'pendiente').length;

  const filtered = denuncias.filter((d) => {
    const matchEstado = !estadoFiltro || d.estado === estadoFiltro;
    const matchSearch =
      !search ||
      d.motivo.toLowerCase().includes(search.toLowerCase()) ||
      d.denunciante?.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
      d.profesional?.usuario?.nombre_completo.toLowerCase().includes(search.toLowerCase());
    return matchEstado && matchSearch;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Denuncias</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendientes > 0
              ? `${pendientes} denuncia(s) pendiente(s) de revisión`
              : 'Sin denuncias pendientes'}
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
        {[
          { label: 'Pendientes', key: 'pendiente', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Resueltas', key: 'resuelta', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Desestimadas', key: 'desestimada', icon: AlertTriangle, color: 'text-gray-600 bg-gray-50' },
        ].map(({ label, key, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setEstadoFiltro(estadoFiltro === key ? '' : key)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              estadoFiltro === key ? 'border-indigo-300 shadow-sm' : 'border-transparent'
            } bg-white`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {denuncias.filter((d) => d.estado === key).length}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por motivo, denunciante o profesional..."
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
          <option value="resuelta">Resueltas</option>
          <option value="desestimada">Desestimadas</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Sin denuncias con ese filtro.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Denunciante</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Profesional</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Motivo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{d.id}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900 truncate max-w-[140px]">
                        {d.denunciante?.nombre_completo ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">
                        {d.denunciante?.email}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800 truncate max-w-[140px]">
                        {d.profesional?.usuario?.nombre_completo ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className="font-medium text-gray-800">{d.motivo}</p>
                      {d.descripcion && (
                        <p className="text-xs text-gray-400 truncate">{d.descripcion}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadge(d.estado)}`}>
                        {d.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {format(new Date(d.fecha_creacion), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3.5">
                      {d.estado === 'pendiente' && (
                        <button
                          onClick={() => setSelected(d)}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
                        >
                          Resolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <ResolverModal
          denuncia={selected}
          onClose={() => setSelected(null)}
          onResolver={(id, estado, notas_admin) =>
            resolverMutation.mutate({ id, estado, notas_admin })
          }
        />
      )}
    </div>
  );
}
