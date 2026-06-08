import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, ShieldCheck, Globe, PenSquare, Save, X,
  Loader2, Mail, Phone, Heart, Star, Trash2, Edit3,
  Smartphone, Plus, CheckCircle2, Briefcase, User,
  ImagePlus, TrendingUp, Clock, Camera, LogOut,
  ChevronRight, Settings, LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../../store/auth';
import {
  fetchProfile, updateProfile, updateProfessionalProfile,
  fetchFcmTokens, deleteFcmToken,
} from '../../lib/perfil';
import { fetchPublicaciones, deletePublicacion } from '../../lib/publicaciones';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EditProfessionalModal from './EditProfessionalModal';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type Tab = 'perfil' | 'publicaciones' | 'configuracion';

// ── Sub-componentes ────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <h3 className="text-[14px] font-black text-gray-900">{title}</h3>
      {action}
    </div>
  );
}

function EmptySection({ icon: Icon, text, cta }: {
  icon: React.ElementType; text: string; cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-gray-300" />
      </div>
      <p className="text-[13px] font-semibold text-gray-500 mb-1">{text}</p>
      {cta}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('perfil');
  const [editBasic, setEditBasic] = useState(false);
  const [showProfModal, setShowProfModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['my-profile'],
    queryFn: fetchProfile,
    enabled: !!user,
  });

  const profId = profile?.profesional?.id;

  const { data: pubsData } = useQuery({
    queryKey: ['my-publications', profId],
    queryFn: () => fetchPublicaciones({ profesional_id: profId!, limit: 50 }),
    enabled: !!profId,
  });

  const { data: fcmTokens, refetch: refetchTokens } = useQuery({
    queryKey: ['my-fcm-tokens'],
    queryFn: fetchFcmTokens,
    enabled: !!user,
  });

  const basicMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-profile'] }); setEditBasic(false); },
  });

  const profMutation = useMutation({
    mutationFn: updateProfessionalProfile,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-profile'] }); setShowProfModal(false); },
  });

  const deletePubMutation = useMutation({
    mutationFn: deletePublicacion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-publications'] }),
  });

  const deleteTokenMutation = useMutation({
    mutationFn: deleteFcmToken,
    onSuccess: () => refetchTokens(),
  });

  if (!user) { navigate('/login', { replace: true }); return null; }
  if (isLoading) return <LoadingSpinner />;
  if (isError || !profile) return (
    <div className="flex flex-col items-center py-24 text-center gap-3">
      <p className="text-[16px] font-bold text-red-500">Error al cargar el perfil</p>
    </div>
  );

  const isProf = profile.rol === 'profesional';
  const prof = profile.profesional;
  const publicaciones = pubsData?.data ?? [];

  const initials = profile.nombre_completo
    .split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  const totalLikes   = publicaciones.reduce((a, p) => a + (p.likes_count ?? 0), 0);
  const totalResenas = publicaciones.reduce((a, p) => a + (p.total_resenas ?? 0), 0);
  const avgRating    = totalResenas > 0
    ? publicaciones.reduce((a, p) => a + (p.promedio_resenas ?? 0), 0) / publicaciones.filter((p) => (p.total_resenas ?? 0) > 0).length
    : 0;

  const isVerified = prof?.verificacion?.estado === 'aprobado' || prof?.verificacion?.estado === 'aproado';

  const TABS: { key: Tab; label: string; icon: React.ElementType; show: boolean }[] = [
    { key: 'perfil',         label: 'Perfil',         icon: User,        show: true },
    { key: 'publicaciones',  label: 'Publicaciones',  icon: LayoutGrid,  show: isProf },
    { key: 'configuracion',  label: 'Configuración',  icon: Settings,    show: true },
  ];

  return (
    <>
      {/* ── HEADER CARD ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">

        {/* Banner */}
        <div className="relative h-44 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 overflow-hidden">
          {/* Decoración */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 15% 85%, rgba(255,255,255,0.12) 1px, transparent 1px), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-violet-500/30 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-indigo-400/20 blur-2xl" />

          {/* Botón editar banner (futuro) */}
          <div className="absolute top-4 right-4">
            <button
              onClick={() => { setNombre(profile.nombre_completo); setEmail(profile.email); setTelefono(profile.telefono ?? ''); setEditBasic(true); setTab('configuracion'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[12px] font-semibold transition-all"
            >
              <PenSquare className="w-3.5 h-3.5" />
              Editar perfil
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar solo — sube para solapar el banner */}
          <div className="relative inline-block -mt-12 mb-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg">
              {prof?.foto_perfil_url ? (
                <img src={prof.foto_perfil_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-violet-600 text-white font-black text-2xl">
                  {initials}
                </div>
              )}
            </div>
            {isVerified && (
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-green-500 ring-2 ring-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Nombre y subtítulo — en posición normal, debajo del avatar */}
          <div className="mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[22px] font-black text-gray-900 leading-tight">
                {profile.nombre_completo}
              </h1>
              {isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[11px] font-bold border border-green-100">
                  <CheckCircle2 className="w-3 h-3" /> Verificado
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold capitalize">
                {profile.rol}
              </span>
              {prof?.categoria?.nombre && (
                <span className="text-[13px] font-semibold text-gray-600">{prof.categoria.nombre}</span>
              )}
              {prof?.ciudad && (
                <span className="flex items-center gap-1 text-[12px] text-gray-400">
                  <MapPin className="w-3 h-3" /> {prof.ciudad}
                </span>
              )}
            </div>
          </div>

          {/* Descripción corta */}
          {prof?.descripcion_perfil && (
            <p className="text-[14px] text-gray-500 leading-relaxed mb-5 max-w-2xl">
              {prof.descripcion_perfil}
            </p>
          )}

          {/* Stats */}
          {isProf && (
            <div className="flex items-center gap-6 flex-wrap pt-4 border-t border-gray-100">
              <Stat value={publicaciones.length} label="Publicaciones" icon={ImagePlus} />
              <div className="w-px h-8 bg-gray-100" />
              <Stat value={totalLikes} label="Me gusta" icon={Heart} color="text-red-400" />
              <div className="w-px h-8 bg-gray-100" />
              <Stat value={totalResenas} label="Reseñas" icon={Star} color="text-amber-400" />
              {avgRating > 0 && (
                <>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-[18px] font-black text-gray-900">{avgRating.toFixed(1)}</span>
                    <span className="text-[12px] text-gray-400 font-medium">promedio</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── TABS ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5 mb-6">
        {TABS.filter((t) => t.show).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all duration-150 ${
              tab === key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: PERFIL ──────────────────────────────────── */}
      {tab === 'perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* Columna principal */}
          <div className="space-y-5">

            {/* Perfil profesional */}
            {isProf && prof && (
              <Card>
                <CardHeader
                  title="Perfil profesional"
                  action={
                    <button onClick={() => setShowProfModal(true)}
                      className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                      <PenSquare className="w-3.5 h-3.5" /> Editar
                    </button>
                  }
                />
                <div className="p-5">
                  {prof.descripcion_perfil ? (
                    <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">
                      {prof.descripcion_perfil}
                    </p>
                  ) : (
                    <EmptySection icon={User} text="Agrega una descripción de tu perfil profesional."
                      cta={<button onClick={() => setShowProfModal(true)} className="text-[12px] font-bold text-indigo-600 mt-2 hover:underline">+ Agregar descripción</button>}
                    />
                  )}
                </div>
              </Card>
            )}

            {/* Servicios */}
            {isProf && prof && (
              <Card>
                <CardHeader
                  title={`Servicios${prof.servicios.length > 0 ? ` (${prof.servicios.length})` : ''}`}
                  action={
                    <button onClick={() => setShowProfModal(true)}
                      className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  }
                />
                <div className="p-4">
                  {prof.servicios.length === 0 ? (
                    <EmptySection icon={Briefcase} text="No has agregado servicios aún." />
                  ) : (
                    <div className="space-y-3">
                      {prof.servicios.map((s) => (
                        <div key={s.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                              <p className="text-[14px] font-bold text-gray-900">{s.nombre}</p>
                            </div>
                            {s.descripcion && (
                              <p className="text-[12px] text-gray-500 leading-relaxed ml-4">{s.descripcion}</p>
                            )}
                            {s.duracion_estimada_min && (
                              <p className="text-[11px] text-gray-400 mt-1.5 ml-4 flex items-center gap-1">
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
                  )}
                </div>
              </Card>
            )}

            {/* Promociones */}
            {isProf && (
              <Card>
                <div className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-black text-gray-900 mb-0.5">Promociona tu perfil</p>
                    <p className="text-[12px] text-gray-400 leading-relaxed">
                      Destaca entre los primeros resultados y llega a más clientes.
                    </p>
                  </div>
                  <Link
                    to="/promociones/crear"
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl transition-colors"
                  >
                    Crear <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {/* Columna lateral */}
          <div className="space-y-5">

            {/* Contacto */}
            <Card>
              <CardHeader title="Contacto" />
              <div className="p-4 space-y-2">
                {profile.email && (
                  <ContactRow icon={Mail} value={profile.email} />
                )}
                {profile.telefono && (
                  <ContactRow icon={Phone} value={profile.telefono} />
                )}
                {!profile.email && !profile.telefono && (
                  <p className="text-[13px] text-gray-400 text-center py-2">Sin datos de contacto</p>
                )}
              </div>
            </Card>

            {/* Horarios */}
            {isProf && prof && prof.horariosAtencion.filter((h) => h.activo).length > 0 && (
              <Card>
                <CardHeader title="Horarios de atención" />
                <div className="p-4 space-y-1.5">
                  {prof.horariosAtencion
                    .filter((h) => h.activo)
                    .sort((a, b) => a.dia_semana - b.dia_semana)
                    .map((h) => (
                      <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-[13px] font-bold text-gray-700 w-8">{DIAS[h.dia_semana]}</span>
                        <span className="text-[13px] text-gray-500 font-medium">
                          {h.hora_apertura.slice(0, 5)} – {h.hora_cierre.slice(0, 5)}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Ubicaciones */}
            {isProf && prof && prof.ubicaciones.length > 0 && (
              <Card>
                <CardHeader title="Ubicaciones" />
                <div className="p-4 space-y-3">
                  {prof.ubicaciones.map((u) => (
                    <div key={u.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{u.direccion}</p>
                        <p className="text-[12px] text-gray-400">{u.ciudad}, {u.pais}</p>
                        {u.es_principal && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">
                            Principal
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Enlaces */}
            {isProf && prof && prof.enlacesProfesionales.length > 0 && (
              <Card>
                <CardHeader title="Enlaces" />
                <div className="p-4 flex flex-wrap gap-2">
                  {prof.enlacesProfesionales.map((e) => (
                    <a key={e.id} href={e.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 text-[12px] font-semibold rounded-xl border border-gray-100 hover:border-indigo-100 transition-all">
                      <Globe className="w-3.5 h-3.5" />
                      {e.plataforma}
                    </a>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: PUBLICACIONES ───────────────────────────── */}
      {tab === 'publicaciones' && isProf && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[18px] font-black text-gray-900">Mis publicaciones</h2>
              <p className="text-[13px] text-gray-400 mt-0.5">
                {publicaciones.length === 0
                  ? 'Aún no tienes publicaciones'
                  : `${publicaciones.length} publicacione${publicaciones.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <Link
              to="/publicaciones/crear"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Nueva publicación
            </Link>
          </div>

          {publicaciones.length === 0 ? (
            <Card>
              <EmptySection
                icon={Camera}
                text="Muestra tu trabajo a miles de clientes potenciales."
                cta={
                  <Link to="/publicaciones/crear"
                    className="inline-flex items-center gap-1.5 mt-3 px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" /> Crear primera publicación
                  </Link>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {publicaciones.map((p) => (
                <div key={p.id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  {/* Imagen */}
                  <Link to={`/publicaciones/${p.id}`} className="block">
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      {p.imagen_url ? (
                        <img src={p.imagen_url} alt={p.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImagePlus className="w-8 h-8 text-gray-200" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-3">
                    <Link to={`/publicaciones/${p.id}`}>
                      <p className="text-[12px] font-bold text-gray-900 truncate mb-1.5">{p.titulo}</p>
                    </Link>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {p.likes_count > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Heart className="w-3 h-3 text-red-400" /> {p.likes_count}
                          </span>
                        )}
                        {(p.total_resenas ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-500">
                            <Star className="w-3 h-3 fill-current" /> {(p.promedio_resenas ?? 0).toFixed(1)}
                          </span>
                        )}
                      </div>
                      {/* Acciones */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/publicaciones/${p.id}/editar`)}
                          className="w-6 h-6 rounded-lg bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => { if (confirm('¿Eliminar esta publicación?')) deletePubMutation.mutate(p.id); }}
                          disabled={deletePubMutation.isPending}
                          className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CONFIGURACIÓN ───────────────────────────── */}
      {tab === 'configuracion' && (
        <div className="space-y-5 max-w-2xl">

          {/* Editar datos básicos */}
          <Card>
            <CardHeader
              title="Información personal"
              action={
                !editBasic ? (
                  <button
                    onClick={() => { setNombre(profile.nombre_completo); setEmail(profile.email); setTelefono(profile.telefono ?? ''); setEditBasic(true); }}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <PenSquare className="w-3.5 h-3.5" /> Editar
                  </button>
                ) : (
                  <button onClick={() => setEditBasic(false)}
                    className="flex items-center gap-1 text-[12px] font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                )
              }
            />
            {editBasic ? (
              <form
                onSubmit={(e) => { e.preventDefault(); basicMutation.mutate({ nombre_completo: nombre, email, telefono }); }}
                className="p-5 space-y-4"
              >
                {[
                  { label: 'Nombre completo', val: nombre, set: setNombre, type: 'text' },
                  { label: 'Email', val: email, set: setEmail, type: 'email' },
                  { label: 'Teléfono', val: telefono, set: setTelefono, type: 'tel' },
                ].map(({ label, val, set, type }) => (
                  <div key={label}>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">{label}</label>
                    <input type={type} value={val} onChange={(e) => set(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-[14px] text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all" />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={basicMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    {basicMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar cambios
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 space-y-1">
                <ContactRow icon={User} value={profile.nombre_completo} />
                <ContactRow icon={Mail} value={profile.email} />
                {profile.telefono && <ContactRow icon={Phone} value={profile.telefono} />}
              </div>
            )}
          </Card>

          {/* Perfil profesional */}
          {isProf && (
            <Card>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">Perfil profesional</p>
                    <p className="text-[12px] text-gray-400">Servicios, horarios, ubicaciones y más</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[13px] font-bold rounded-xl transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>
              </div>
            </Card>
          )}

          {/* Mis promociones */}
          {isProf && (
            <Card>
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">Mis promociones</p>
                    <p className="text-[12px] text-gray-400">Gestiona tus campañas activas</p>
                  </div>
                </div>
                <Link to="/promociones"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[13px] font-bold rounded-xl transition-colors">
                  Ver <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          )}

          {/* Dispositivos */}
          <Card>
            <CardHeader title="Dispositivos registrados" />
            <div className="p-4">
              {!fcmTokens || fcmTokens.length === 0 ? (
                <EmptySection icon={Smartphone} text="No hay dispositivos registrados." />
              ) : (
                <div className="space-y-2">
                  {fcmTokens.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-gray-800 capitalize">{t.plataforma}</p>
                          <p className="text-[11px] text-gray-400">
                            Último uso: {new Date(t.ultimo_uso).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { if (confirm('¿Eliminar este dispositivo?')) deleteTokenMutation.mutate(t.id); }}
                        disabled={deleteTokenMutation.isPending}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Cerrar sesión */}
          <button
            onClick={() => { logout(); navigate('/feed'); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-100 text-red-500 text-[14px] font-bold hover:bg-red-50 hover:border-red-200 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}

      {/* Modal edición profesional */}
      {showProfModal && prof && (
        <EditProfessionalModal
          initial={{
            foto_perfil_url: prof.foto_perfil_url,
            descripcion_perfil: prof.descripcion_perfil,
            servicios: prof.servicios,
            horariosAtencion: prof.horariosAtencion,
            ubicaciones: prof.ubicaciones,
            enlacesProfesionales: prof.enlacesProfesionales,
          }}
          onSave={(data) => {
            profMutation.mutate({
              foto_perfil_url: data.foto_perfil_url || undefined,
              descripcion_perfil: data.descripcion_perfil || undefined,
              servicios: data.servicios.length > 0 ? data.servicios.map((s) => ({
                nombre: s.nombre,
                descripcion: s.descripcion || undefined,
                duracion_estimada_min: s.duracion_estimada_min ? Number(s.duracion_estimada_min) : undefined,
                precios: (s.precio_min || s.precio_max) ? [{
                  precio_min: Number(s.precio_min) || 0,
                  precio_max: s.precio_max ? Number(s.precio_max) : undefined,
                }] : undefined,
              })) : undefined,
              horarios: data.horarios.length > 0 ? data.horarios.map((h) => ({
                dia_semana: h.dia_semana,
                hora_apertura: h.hora_apertura,
                hora_cierre: h.hora_cierre,
                activo: h.activo,
              })) : undefined,
              ubicaciones: data.ubicaciones.length > 0 ? data.ubicaciones.map((u) => ({
                direccion: u.direccion,
                ciudad: u.ciudad,
                pais: u.pais || 'Colombia',
                es_principal: u.es_principal,
                latitud: u.latitud ? Number(u.latitud) : undefined,
                longitud: u.longitud ? Number(u.longitud) : undefined,
                visible_en_mapa: u.visible_en_mapa,
              })) : undefined,
              enlaces: data.enlaces.length > 0 ? data.enlaces.map((e) => ({
                plataforma: e.plataforma,
                url: e.url,
              })) : undefined,
            });
          }}
          onClose={() => setShowProfModal(false)}
          isPending={profMutation.isPending}
        />
      )}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Stat({ value, label, icon: Icon, color = 'text-indigo-600' }: {
  value: number; label: string; icon: React.ElementType; color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <span className="text-[20px] font-black text-gray-900 leading-none">{value}</span>
        <span className="text-[12px] text-gray-400 font-medium ml-1.5">{label}</span>
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <span className="text-[13px] text-gray-700 font-medium">{value}</span>
    </div>
  );
}
