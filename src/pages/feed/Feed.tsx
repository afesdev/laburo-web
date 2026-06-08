import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  Search, Wrench, ChevronRight, Loader2, X,
  Droplets, Hammer, Zap, Palette, Leaf, Car, Lock,
  Scale, Calculator, HardHat, Wind, Scissors, ChefHat, Tv2, Stethoscope,
  Sparkles, Star, Users, FileText,
} from 'lucide-react';
import { fetchPublicaciones } from '../../lib/publicaciones';
import { fetchCategorias } from '../../lib/categorias';
import { getActivas } from '../../lib/promociones';
import { useAuth } from '../../store/auth';
import PublicationCard from '../../components/publicaciones/PublicationCard';
import CarruselBanners from '../promociones/CarruselBanners';
import { PromocionPerfilCard, PromocionPublicacionCard } from '../promociones/PromocionFeedItem';

// ── Categoría config ──────────────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'Plomero / Fontanero':                        { icon: Droplets,    color: '#2563EB', bg: '#EFF6FF' },
  'Carpintero':                                 { icon: Hammer,      color: '#D97706', bg: '#FFFBEB' },
  'Electricista':                               { icon: Zap,         color: '#CA8A04', bg: '#FEFCE8' },
  'Pintor':                                     { icon: Palette,     color: '#DB2777', bg: '#FDF2F8' },
  'Médico General':                             { icon: Stethoscope, color: '#DC2626', bg: '#FEF2F2' },
  'Mecánico Automotriz':                        { icon: Car,         color: '#475569', bg: '#F8FAFC' },
  'Cerrajero':                                  { icon: Lock,        color: '#334155', bg: '#F1F5F9' },
  'Jardinero / Paisajista':                     { icon: Leaf,        color: '#059669', bg: '#F0FDF4' },
  'Abogado':                                    { icon: Scale,       color: '#4F46E5', bg: '#EEF2FF' },
  'Contador / Fiscalista':                      { icon: Calculator,  color: '#0D9488', bg: '#F0FDFA' },
  'Arquitecto':                                 { icon: HardHat,     color: '#EA580C', bg: '#FFF7ED' },
  'Técnico en Refrigeración':                   { icon: Wind,        color: '#0891B2', bg: '#ECFEFF' },
  'Barbero / Estilista':                        { icon: Scissors,    color: '#7C3AED', bg: '#F5F3FF' },
  'Chef / Cocinero Particular':                 { icon: ChefHat,     color: '#EA580C', bg: '#FFF7ED' },
  'Técnico en Reparación de Electrodomésticos': { icon: Tv2,         color: '#2563EB', bg: '#EFF6FF' },
};

const FALLBACK_CAT = { icon: Wrench, color: '#4F46E5', bg: '#EEF2FF' };

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => fetchCategorias(),
  });
  const categorias = categoriasData?.data ?? [];

  const activeCategoryId = activeCategory
    ? categorias.find((c) => c.nombre === activeCategory)?.id
    : undefined;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['publicaciones-feed', activeCategory],
      queryFn: ({ pageParam = 1 }) =>
        fetchPublicaciones({ page: pageParam as number, categoria_id: activeCategoryId }),
      initialPageParam: 1,
      getNextPageParam: (last) =>
        last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    });

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { data: promosActivas = [] } = useQuery({
    queryKey: ['promociones-activas'],
    queryFn: getActivas,
    staleTime: 1000 * 60 * 2,
  });

  const banners          = promosActivas.filter((p) => p.tipo === 'banner');
  const perfilPromos     = promosActivas.filter((p) => p.tipo === 'perfil');
  const publicacionPromos = promosActivas.filter((p) => p.tipo === 'publicacion');

  const publications = data?.pages.flatMap((p) => p.data) ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC]">

      {/* ─────────────────── HERO (light) ─────────────────── */}
      <section
        className="relative -mx-4 sm:-mx-6 lg:-mx-8 mb-10 bg-white overflow-hidden"
        style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}
      >
        {/* Franja accent top */}
        <div className="h-[3px] w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />

        {/* Fondo con gradiente muy sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40 pointer-events-none" />

        {/* Círculos decorativos */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-100/40 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-100/30 blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 md:py-20">
          <div className="max-w-2xl mx-auto text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[12px] font-bold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Profesionales verificados en Colombia
            </div>

            {/* Título */}
            <h1 className="text-4xl md:text-[52px] font-black leading-[1.1] text-gray-900 mb-4 tracking-tight">
              Encuentra el experto<br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                que necesitas
              </span>
            </h1>

            <p className="text-gray-500 text-[16px] mb-8 max-w-md mx-auto leading-relaxed">
              Plomeros, electricistas, carpinteros y más — profesionales listos para ayudarte hoy.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
              <div
                className={`relative flex items-center bg-white rounded-2xl transition-all duration-200 overflow-hidden ${
                  searchFocused
                    ? 'shadow-lg shadow-indigo-100 ring-2 ring-indigo-300'
                    : 'shadow-md ring-1 ring-gray-200'
                }`}
              >
                <Search className={`w-5 h-5 absolute left-4 pointer-events-none transition-colors ${searchFocused ? 'text-indigo-500' : 'text-gray-400'}`} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="¿Qué profesional necesitas?"
                  className="flex-1 pl-12 pr-4 py-4 text-[15px] text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="mr-2">
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
                <button
                  type="submit"
                  className="m-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[14px] font-bold rounded-xl transition-colors flex-shrink-0 shadow-sm"
                >
                  Buscar
                </button>
              </div>
            </form>

            {/* Búsquedas populares */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-gray-400 text-[12px] font-medium">Popular:</span>
              {['Plomero', 'Electricista', 'Pintor', 'Carpintero'].map((q) => (
                <button
                  key={q}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-[12px] font-semibold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 border-t border-gray-100 bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center gap-8 md:gap-16">
              {[
                { icon: Users,    value: '5,000+', label: 'Profesionales' },
                { icon: FileText, value: '12,000+', label: 'Publicaciones' },
                { icon: Star,     value: '4.8★',    label: 'Calificación promedio' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-center">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-[15px] font-black text-gray-900 leading-none">{value}</div>
                    <div className="text-[11px] text-gray-400 font-medium mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── CATEGORÍAS ─────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-[18px] font-black text-gray-900">¿Qué necesitas hoy?</h2>
          </div>
          <Link
            to="/search"
            className="flex items-center gap-1 text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile: scroll horizontal / Desktop: grid */}
        <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
          {categorias.slice(0, 8).map((cat) => {
            const cfg = CAT_CONFIG[cat.nombre] ?? FALLBACK_CAT;
            const Icon = cfg.icon;
            const isActive = activeCategory === cat.nombre;
            return (
              <CategoryChip
                key={cat.id}
                icon={Icon}
                label={cat.nombre}
                color={cfg.color}
                bg={cfg.bg}
                isActive={isActive}
                onClick={() => setActiveCategory(isActive ? null : cat.nombre)}
              />
            );
          })}
        </div>

        {/* Mobile scroll */}
        <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-hide">
          {categorias.slice(0, 10).map((cat) => {
            const cfg = CAT_CONFIG[cat.nombre] ?? FALLBACK_CAT;
            const Icon = cfg.icon;
            const isActive = activeCategory === cat.nombre;
            return (
              <div key={cat.id} className="flex-shrink-0 snap-start">
                <CategoryChip
                  icon={Icon}
                  label={cat.nombre}
                  color={cfg.color}
                  bg={cfg.bg}
                  isActive={isActive}
                  onClick={() => setActiveCategory(isActive ? null : cat.nombre)}
                  compact
                />
              </div>
            );
          })}
        </div>

        {/* Filtro activo badge */}
        {activeCategory && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full">
              <span className="text-[13px] font-semibold text-indigo-700">{activeCategory}</span>
              <button
                onClick={() => setActiveCategory(null)}
                className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center hover:bg-indigo-300 transition-colors"
              >
                <X className="w-2.5 h-2.5 text-indigo-700" />
              </button>
            </div>
            <span className="text-[12px] text-gray-400">Mostrando resultados para esta categoría</span>
          </div>
        )}
      </section>

      {/* ─────────────────── CARRUSEL BANNERS ─────────────────── */}
      <CarruselBanners banners={banners} />

      {/* ─────────────────── PERFILES DESTACADOS ─────────────────── */}
      {perfilPromos.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="text-[18px] font-black text-gray-900">Profesionales destacados</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {perfilPromos.map((p) => (
              <div key={p.id} className="flex-shrink-0 snap-start">
                <PromocionPerfilCard promo={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────── PUBLICACIONES EN FEED ─────────────────── */}
      {publicacionPromos.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
            <h2 className="text-[18px] font-black text-gray-900">Publicaciones destacadas</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {publicacionPromos.map((p) => (
              <div key={p.id} className="flex-shrink-0 snap-start">
                <PromocionPublicacionCard promo={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────── PUBLICACIONES RECIENTES ─────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-[18px] font-black text-gray-900">
              {activeCategory ? `${activeCategory}` : 'Publicaciones recientes'}
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-[13px] text-gray-400 font-medium">Cargando publicaciones...</p>
          </div>
        ) : publications.length === 0 ? (
          <EmptyState activeCategory={activeCategory} user={user} />
        ) : (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {publications.map((pub) => (
                <div key={pub.id} className="break-inside-avoid">
                  <PublicationCard pub={pub} />
                </div>
              ))}
            </div>

            <div ref={loaderRef} className="flex justify-center py-10">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[13px] font-medium">Cargando más...</span>
                </div>
              )}
              {!hasNextPage && publications.length > 6 && (
                <p className="text-[13px] text-gray-300 font-medium">· Ya viste todo ·</p>
              )}
            </div>
          </>
        )}
      </section>

      {/* ─────────────────── CTA PROFESIONALES ─────────────────── */}
      {(!user || user.rol === 'cliente') && (
        <section className="mt-12 mb-6">
          <div className="relative rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-sm">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-100/60 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 md:p-10">
              {/* Icono */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                <Wrench className="w-10 h-10 text-white" />
              </div>

              {/* Texto */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-[24px] font-black text-gray-900 mb-2">
                  ¿Eres profesional?
                </h3>
                <p className="text-gray-500 text-[14px] leading-relaxed max-w-sm">
                  Crea tu perfil, publica tus servicios y empieza a conseguir clientes hoy mismo. Es gratis.
                </p>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <Link
                  to={user ? '/perfil' : '/register'}
                  className="flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] rounded-2xl transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
                >
                  {user ? 'Ir a mi perfil' : 'Registrarme gratis'}
                  <ChevronRight className="w-4 h-4" />
                </Link>
                {!user && (
                  <Link to="/login" className="text-[12px] text-gray-400 hover:text-gray-600 font-medium transition-colors">
                    Ya tengo cuenta → Iniciar sesión
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Category Chip ─────────────────────────────────────────────────────────────
function CategoryChip({
  icon: Icon, label, color, bg, isActive, onClick, compact = false,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  isActive: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 ${
        compact ? 'w-[72px]' : 'w-full'
      } ${
        isActive
          ? 'border-indigo-300 bg-indigo-50 shadow-sm shadow-indigo-100'
          : 'border-gray-100 bg-white hover:border-indigo-100 hover:shadow-md hover:shadow-gray-100'
      }`}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
        style={{ backgroundColor: isActive ? color + '22' : bg, border: `1.5px solid ${color}22` }}
      >
        <Icon className="w-5 h-5" style={{ color }} strokeWidth={2} />
      </div>
      <span
        className="text-[10px] font-bold text-center leading-tight line-clamp-2"
        style={{ color: isActive ? color : '#374151' }}
      >
        {label}
      </span>
    </button>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ activeCategory, user }: { activeCategory: string | null; user: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-5">
        <FileText className="w-10 h-10 text-indigo-300" />
      </div>
      <h3 className="text-[18px] font-black text-gray-800 mb-2">Sin publicaciones aún</h3>
      <p className="text-[14px] text-gray-400 mb-8 max-w-xs">
        {activeCategory
          ? `No hay publicaciones de "${activeCategory}" en este momento.`
          : 'No hay publicaciones disponibles.'}
      </p>
      {user?.rol === 'profesional' && (
        <Link
          to="/publicaciones/crear"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold text-[14px] rounded-2xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Crear primera publicación
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
