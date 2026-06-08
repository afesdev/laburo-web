import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase, Heart, MapPin, Star, Trash2, Loader2,
  ChevronRight, ShieldCheck, ImagePlus,
} from 'lucide-react';
import { useAuth } from '../../store/auth';
import { fetchFavoritos, removeFavorito } from '../../lib/favoritos';
import { fetchMisLikes } from '../../lib/mis-likes';
import { fetchPublicacion } from '../../lib/publicaciones';
import LoadingSpinner from '../../components/common/LoadingSpinner';

type Tab = 'profesionales' | 'publicaciones';

export default function Favoritos() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const [tab, setTab] = useState<Tab>('profesionales');

  if (!user) { navigate('/login', { replace: true }); return null; }

  const clienteId = user.id;

  const { data: favs, isLoading: loadingFavs } = useQuery({
    queryKey: ['favoritos', clienteId],
    queryFn: () => fetchFavoritos(clienteId),
    enabled: tab === 'profesionales',
  });

  const { data: likedIds, isLoading: loadingIds } = useQuery({
    queryKey: ['mis-likes'],
    queryFn: fetchMisLikes,
    enabled: tab === 'publicaciones',
  });

  const { data: likedPubs, isLoading: loadingPubs } = useQuery({
    queryKey: ['liked-publications', likedIds],
    queryFn: async () => {
      if (!likedIds?.length) return [];
      return Promise.all(likedIds.map((id) => fetchPublicacion(id)));
    },
    enabled: tab === 'publicaciones' && !!likedIds && likedIds.length > 0,
  });

  const removeMutation = useMutation({
    mutationFn: (profId: number) => removeFavorito(clienteId, profId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favoritos', clienteId] }),
  });

  const profesionales = favs?.data ?? [];
  const publicaciones = likedPubs ?? [];
  const profCount     = profesionales.length;
  const pubCount      = publicaciones.length;

  return (
    <div className="min-h-screen bg-[#F8F9FC] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-12">

      {/* ── Hero ── */}
      <div className="pt-8 pb-6">
        <h1 className="text-[28px] sm:text-[34px] font-black text-gray-900 leading-tight">
          Tus <span className="text-indigo-600">favoritos</span>
        </h1>
        <p className="text-[14px] text-gray-400 mt-1">
          Profesionales y publicaciones que guardaste.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-sm w-fit mb-6">
        {([
          { id: 'profesionales', label: 'Profesionales', icon: Briefcase, count: profCount },
          { id: 'publicaciones', label: 'Publicaciones', icon: Heart,     count: pubCount  },
        ] as { id: Tab; label: string; icon: React.ElementType; count: number }[]).map(({ id, label, icon: Icon, count }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                active ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB: Profesionales ── */}
      {tab === 'profesionales' && (
        loadingFavs ? <LoadingSpinner /> :
        profesionales.length === 0 ? (
          <Empty
            icon={<Briefcase className="w-8 h-8 text-gray-300" />}
            title="Sin profesionales guardados"
            desc="Explora y guarda los profesionales que más te gusten."
            cta={{ label: 'Explorar profesionales', to: '/feed' }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profesionales.map((fav) => {
              const p        = fav.profesional;
              const initials = p.usuario.nombre_completo
                .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
              const verified = p.verificacion?.estado === 'aprobado' || p.verificacion?.estado === 'aproado';
              const isRemoving = removeMutation.isPending && removeMutation.variables === p.id;

              return (
                <div
                  key={fav.id}
                  className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-200 transition-all duration-200"
                >
                  {/* Franja color categoría */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-100">
                          {p.foto_perfil_url ? (
                            <img src={p.foto_perfil_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[16px] font-black">
                              {initials}
                            </div>
                          )}
                        </div>
                        {verified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 ring-2 ring-white flex items-center justify-center">
                            <ShieldCheck className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="font-black text-[14px] text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                          {p.usuario.nombre_completo}
                        </p>
                        {p.categoria && (
                          <span className="inline-block mt-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {p.categoria.nombre}
                          </span>
                        )}
                        {p.ciudad && (
                          <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-1.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {p.ciudad}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                      <Link
                        to={`/profesionales/${p.id}`}
                        className="flex items-center justify-center gap-1.5 flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[12px] font-bold rounded-xl transition-colors"
                      >
                        Ver perfil <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => removeMutation.mutate(p.id)}
                        disabled={isRemoving}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all disabled:opacity-50"
                        title="Quitar de favoritos"
                      >
                        {isRemoving
                          ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── TAB: Publicaciones ── */}
      {tab === 'publicaciones' && (
        loadingIds || loadingPubs ? <LoadingSpinner /> :
        publicaciones.length === 0 ? (
          <Empty
            icon={<Heart className="w-8 h-8 text-gray-300" />}
            title="Sin publicaciones guardadas"
            desc="Dale like a las publicaciones que más te interesen."
            cta={{ label: 'Ver publicaciones', to: '/feed' }}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {publicaciones.map((p) => (
              <Link
                key={p.id}
                to={`/publicaciones/${p.id}`}
                className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-200 transition-all duration-200"
              >
                {/* Imagen */}
                <div className="aspect-square bg-gray-50 overflow-hidden relative">
                  {p.imagen_url ? (
                    <img
                      src={p.imagen_url} alt={p.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImagePlus className="w-8 h-8 text-gray-200" />
                    </div>
                  )}
                  {/* Like badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                    <span className="text-[10px] font-bold text-white">{p.likes_count}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-[13px] font-black text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                    {p.titulo}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    {p.profesional?.usuario?.nombre_completo}
                  </p>
                  {(p.promedio_resenas ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] font-bold text-gray-700">{(p.promedio_resenas ?? 0).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}

/* ─── Empty state ─── */
function Empty({ icon, title, desc, cta }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: { label: string; to: string };
}) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="font-black text-gray-700 text-[16px] mb-1">{title}</p>
      <p className="text-[13px] text-gray-400 mb-5 max-w-xs">{desc}</p>
      <Link
        to={cta.to}
        className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl transition-colors"
      >
        {cta.label} <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
