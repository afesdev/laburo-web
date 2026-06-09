import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search as SearchIcon, X, MapPin, Star, Heart,
  Users, FileText, Droplets, Hammer, Zap, Palette,
  Leaf, Car, Lock, Scale, Calculator, HardHat, Wind, Scissors, ChefHat, Tv2,
  Wrench, ChevronRight, Stethoscope, ShieldCheck, SlidersHorizontal, CheckCircle2,
} from 'lucide-react';
import { searchProfesionales } from '../../lib/profesionales';
import { fetchPublicaciones } from '../../lib/publicaciones';
import { fetchCategorias } from '../../lib/categorias';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/* ─── Config de categorías ─── */
const CAT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; light: string }> = {
  'Plomero / Fontanero':                        { icon: Droplets,    color: '#0EA5E9', bg: 'bg-sky-500',     light: 'bg-sky-50 text-sky-700 border-sky-100' },
  'Carpintero':                                 { icon: Hammer,      color: '#D97706', bg: 'bg-amber-500',   light: 'bg-amber-50 text-amber-700 border-amber-100' },
  'Electricista':                               { icon: Zap,         color: '#EAB308', bg: 'bg-yellow-400',  light: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  'Pintor':                                     { icon: Palette,     color: '#EC4899', bg: 'bg-pink-500',    light: 'bg-pink-50 text-pink-700 border-pink-100' },
  'Médico General':                             { icon: Stethoscope, color: '#EF4444', bg: 'bg-red-500',     light: 'bg-red-50 text-red-700 border-red-100' },
  'Mecánico Automotriz':                        { icon: Car,         color: '#6B7280', bg: 'bg-gray-500',    light: 'bg-gray-100 text-gray-700 border-gray-200' },
  'Cerrajero':                                  { icon: Lock,        color: '#71717A', bg: 'bg-zinc-500',    light: 'bg-zinc-50 text-zinc-700 border-zinc-200' },
  'Jardinero / Paisajista':                     { icon: Leaf,        color: '#22C55E', bg: 'bg-green-500',   light: 'bg-green-50 text-green-700 border-green-100' },
  'Abogado':                                    { icon: Scale,       color: '#4F46E5', bg: 'bg-indigo-500',  light: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  'Contador / Fiscalista':                      { icon: Calculator,  color: '#0D9488', bg: 'bg-teal-500',    light: 'bg-teal-50 text-teal-700 border-teal-100' },
  'Arquitecto':                                 { icon: HardHat,     color: '#F97316', bg: 'bg-orange-500',  light: 'bg-orange-50 text-orange-700 border-orange-100' },
  'Técnico en Refrigeración':                   { icon: Wind,        color: '#06B6D4', bg: 'bg-cyan-500',    light: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  'Barbero / Estilista':                        { icon: Scissors,    color: '#A855F7', bg: 'bg-purple-500',  light: 'bg-purple-50 text-purple-700 border-purple-100' },
  'Chef / Cocinero Particular':                 { icon: ChefHat,     color: '#F59E0B', bg: 'bg-amber-400',   light: 'bg-amber-50 text-amber-700 border-amber-100' },
  'Técnico en Reparación de Electrodomésticos': { icon: Tv2,         color: '#3B82F6', bg: 'bg-blue-500',    light: 'bg-blue-50 text-blue-700 border-blue-100' },
};
const DEFAULT_CAT = { icon: Wrench, color: '#6366F1', bg: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
const getCat = (nombre: string) => CAT_CONFIG[nombre] ?? DEFAULT_CAT;

const SUGERENCIAS = ['Plomero / Fontanero', 'Electricista', 'Carpintero', 'Pintor', 'Jardinero / Paisajista', 'Mecánico Automotriz'];

type Tab = 'profesionales' | 'publicaciones';

export default function Buscar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery]         = useState(searchParams.get('q') ?? searchParams.get('categoria') ?? '');
  const [debounced, setDebounced] = useState(query);
  const [tab, setTab]             = useState<Tab>('publicaciones');
  const [showFilters, setShowFilters] = useState(false);
  const [filterVerif, setFilterVerif] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleClear = () => { setQuery(''); setSearchParams({}); inputRef.current?.focus(); };

  /* ─── Queries ─── */
  const { data: categorias, isLoading: loadingCats } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => fetchCategorias(),
    enabled: !debounced,
  });

  const { data: profResults, isLoading: loadingProf } = useQuery({
    queryKey: ['search-prof', debounced],
    queryFn: () => searchProfesionales({ q: debounced, limit: 30 }),
    enabled: debounced.length > 0 && tab === 'profesionales',
  });

  const { data: pubResults, isLoading: loadingPub } = useQuery({
    queryKey: ['search-pub', debounced],
    queryFn: () => fetchPublicaciones({ q: debounced, limit: 30 }),
    enabled: debounced.length > 0 && tab === 'publicaciones',
  });

  let profesionales = profResults?.data ?? [];
  if (filterVerif) profesionales = profesionales.filter(
    (p) => p.verificacion?.estado === 'aprobado' || p.verificacion?.estado === 'aproado',
  );
  if (filterRating) profesionales = profesionales.filter(
    (p) => (p.promedio_resenas ?? 0) >= filterRating!,
  );

  const publicaciones  = pubResults?.data ?? [];
  const profTotal      = profResults?.meta?.total ?? profResults?.data?.length ?? 0;
  const pubTotal       = pubResults?.meta?.total  ?? pubResults?.data?.length  ?? 0;

  const filtersActive = filterVerif || filterRating !== null;

  const pageTitle = debounced
    ? `"${debounced}" — Buscar en Laburo`
    : 'Buscar profesionales y publicaciones — Laburo';
  const pageDesc = debounced
    ? `Resultados de búsqueda para "${debounced}". Profesionales verificados y publicaciones en Laburo.`
    : 'Busca plomeros, electricistas, pintores y más profesionales verificados. Compara precios y contrata fácil en Laburo.';

  return (
    <div className="pb-12">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="robots" content={debounced ? 'noindex, follow' : 'index, follow'} />
        <link rel="canonical" href="https://www.laburo.click/search" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content="https://www.laburo.click/search" />
      </Helmet>

      {/* ── HERO ── */}
      <div className="pt-8 pb-6 mb-6">
        <div className="max-w-2xl">
          <h1 className="text-[26px] sm:text-[32px] font-black text-gray-900 leading-tight mb-1">
            Encuentra el profesional<br />
            <span className="text-indigo-600">que necesitas</span>
          </h1>
          <p className="text-[14px] text-gray-400 mb-5">Busca por nombre, oficio o ciudad.</p>

          {/* Barra de búsqueda */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: Plomero en Bogotá..."
                className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Filtros btn — solo con resultados */}
            {debounced && tab === 'profesionales' && (
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-1.5 px-4 py-4 rounded-2xl border font-semibold text-[13px] transition-all shadow-sm ${
                  filtersActive || showFilters
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
                {filtersActive && (
                  <span className="w-2 h-2 rounded-full bg-white/80" />
                )}
              </button>
            )}
          </div>

          {/* Chips de sugerencia — si no hay query */}
          {!query && (
            <div className="flex flex-wrap gap-2 mt-4">
              {SUGERENCIAS.map((s) => {
                const cfg  = getCat(s);
                const Icon = cfg.icon;
                return (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[12px] font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all shadow-sm"
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {debounced ? (
        <div className="space-y-4">

          {/* ── Tabs ── */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
              {(['profesionales', 'publicaciones'] as Tab[]).map((t) => {
                const count  = t === 'profesionales' ? profTotal : pubTotal;
                const active = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                      active ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'profesionales' ? <Users className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    {t === 'profesionales' ? 'Profesionales' : 'Publicaciones'}
                    {count > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filtros rápidos inline */}
            {showFilters && tab === 'profesionales' && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Verificado */}
                <button
                  onClick={() => setFilterVerif((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-bold transition-all ${
                    filterVerif
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verificado
                  {filterVerif && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                </button>

                {/* Rating mínimo */}
                {[4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRating(filterRating === r ? null : r)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-bold transition-all ${
                      filterRating === r
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${filterRating === r ? 'fill-amber-400 text-amber-400' : ''}`} />
                    {r}+ estrellas
                  </button>
                ))}

                {filtersActive && (
                  <button
                    onClick={() => { setFilterVerif(false); setFilterRating(null); }}
                    className="text-[12px] font-semibold text-red-400 hover:text-red-600 transition-colors px-2 py-2"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Resultados profesionales ── */}
          {tab === 'profesionales' && (
            loadingProf ? <LoadingSpinner /> :
            profesionales.length === 0 ? (
              <EmptyState
                icon={<Users className="w-8 h-8 text-gray-300" />}
                title="Sin resultados"
                desc="Intenta con otro término o explora por categoría"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profesionales.map((p) => {
                  const cat      = getCat(p.categoria.nombre);
                  const CatIcon  = cat.icon;
                  const initials = p.usuario.nombre_completo
                    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
                  const avg      = p.promedio_resenas ?? 0;
                  const verified = p.verificacion?.estado === 'aprobado' || p.verificacion?.estado === 'aproado';

                  return (
                    <Link
                      key={p.id}
                      to={`/profesionales/${p.id}`}
                      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {/* Franja de color superior */}
                      <div className="h-1.5 w-full" style={{ backgroundColor: cat.color }} />

                      <div className="p-4">
                        {/* Cabecera */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-100">
                              {p.foto_perfil_url ? (
                                <img src={p.foto_perfil_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center text-white text-[16px] font-black"
                                  style={{ background: `linear-gradient(135deg, ${cat.color}99, ${cat.color})` }}
                                >
                                  {initials}
                                </div>
                              )}
                            </div>
                            <div
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white"
                              style={{ backgroundColor: cat.color }}
                            >
                              <CatIcon className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-black text-[14px] text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                                {p.usuario.nombre_completo}
                              </p>
                              {verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                            {p.ciudad && (
                              <p className="flex items-center gap-1 text-[12px] text-gray-400 mt-0.5">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                {p.ciudad}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                            style={{ backgroundColor: `${cat.color}12`, color: cat.color, borderColor: `${cat.color}25` }}
                          >
                            <CatIcon className="w-3 h-3" />
                            {p.categoria.nombre.length > 18 ? p.categoria.nombre.split('/')[0].trim() : p.categoria.nombre}
                          </span>

                          {avg > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="text-[13px] font-black text-gray-900">{avg.toFixed(1)}</span>
                              <span className="text-[11px] text-gray-400">({p.total_resenas ?? 0})</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-300 font-medium">Sin reseñas</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}

          {/* ── Resultados publicaciones ── */}
          {tab === 'publicaciones' && (
            loadingPub ? <LoadingSpinner /> :
            publicaciones.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-8 h-8 text-gray-300" />}
                title="Sin publicaciones"
                desc="Prueba con otro término de búsqueda"
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {publicaciones.map((p) => {
                  const cat     = getCat(p.profesional.categoria.nombre);
                  const CatIcon = cat.icon;
                  return (
                    <Link
                      key={p.id}
                      to={`/publicaciones/${p.id}`}
                      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-200 transition-all duration-200"
                    >
                      {/* Imagen */}
                      <div className="aspect-square overflow-hidden relative bg-gray-50">
                        {p.imagen_url ? (
                          <img
                            src={p.imagen_url}
                            alt={p.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${cat.color}10, ${cat.color}22)` }}
                          >
                            <CatIcon className="w-8 h-8 opacity-30" style={{ color: cat.color }} />
                          </div>
                        )}
                        {/* badge categoría */}
                        <div
                          className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CatIcon className="w-3 h-3 text-white" strokeWidth={2.5} />
                        </div>
                        {/* rating flotante */}
                        {(p.promedio_resenas ?? 0) > 0 && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-[11px] font-bold text-white">{(p.promedio_resenas ?? 0).toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-[13px] font-black text-gray-900 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                          {p.titulo}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{p.profesional.usuario.nombre_completo}</p>
                        {p.likes_count > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                            <span className="text-[11px] text-gray-400">{p.likes_count}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </div>
      ) : (
        /* ── ESTADO INICIAL — Explorar por categoría ── */
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-black text-gray-900">Explorar por categoría</h2>
            <span className="text-[12px] text-gray-400 bg-white border border-gray-200 px-2.5 py-1 rounded-full shadow-sm">
              {(categorias?.data ?? []).length} oficios
            </span>
          </div>

          {loadingCats ? <LoadingSpinner /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(categorias?.data ?? []).map((cat) => {
                const cfg  = getCat(cat.nombre);
                const Icon = cfg.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setQuery(cat.nombre)}
                    className="group relative flex items-center gap-4 px-4 py-4 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left overflow-hidden"
                  >
                    {/* Borde izquierdo de color */}
                    <div
                      className="absolute left-0 inset-y-0 w-1 rounded-l-2xl"
                      style={{ backgroundColor: cfg.color }}
                    />

                    {/* Fondo hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: `linear-gradient(to right, ${cfg.color}08, transparent)` }}
                    />

                    {/* Icono */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-1 transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: `${cfg.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} strokeWidth={2} />
                    </div>

                    <span className="flex-1 text-[14px] font-bold text-gray-800 group-hover:text-gray-900 leading-snug">
                      {cat.nombre}
                    </span>

                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Estado vacío ─── */
function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="font-black text-gray-700 text-[16px] mb-1">{title}</p>
      <p className="text-[13px] text-gray-400 max-w-xs">{desc}</p>
    </div>
  );
}
