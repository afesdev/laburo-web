import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Star, ShieldCheck, Clock,
  Globe, MessageCircle, Phone, Mail, Lock, Heart,
  CheckCircle2, Briefcase, ChevronRight, ImagePlus,
  Zap,
} from 'lucide-react';
import { fetchProfesional, fetchPromedioResenas } from '../../lib/profesionales';
import { fetchFavoritos, addFavorito, removeFavorito } from '../../lib/favoritos';
import { useAuth } from '../../store/auth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function Stars({ value, size = 'sm' }: { value: number; size?: 'xs' | 'sm' | 'md' }) {
  const sz = { md: 'w-5 h-5', sm: 'w-4 h-4', xs: 'w-3.5 h-3.5' }[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sz} ${s <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

export default function ProfesionalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profesionalId = Number(id);
  const [isFav, setIsFav] = useState(false);

  const { data: prof, isLoading, isError } = useQuery({
    queryKey: ['profesional', profesionalId],
    queryFn: () => fetchProfesional(profesionalId),
    enabled: !isNaN(profesionalId),
  });

  const { data: rating } = useQuery({
    queryKey: ['promedio-resenas', profesionalId],
    queryFn: () => fetchPromedioResenas(profesionalId),
    enabled: !isNaN(profesionalId),
  });

  const { data: favData } = useQuery({
    queryKey: ['favoritos', user?.id],
    queryFn: () => (user ? fetchFavoritos(user.id, 1, 100) : null),
    enabled: !!user,
  });

  useEffect(() => {
    if (favData) setIsFav(favData.data.some((f) => f.profesional.id === profesionalId));
  }, [favData, profesionalId]);

  const favMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      isFav ? await removeFavorito(user.id, profesionalId) : await addFavorito(user.id, profesionalId);
    },
    onSuccess: () => {
      setIsFav((v) => !v);
      queryClient.invalidateQueries({ queryKey: ['favoritos', user?.id] });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !prof) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
        <Briefcase className="w-8 h-8 text-indigo-300" />
      </div>
      <p className="font-black text-gray-700 text-[18px]">Profesional no encontrado</p>
      <button onClick={() => navigate('/feed')} className="text-[13px] font-semibold text-indigo-600 hover:underline">
        ← Volver al feed
      </button>
    </div>
  );

  const verified = prof.verificacion?.estado === 'aprobado' || prof.verificacion?.estado === 'aproado';
  const horarios = prof.horariosAtencion.filter((h) => h.activo).sort((a, b) => a.dia_semana - b.dia_semana);
  const avgRating = rating ? Number(rating.promedio) : 0;
  const totalResenas = rating ? Number(rating.total) : 0;

  const initials = prof.usuario.nombre_completo
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  const telLimpio = prof.usuario.telefono?.replace(/[^0-9]/g, '') ?? '';

  return (
    <div className="min-h-screen bg-[#F8F9FC] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-12">

      {/* ── Botón volver ── */}
      <div className="pt-4 mb-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:border-gray-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline">Volver</span>
        </button>
      </div>

      {/* ── HERO CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-4 mb-6">

        {/* Banner */}
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700">
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-violet-500/30 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 w-40 h-40 rounded-full bg-indigo-300/20 blur-2xl" />

          {/* Acción: favorito (top-right sobre el banner) */}
          <div className="absolute top-4 right-4">
            {user ? (
              <button
                onClick={() => favMutation.mutate()}
                disabled={favMutation.isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm text-[12px] font-bold transition-all ${
                  isFav
                    ? 'bg-red-500/80 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                {isFav ? 'Guardado' : 'Guardar'}
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[12px] font-bold transition-all"
              >
                <Heart className="w-3.5 h-3.5" /> Guardar
              </Link>
            )}
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar — solo él sube sobre el banner */}
          <div className="relative inline-block -mt-12 mb-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg">
              {prof.foto_perfil_url ? (
                <img src={prof.foto_perfil_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-violet-600 text-white font-black text-2xl">
                  {initials}
                </div>
              )}
            </div>
            {verified && (
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-green-500 ring-2 ring-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Nombre + badges */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h1 className="text-[22px] font-black text-gray-900 leading-tight">
                {prof.usuario.nombre_completo}
              </h1>
              {verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[11px] font-bold border border-green-100">
                  <CheckCircle2 className="w-3 h-3" /> Verificado
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[12px] font-bold">
                {prof.categoria.nombre}
              </span>
              {prof.ciudad && (
                <span className="flex items-center gap-1 text-[13px] text-gray-400">
                  <MapPin className="w-3.5 h-3.5" /> {prof.ciudad}
                </span>
              )}
            </div>
          </div>

          {/* Descripción */}
          {prof.descripcion_perfil && (
            <p className="text-[14px] text-gray-500 leading-relaxed mb-5 max-w-2xl">
              {prof.descripcion_perfil}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-5 flex-wrap pt-4 border-t border-gray-100">
            {totalResenas > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-[20px] font-black text-gray-900 leading-none">{avgRating.toFixed(1)}</span>
                  <span className="text-[12px] text-gray-400 font-medium">({totalResenas} reseñas)</span>
                </div>
                <div className="w-px h-6 bg-gray-100" />
              </>
            )}
            {prof.publicaciones.length > 0 && (
              <div className="flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-indigo-400" />
                <span className="text-[20px] font-black text-gray-900 leading-none">{prof.publicaciones.length}</span>
                <span className="text-[12px] text-gray-400 font-medium">publicaciones</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── LAYOUT DOS COLUMNAS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* ── COLUMNA PRINCIPAL ── */}
        <div className="space-y-5">

          {/* Publicaciones */}
          {prof.publicaciones.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-[15px] font-black text-gray-900">Trabajos publicados</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[12px] font-bold">
                  {prof.publicaciones.length}
                </span>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {prof.publicaciones.slice(0, 6).map((p) => (
                  <Link
                    key={p.id}
                    to={`/publicaciones/${p.id}`}
                    className="group relative aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                  >
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImagePlus className="w-7 h-7 text-gray-200" />
                      </div>
                    )}
                    {/* Overlay con título */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                      <p className="text-white text-[11px] font-bold truncate">{p.titulo}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Servicios */}
          {prof.servicios.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-[15px] font-black text-gray-900">Servicios</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[12px] font-bold">
                  {prof.servicios.length}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {prof.servicios.map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        <p className="text-[14px] font-bold text-gray-900">{s.nombre}</p>
                      </div>
                      {s.descripcion && (
                        <p className="text-[12px] text-gray-500 leading-relaxed ml-4">{s.descripcion}</p>
                      )}
                      {s.duracion_estimada_min && (
                        <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-1.5 ml-4">
                          <Clock className="w-3 h-3" /> ~{s.duracion_estimada_min} min
                        </p>
                      )}
                    </div>
                    {s.preciosReferenciales.length > 0 && (
                      <div className="text-right flex-shrink-0">
                        {s.preciosReferenciales.map((p) => (
                          <p key={p.id} className="text-[14px] font-black text-indigo-700">
                            ${Number(p.precio_min).toLocaleString('es-CO')}
                            {p.precio_max ? ` – $${Number(p.precio_max).toLocaleString('es-CO')}` : ''}
                          </p>
                        ))}
                        <p className="text-[10px] text-gray-400 mt-0.5">COP</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reseñas */}
          {prof.resenas.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[15px] font-black text-gray-900">Reseñas</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[12px] font-bold">
                    {totalResenas}
                  </span>
                </div>
                {avgRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-[16px] font-black text-gray-900">{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {prof.resenas.map((r) => {
                  const rInit = (r.cliente?.nombre_completo ?? `U${r.cliente_id}`)
                    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
                  return (
                    <div key={r.id} className="px-5 py-4 flex gap-3.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-[12px] font-black text-indigo-600 flex-shrink-0">
                        {rInit}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <p className="text-[13px] font-bold text-gray-900 truncate">
                            {r.cliente?.nombre_completo ?? `Usuario #${r.cliente_id}`}
                          </p>
                          <Stars value={r.puntuacion} size="xs" />
                        </div>
                        {r.comentario && (
                          <p className="text-[13px] text-gray-600 leading-relaxed">{r.comentario}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── COLUMNA LATERAL ── */}
        <div className="space-y-5 lg:sticky lg:top-24 self-start">

          {/* Contacto */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-[15px] font-black text-gray-900">Contactar</h2>
            </div>

            {user ? (
              <div className="p-4 space-y-2.5">
                {prof.usuario.telefono && (
                  <a
                    href={`tel:${prof.usuario.telefono}`}
                    className="flex items-center gap-3 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-[14px] rounded-xl transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Llamar</span>
                    <span className="ml-auto text-green-200 text-[12px] font-normal">{prof.usuario.telefono}</span>
                  </a>
                )}
                {telLimpio && (
                  <a
                    href={`https://wa.me/57${telLimpio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full px-4 py-3 bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-[14px] rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </a>
                )}
                {prof.usuario.email && (
                  <a
                    href={`mailto:${prof.usuario.email}`}
                    className="flex items-center gap-3 w-full px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[14px] rounded-xl transition-colors border border-indigo-100"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{prof.usuario.email}</span>
                  </a>
                )}
                {prof.enlacesProfesionales.map((e) => (
                  <a
                    key={e.id}
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-[13px] rounded-xl transition-colors border border-gray-100"
                  >
                    <Globe className="w-4 h-4 text-gray-400" />
                    {e.plataforma}
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-300" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-[14px] font-bold text-gray-700 mb-1">Contacto privado</p>
                <p className="text-[12px] text-gray-400 mb-4 leading-relaxed">
                  Inicia sesión para ver el teléfono, WhatsApp y correo del profesional.
                </p>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl transition-colors"
                >
                  Iniciar sesión <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Horarios */}
          {horarios.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h2 className="text-[15px] font-black text-gray-900">Horarios</h2>
              </div>
              <div className="px-5 py-3 divide-y divide-gray-50">
                {horarios.map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-2.5">
                    <span className="text-[13px] font-bold text-gray-700 w-10">{DIAS[h.dia_semana]}</span>
                    <span className="text-[13px] text-gray-500 font-medium">
                      {h.hora_apertura.slice(0, 5)} – {h.hora_cierre.slice(0, 5)}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ubicaciones */}
          {prof.ubicaciones.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <h2 className="text-[15px] font-black text-gray-900">Ubicaciones</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {prof.ubicaciones.map((u) => (
                  <div key={u.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{u.direccion}</p>
                      <p className="text-[12px] text-gray-400">{u.ciudad}{u.estado ? `, ${u.estado}` : ''}</p>
                      {u.es_principal && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Promover (si no está logueado o es cliente) */}
          {(!user || user.rol === 'cliente') && (
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-[13px] font-black text-gray-900 mb-1">¿Eres profesional?</p>
              <p className="text-[12px] text-gray-500 mb-3 leading-relaxed">
                Crea tu perfil y llega a más clientes.
              </p>
              <Link
                to={user ? '/perfil' : '/register'}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-[12px] font-bold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                {user ? 'Ver mi perfil' : 'Registrarme'} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
