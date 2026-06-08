import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Heart, Share2, Star, Send, Check,
  ChevronLeft, ChevronRight, MapPin, BadgeCheck,
  MessageCircle, X, Camera,
} from 'lucide-react';
import { fetchPublicacion } from '../../lib/publicaciones';
import { fetchResenas, createResena } from '../../lib/resenas';
import { toggleLike } from '../../lib/likes';
import { useAuth } from '../../store/auth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({
  value, size = 'sm', interactive = false, onHover, onSelect, hover,
}: {
  value: number; size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean; onHover?: (v: number) => void;
  onSelect?: (v: number) => void; hover?: number;
}) {
  const sz = { lg: 'w-7 h-7', md: 'w-6 h-6', sm: 'w-4 h-4', xs: 'w-3.5 h-3.5' }[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" disabled={!interactive}
          onMouseEnter={() => interactive && onHover?.(s)}
          onMouseLeave={() => interactive && onHover?.(0)}
          onClick={() => interactive && onSelect?.(s)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star className={`${sz} transition-colors ${s <= (hover ?? value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ fotos, startAt, onClose }: {
  fotos: { id: number; imagen_url: string }[];
  startAt: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startAt);
  const prev = () => setIdx((i) => (i - 1 + fotos.length) % fotos.length);
  const next = () => setIdx((i) => (i + 1) % fotos.length);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  return (
    <div className="fixed inset-0 z-[300] bg-black/97 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <span className="text-white/50 text-[13px] font-medium">{idx + 1} / {fotos.length}</span>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-12" onClick={(e) => e.stopPropagation()}>
        <img src={fotos[idx].imagen_url} alt=""
          className="max-w-full max-h-full object-contain rounded-xl" />
      </div>
      {fotos.length > 1 && (
        <div className="flex items-center justify-center gap-4 py-6" onClick={(e) => e.stopPropagation()}>
          <button onClick={prev}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-1.5">
            {fotos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/30'}`} />
            ))}
          </div>
          <button onClick={next}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Photo Viewer ──────────────────────────────────────────────────────────────
// Muestra la imagen con object-contain (sin recorte) sobre un fondo neutro.
function PhotoViewer({
  fotos, active, onSelect, onOpenLightbox,
}: {
  fotos: { id: number; imagen_url: string }[];
  active: number;
  onSelect: (i: number) => void;
  onOpenLightbox: (i: number) => void;
}) {
  if (fotos.length === 0) return (
    <div className="w-full aspect-square bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
      <Camera className="w-12 h-12 text-gray-200" />
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Imagen principal */}
      <div
        className="relative bg-[#F8F9FC] rounded-2xl border border-gray-100 overflow-hidden cursor-zoom-in group"
        style={{ minHeight: 280 }}
        onClick={() => onOpenLightbox(active)}
      >
        <img
          src={fotos[active].imagen_url}
          alt=""
          className="w-full h-full object-contain"
          style={{ maxHeight: 480, minHeight: 280 }}
        />

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors" />

        {/* Navegación */}
        {fotos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect((active - 1 + fotos.length) % fotos.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect((active + 1) % fotos.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>

            {/* Indicador de foto */}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-[11px] font-bold backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
              {active + 1} / {fotos.length}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {fotos.map((f, i) => (
            <button
              key={f.id}
              onClick={() => onSelect(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border-2 transition-all duration-150 ${
                i === active
                  ? 'border-indigo-500 shadow-sm shadow-indigo-100'
                  : 'border-transparent opacity-60 hover:opacity-90 hover:border-gray-200'
              }`}
            >
              <img src={f.imagen_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PublicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const pubId = Number(id);

  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const { data: pub, isLoading, isError } = useQuery({
    queryKey: ['publicacion', pubId],
    queryFn: () => fetchPublicacion(pubId),
    enabled: !isNaN(pubId),
  });

  const { data: resenasData, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['resenas', pubId],
    queryFn: ({ pageParam = 1 }) => fetchResenas(pubId, { page: pageParam as number, limit: 10 }),
    getNextPageParam: (last) => last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !isNaN(pubId),
  });

  useEffect(() => {
    if (pub) { setLiked(pub.user_liked); setLikesCount(pub.likes_count); }
  }, [pub]);

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(pubId),
    onMutate: () => { setLiked((l) => !l); setLikesCount((c) => liked ? c - 1 : c + 1); },
    onError: () => { setLiked(pub?.user_liked ?? false); setLikesCount(pub?.likes_count ?? 0); },
  });

  const reviewMutation = useMutation({
    mutationFn: () => createResena(pubId, { puntuacion: rating, comentario: comment || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resenas', pubId] });
      queryClient.invalidateQueries({ queryKey: ['publicacion', pubId] });
      setRating(0); setComment('');
    },
  });

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/publicaciones/${pubId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError || !pub) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
        <MessageCircle className="w-8 h-8 text-indigo-300" />
      </div>
      <p className="font-black text-gray-700 text-[18px]">Publicación no encontrada</p>
      <button onClick={() => navigate('/feed')} className="text-[13px] font-semibold text-indigo-600 hover:underline">
        ← Volver al feed
      </button>
    </div>
  );

  const resenas = resenasData?.pages.flatMap((p) => p.data) ?? [];
  const allFotos = [
    ...(pub.imagen_url ? [{ id: -1, imagen_url: pub.imagen_url }] : []),
    ...pub.fotos.filter((f) => f.imagen_url !== pub.imagen_url),
  ];

  const profInitials = pub.profesional.usuario.nombre_completo
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  const fecha = (() => {
    try { return formatDistanceToNow(new Date(pub.fecha_creacion), { addSuffix: true, locale: es }); }
    catch { return ''; }
  })();

  const avgRating = pub.promedio_resenas ?? 0;
  const totalResenas = pub.total_resenas ?? 0;

  return (
    <>
      {lightboxOpen && allFotos.length > 0 && (
        <Lightbox fotos={allFotos} startAt={lightboxStart}
          onClose={() => setLightboxOpen(false)} />
      )}

      <div className="min-h-screen bg-[#F8F9FC] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 pb-12">

        {/* ── Cabecera de página ── */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:border-gray-300 transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline">Volver</span>
          </button>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-[13px] font-semibold hover:border-gray-300 transition-all shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Compartir'}
            </button>
            <button
              onClick={() => { if (!user) { navigate('/login'); return; } likeMutation.mutate(); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[13px] font-semibold transition-all shadow-sm ${
                liked
                  ? 'bg-red-50 border-red-200 text-red-500'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-400'
              }`}
            >
              <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
              {likesCount > 0 ? likesCount : 'Me gusta'}
            </button>
          </div>
        </div>

        {/* ── Layout principal: foto izquierda / info derecha ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-start">

          {/* Foto viewer */}
          <div className="lg:sticky lg:top-24">
            <PhotoViewer
              fotos={allFotos}
              active={activePhoto}
              onSelect={setActivePhoto}
              onOpenLightbox={(i) => { setLightboxStart(i); setLightboxOpen(true); }}
            />
          </div>

          {/* Info derecha */}
          <div className="space-y-5">

            {/* Categoría + título + rating */}
            <div>
              {pub.profesional.categoria?.nombre && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold mb-3">
                  <BadgeCheck className="w-3 h-3" />
                  {pub.profesional.categoria.nombre}
                </span>
              )}

              <h1 className="text-[24px] md:text-[28px] font-black text-gray-900 leading-tight mb-3">
                {pub.titulo}
              </h1>

              {/* Rating row */}
              <div className="flex items-center flex-wrap gap-3">
                {totalResenas > 0 ? (
                  <div className="flex items-center gap-2">
                    <Stars value={Math.round(avgRating)} size="sm" />
                    <span className="text-[14px] font-black text-gray-900">{avgRating.toFixed(1)}</span>
                    <span className="text-[13px] text-gray-400">
                      ({totalResenas} {totalResenas === 1 ? 'reseña' : 'reseñas'})
                    </span>
                  </div>
                ) : (
                  <span className="text-[13px] text-gray-400">Sin reseñas aún</span>
                )}
                {fecha && (
                  <span className="text-[12px] text-gray-300 font-medium">· {fecha}</span>
                )}
              </div>
            </div>

            {/* Divisor */}
            <div className="h-px bg-gray-100" />

            {/* Profesional */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Link to={`/profesionales/${pub.profesional.id}`} className="flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-indigo-50 shadow-sm">
                  {pub.profesional.foto_perfil_url ? (
                    <img src={pub.profesional.foto_perfil_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-violet-500 text-white font-black text-lg">
                      {profInitials}
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Publicado por</p>
                <Link
                  to={`/profesionales/${pub.profesional.id}`}
                  className="text-[14px] font-black text-gray-900 hover:text-indigo-700 transition-colors block truncate"
                >
                  {pub.profesional.usuario.nombre_completo}
                </Link>
                {pub.profesional.ciudad && (
                  <p className="flex items-center gap-1 text-[12px] text-gray-400 mt-0.5">
                    <MapPin className="w-3 h-3" /> {pub.profesional.ciudad}
                  </p>
                )}
              </div>
              <Link
                to={`/profesionales/${pub.profesional.id}`}
                className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-bold rounded-xl transition-colors"
              >
                Ver perfil
              </Link>
            </div>

            {/* Descripción (preview en el panel) */}
            {pub.descripcion && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción</p>
                <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-line">
                  {pub.descripcion}
                </p>
              </div>
            )}

            {/* CTA principal */}
            <Link
              to={`/profesionales/${pub.profesional.id}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-[15px] transition-all shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
            >
              Ver perfil completo
              <ChevronRight className="w-4 h-4" />
            </Link>

            {/* Detalles rápidos */}
            <div className="grid grid-cols-2 gap-3">
              {totalResenas > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-3.5 text-center shadow-sm">
                  <div className="text-[22px] font-black text-gray-900 leading-none mb-1">{avgRating.toFixed(1)}</div>
                  <div className="flex justify-center mb-1"><Stars value={Math.round(avgRating)} size="xs" /></div>
                  <p className="text-[11px] text-gray-400 font-medium">{totalResenas} reseñas</p>
                </div>
              )}
              {allFotos.length > 1 && (
                <button
                  onClick={() => { setLightboxStart(0); setLightboxOpen(true); }}
                  className="bg-white rounded-xl border border-gray-100 p-3.5 text-center shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                >
                  <div className="text-[22px] font-black text-gray-900 leading-none mb-1 group-hover:text-indigo-600 transition-colors">{allFotos.length}</div>
                  <p className="text-[11px] text-gray-400 font-medium">Fotos</p>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Reseñas (ancho completo abajo) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

          {/* Reseñas */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-[18px] font-black text-gray-900">Reseñas</h2>
                {totalResenas > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[12px] font-bold">
                    {totalResenas}
                  </span>
                )}
              </div>
              {avgRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-[16px] font-black text-gray-900">{avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Form */}
            {user && (
              <div className="px-6 py-5 bg-gray-50/60 border-b border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Tu valoración</p>
                <div className="flex items-center gap-3 mb-4">
                  <Stars value={rating} hover={hoverRating} onHover={setHoverRating} onSelect={setRating} size="lg" interactive />
                  {(hoverRating || rating) > 0 && (
                    <span className="text-[14px] font-bold text-amber-600">{RATING_LABELS[hoverRating || rating]}</span>
                  )}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comparte tu experiencia..."
                  rows={3}
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => reviewMutation.mutate()}
                    disabled={rating === 0 || reviewMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {reviewMutation.isPending ? 'Enviando...' : 'Publicar reseña'}
                  </button>
                </div>
              </div>
            )}

            {resenas.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                  <Star className="w-7 h-7 text-amber-300" />
                </div>
                <p className="text-[15px] font-bold text-gray-700 mb-1">Sin reseñas aún</p>
                <p className="text-[13px] text-gray-400">
                  {user ? '¡Sé el primero en opinar!' : 'Inicia sesión para dejar una reseña.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {resenas.map((resena) => {
                  const rInit = resena.cliente.nombre_completo
                    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
                  const rFecha = (() => {
                    try { return format(new Date(resena.fecha_creacion), "d 'de' MMMM, yyyy", { locale: es }); }
                    catch { return ''; }
                  })();
                  return (
                    <div key={resena.id} className="px-6 py-5 flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[12px] font-black text-indigo-600 flex-shrink-0">
                        {rInit}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">{resena.cliente.nombre_completo}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{rFecha}</p>
                          </div>
                          <Stars value={resena.puntuacion} size="xs" />
                        </div>
                        {resena.comentario && (
                          <p className="text-[14px] text-gray-600 leading-relaxed">{resena.comentario}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {hasNextPage && (
                  <div className="px-6 py-5 text-center">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {isFetchingNextPage ? 'Cargando...' : 'Ver más reseñas →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rating breakdown (lateral) */}
          {totalResenas > 0 && (
            <div className="self-start lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-5">
                  Calificación general
                </p>
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-[56px] font-black text-gray-900 leading-none">{avgRating.toFixed(1)}</span>
                  <div className="pb-1.5">
                    <Stars value={Math.round(avgRating)} size="md" />
                    <p className="text-[12px] text-gray-400 mt-1">
                      de {totalResenas} {totalResenas === 1 ? 'reseña' : 'reseñas'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const count = resenas.filter((r) => r.puntuacion === s).length;
                    const pct = resenas.length > 0 ? Math.round((count / resenas.length) * 100) : 0;
                    return (
                      <div key={s} className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 w-8 flex-shrink-0">
                          <span className="text-[12px] font-semibold text-gray-500">{s}</span>
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        </div>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-400 w-5 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
