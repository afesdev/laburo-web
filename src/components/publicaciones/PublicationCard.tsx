import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Star, MapPin, Share2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleLike } from '../../lib/likes';
import { useAuth } from '../../store/auth';
import type { Publicacion } from '../../types/publicacion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PublicationCard({ pub }: { pub: Publicacion }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState(pub.user_liked);
  const [likesCount, setLikesCount] = useState(pub.likes_count);

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(pub.id),
    onMutate: () => {
      setLiked(!liked);
      setLikesCount((c) => (liked ? c - 1 : c + 1));
    },
    onError: () => {
      setLiked(pub.user_liked);
      setLikesCount(pub.likes_count);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['publicaciones'] });
    },
  });

  const fecha = (() => {
    try {
      return formatDistanceToNow(new Date(pub.fecha_creacion), { addSuffix: true, locale: es });
    } catch {
      return pub.fecha_creacion;
    }
  })();

  const initials = pub.profesional.usuario.nombre_completo
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <article className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link to={`/profesionales/${pub.profesional.id}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-100">
            {pub.profesional.foto_perfil_url ? (
              <img
                src={pub.profesional.foto_perfil_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-sm font-bold">
                {initials}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            to={`/profesionales/${pub.profesional.id}`}
            className="font-semibold text-[14px] text-gray-900 hover:text-indigo-700 transition-colors truncate block leading-tight"
          >
            {pub.profesional.usuario.nombre_completo}
          </Link>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">
              {pub.profesional.categoria.nombre}
            </span>
            {pub.profesional.ciudad && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400">
                <MapPin className="w-2.5 h-2.5" />
                {pub.profesional.ciudad}
              </span>
            )}
            <span className="text-[11px] text-gray-300">·</span>
            <span className="text-[11px] text-gray-400">{fecha}</span>
          </div>
        </div>

        {(pub.total_resenas ?? 0) > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0 bg-amber-50 px-2 py-1 rounded-lg">
            <Star className="w-3 h-3 text-amber-400 fill-current" />
            <span className="text-[12px] font-bold text-amber-700">
              {(pub.promedio_resenas ?? 0).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Imagen */}
      {pub.imagen_url && (
        <Link to={`/publicaciones/${pub.id}`}>
          <div className="overflow-hidden mx-4 rounded-xl">
            <img
              src={pub.imagen_url}
              alt={pub.titulo}
              className="w-full max-h-72 object-cover bg-gray-100 hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
          </div>
        </Link>
      )}

      {/* Body */}
      <div className="px-4 pt-3 pb-1">
        <Link to={`/publicaciones/${pub.id}`}>
          <h2 className="font-bold text-gray-900 text-[15px] leading-snug mb-1 hover:text-indigo-700 transition-colors">
            {pub.titulo}
          </h2>
        </Link>
        {pub.descripcion && (
          <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">
            {pub.descripcion}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-2.5">
        <button
          onClick={() => {
            if (!user) { navigate('/login'); return; }
            likeMutation.mutate();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
            liked
              ? 'bg-red-50 text-red-500'
              : 'text-gray-500 hover:bg-gray-50 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
          {likesCount > 0 && <span>{likesCount}</span>}
        </button>

        <Link
          to={`/publicaciones/${pub.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-all duration-150"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comentar</span>
        </Link>

        <button
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all duration-150"
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/publicaciones/${pub.id}`);
          }}
          title="Copiar enlace"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}
