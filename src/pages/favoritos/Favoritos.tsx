import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase, Heart, MapPin, Star, Trash2, Loader2, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../store/auth';
import { fetchFavoritos, removeFavorito } from '../../lib/favoritos';
import { fetchMisLikes } from '../../lib/mis-likes';
import { fetchPublicacion } from '../../lib/publicaciones';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Favoritos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'profesionales' | 'publicaciones'>('profesionales');
  const [removing, setRemoving] = useState<number | null>(null);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const clienteId = user.id;

  const { data: favs, isLoading: loadingFavs, refetch: refetchFavs } = useQuery({
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
      if (!likedIds || likedIds.length === 0) return [];
      const pubs = await Promise.all(likedIds.map((id) => fetchPublicacion(id)));
      return pubs;
    },
    enabled: tab === 'publicaciones' && !!likedIds && likedIds.length > 0,
  });

  const handleRemoveFav = async (profId: number) => {
    setRemoving(profId);
    try {
      await removeFavorito(clienteId, profId);
      refetchFavs();
    } catch {}
    setRemoving(null);
  };

  const profesionales = favs?.data || [];
  const publicaciones = likedPubs || [];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Favoritos</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setTab('profesionales')}
          className={`flex items-center justify-center gap-1.5 flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'profesionales' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Profesionales
        </button>
        <button
          onClick={() => setTab('publicaciones')}
          className={`flex items-center justify-center gap-1.5 flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'publicaciones' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Heart className="w-4 h-4" />
          Publicaciones
        </button>
      </div>

      {/* Profesionales tab */}
      {tab === 'profesionales' && (
        <>
          {loadingFavs ? (
            <LoadingSpinner />
          ) : profesionales.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tienes profesionales guardados</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Explora y guarda tus profesionales favoritos.</p>
              <Link to="/feed" className="text-sm text-blue-600 hover:underline font-medium">
                Explorar profesionales
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {profesionales.map((fav) => (
                <div key={fav.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                  <Link to={`/profesionales/${fav.profesional.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {fav.profesional.foto_perfil_url ? (
                        <img src={fav.profesional.foto_perfil_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
                          {fav.profesional.usuario.nombre_completo.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {fav.profesional.usuario.nombre_completo}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {fav.profesional.categoria && (
                          <span className="text-blue-600 font-medium">{fav.profesional.categoria.nombre}</span>
                        )}
                        {fav.profesional.ciudad && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {fav.profesional.ciudad}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                  <button
                    onClick={() => handleRemoveFav(fav.profesional.id)}
                    disabled={removing === fav.profesional.id}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    {removing === fav.profesional.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Publicaciones tab */}
      {tab === 'publicaciones' && (
        <>
          {loadingIds || loadingPubs ? (
            <LoadingSpinner />
          ) : publicaciones.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tienes publicaciones favoritas</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Dale like a las publicaciones que te gusten.</p>
              <Link to="/feed" className="text-sm text-blue-600 hover:underline font-medium">
                Ver publicaciones
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {publicaciones.map((p) => (
                <Link key={p.id} to={`/publicaciones/${p.id}`}
                  className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100">
                    {p.imagen_url && (
                      <img src={p.imagen_url} alt={p.titulo} className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.titulo}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-3 h-3" />{p.likes_count}
                      </span>
                      {p.total_resenas !== undefined && p.total_resenas > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />{p.promedio_resenas?.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
