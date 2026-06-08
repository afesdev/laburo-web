import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, ShieldCheck, User, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../lib/api';

interface Usuario {
  id: number;
  nombre_completo: string;
  email: string;
  telefono?: string;
  rol: 'cliente' | 'profesional' | 'admin';
  estado: string;
  fecha_registro: string;
}

const rolIcon = (rol: string) => {
  if (rol === 'admin') return <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />;
  if (rol === 'profesional') return <Wrench className="w-3.5 h-3.5 text-blue-600" />;
  return <User className="w-3.5 h-3.5 text-gray-500" />;
};

const rolBadge = (rol: string) => {
  const map: Record<string, string> = {
    admin: 'bg-indigo-100 text-indigo-700',
    profesional: 'bg-blue-100 text-blue-700',
    cliente: 'bg-gray-100 text-gray-600',
  };
  return map[rol] ?? 'bg-gray-100 text-gray-600';
};

const estadoBadge = (estado: string) => {
  if (estado === 'activo') return 'bg-green-100 text-green-700';
  if (estado === 'inactivo') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
};

export default function UsuariosAdmin() {
  const [search, setSearch] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [page, setPage] = useState(1);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleRolFilter = (val: string) => { setRolFiltro(val); setPage(1); };
  const limit = 100;

  const { data, isLoading, refetch } = useQuery<{ data: Usuario[]; meta: { total: number } }>({
    queryKey: ['admin', 'usuarios', page],
    queryFn: () => api.get(`/usuarios?limit=${limit}&page=${page}`).then((r) => r.data),
  });

  const usuarios = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const filtered = usuarios.filter((u) => {
    const matchSearch =
      !search ||
      u.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRol = !rolFiltro || u.rol === rolFiltro;
    return matchSearch && matchRol;
  });

  // Contadores
  const totalClientes = usuarios.filter((u) => u.rol === 'cliente').length;
  const totalProfesionales = usuarios.filter((u) => u.rol === 'profesional').length;
  const totalAdmins = usuarios.filter((u) => u.rol === 'admin').length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.meta?.total ?? 0} usuarios registrados en total
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

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Clientes', count: totalClientes, color: 'bg-gray-100 text-gray-700', rol: 'cliente' },
          { label: 'Profesionales', count: totalProfesionales, color: 'bg-blue-100 text-blue-700', rol: 'profesional' },
          { label: 'Admins', count: totalAdmins, color: 'bg-indigo-100 text-indigo-700', rol: 'admin' },
        ].map(({ label, count, color, rol }) => (
          <button
            key={rol}
            onClick={() => handleRolFilter(rolFiltro === rol ? '' : rol)}
            className={`rounded-xl p-4 text-left transition-all border-2 ${
              rolFiltro === rol ? 'border-indigo-300 shadow-sm' : 'border-transparent'
            } ${color}`}
          >
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm font-medium">{label}</p>
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <select
          value={rolFiltro}
          onChange={(e) => handleRolFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="">Todos los roles</option>
          <option value="cliente">Cliente</option>
          <option value="profesional">Profesional</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Sin usuarios con esos filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{u.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                          {u.nombre_completo.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[180px]">
                          {u.nombre_completo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs truncate max-w-[200px]">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${rolBadge(u.rol)}`}>
                        {rolIcon(u.rol)}
                        <span className="capitalize">{u.rol}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadge(u.estado)}`}>
                        {u.estado}
                      </span>
                    </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {(() => {
                          if (!u.fecha_registro) return '—';
                          try { return format(new Date(u.fecha_registro), 'dd MMM yyyy', { locale: es }); }
                          catch { return '—'; }
                        })()}
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {(data?.meta?.total ?? 0) > limit && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages} · {data?.meta?.total ?? 0} usuarios
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage(1)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Primera"
            >
              ««
            </button>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            {(() => {
              const pages: (number | string)[] = [];
              const start = Math.max(1, page - 2);
              const end = Math.min(totalPages, page + 2);
              if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
              for (let i = start; i <= end; i++) pages.push(i);
              if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
              return pages.map((p, i) =>
                typeof p === 'string' ? (
                  <span key={`e${i}`} className="px-1.5 text-xs text-gray-400 select-none">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${
                      p === page
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ),
              );
            })()}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Última"
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
