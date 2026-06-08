import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Search, Heart, User, LogOut,
  PenSquare, LayoutDashboard, Menu, X, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../store/auth';
import LaburoLogo from '../common/LaburoLogo';

const NAV = [
  { to: '/feed',   label: 'Inicio' },
  { to: '/search', label: 'Buscar' },
  { to: '/mapa',   label: 'Mapa'   },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen]     = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery]           = useState('');
  const dropRef   = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const initials = user?.nombre_completo
    ?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() ?? '?';

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setSearchOpen(false); setQuery(''); }
  };

  return (
    <>
      {/* ── Barra principal ── */}
      <header className="fixed top-0 inset-x-0 z-50">
        {/* Fondo con blur */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/60" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-[60px] flex items-center gap-4">

          {/* Logo */}
          <Link to="/feed" className="flex items-center gap-2.5 flex-shrink-0 group mr-2">
            <LaburoLogo size="sm" />
          </Link>

          {/* Nav pills — desktop */}
          <nav className="hidden md:flex items-center bg-gray-100/80 rounded-full p-1 gap-0.5">
            {NAV.map(({ to, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {user && (
              <NavLink to="/favoritos"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150 ${
                    isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`
                }
              >
                Favoritos
              </NavLink>
            )}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Buscador expandible — desktop */}
          <div className="hidden md:flex items-center">
            {searchOpen ? (
              <form onSubmit={submitSearch} className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 w-64 transition-all">
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar profesional..."
                  className="bg-transparent text-[13px] text-gray-800 placeholder-gray-400 outline-none flex-1 min-w-0"
                />
                <button type="button" onClick={() => setSearchOpen(false)}>
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>
            )}
          </div>

          {/* Acciones derecha */}
          <div className="flex items-center gap-1">

            {/* Mobile: buscar */}
            <button
              onClick={() => navigate('/search')}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            {user ? (
              <>
                {/* Publicar — solo profesionales */}
                {user.rol === 'profesional' && (
                  <Link
                    to="/publicaciones/crear"
                    className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-full transition-all shadow-sm hover:shadow-md"
                  >
                    <PenSquare className="w-3.5 h-3.5" />
                    Publicar
                  </Link>
                )}

                {/* Avatar + dropdown */}
                <div className="relative" ref={dropRef}>
                  <button
                    onClick={() => setDropOpen(!dropOpen)}
                    className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border transition-all duration-150 ${
                      dropOpen
                        ? 'border-indigo-200 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-[1.5px] ring-white">
                      {user.foto_perfil_url ? (
                        <img src={user.foto_perfil_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-black bg-gradient-to-br from-indigo-400 to-violet-500">
                          {initials}
                        </div>
                      )}
                    </div>
                    <Menu className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                  {/* Dropdown */}
                  {dropOpen && (
                    <div className="absolute right-0 top-full mt-2.5 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      {/* Header usuario */}
                      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-50">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                          {user.foto_perfil_url ? (
                            <img src={user.foto_perfil_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-sm font-black bg-gradient-to-br from-indigo-400 to-violet-500">
                              {initials}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-gray-900 truncate">{user.nombre_completo}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full capitalize">
                            {user.rol}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-1.5">
                        <DropItem icon={User}          label="Mi perfil"          to="/perfil"               onClick={() => setDropOpen(false)} />
                        <DropItem icon={Heart}         label="Favoritos"          to="/favoritos"            onClick={() => setDropOpen(false)} />
                        {user.rol === 'profesional' && (
                          <>
                            <DropItem icon={TrendingUp} label="Mis promociones"   to="/promociones"          onClick={() => setDropOpen(false)} />
                            <DropItem icon={PenSquare}   label="Nueva publicación"  to="/publicaciones/crear"  onClick={() => setDropOpen(false)} />
                          </>
                        )}
                        {user.rol === 'admin' && (
                          <DropItem icon={LayoutDashboard} label="Panel admin"   to="/admin"                onClick={() => setDropOpen(false)} />
                        )}
                      </div>

                      {/* Cerrar sesión */}
                      <div className="border-t border-gray-50 p-1.5">
                        <button
                          onClick={() => { logout(); setDropOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden md:block px-4 py-2 text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-[13px] font-bold rounded-full transition-all shadow-sm hover:shadow-md"
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Hamburger — solo mobile cuando hay user */}
            {user && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* ── Menú mobile ── */}
        {mobileOpen && (
          <div className="relative md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 px-4 py-3 space-y-1">
            {NAV.map(({ to, label }) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {user && (
              <>
                <NavLink to="/favoritos" onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `flex items-center px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  Favoritos
                </NavLink>
                {user.rol === 'profesional' && (
                  <>
                    <Link to="/promociones" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                      <TrendingUp className="w-4 h-4" /> Mis promociones
                    </Link>
                    <Link to="/publicaciones/crear" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                      <PenSquare className="w-4 h-4" /> Nueva publicación
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </header>

      {/* Spacer */}
      <div className="h-[60px]" />
    </>
  );
}

function DropItem({ icon: Icon, label, to, onClick }: {
  icon: React.ElementType; label: string; to: string; onClick: () => void;
}) {
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-3 px-3.5 py-2.5 mx-1.5 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-gray-500" />
      </div>
      {label}
    </Link>
  );
}
