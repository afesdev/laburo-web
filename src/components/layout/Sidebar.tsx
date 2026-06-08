import { NavLink, useNavigate } from 'react-router-dom';
import {
  House,
  Search,
  Heart,
  MapPin,
  User,
  PenSquare,
  Wrench,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../store/auth';
import LaburoLogo from '../common/LaburoLogo';

const mainNav = [
  { to: '/feed', icon: House, label: 'Inicio' },
  { to: '/search', icon: Search, label: 'Buscar' },
  { to: '/mapa', icon: MapPin, label: 'Mapa' },
];

const authNav = [
  { to: '/favoritos', icon: Heart, label: 'Favoritos' },
  { to: '/perfil', icon: User, label: 'Mi Perfil' },
];

function NavItem({
  to,
  icon: Icon,
  label,
  locked = false,
  badge,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  locked?: boolean;
  badge?: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : locked
            ? 'text-gray-400 hover:bg-gray-50 hover:text-gray-500'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
              isActive
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-transparent text-inherit group-hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
          </span>
          <span className="flex-1">{label}</span>
          {badge && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
              {badge}
            </span>
          )}
          {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.nombre_completo
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? '?';

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 z-40 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 flex-shrink-0">
        <LaburoLogo />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          Explorar
        </p>
        {mainNav.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} />
        ))}

        <div className="pt-4 pb-2">
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Mi cuenta
          </p>
          {authNav.map(({ to, icon, label }) =>
            user ? (
              <NavItem key={to} to={to} icon={icon} label={label} />
            ) : (
              <NavItem
                key={to}
                to="/login"
                icon={icon}
                label={label}
                locked
                badge="Login"
              />
            )
          )}
        </div>

        {/* Admin */}
        {user?.rol === 'admin' && (
          <div className="pt-4 pb-2">
            <p className="px-3 mb-2 text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">
              Administración
            </p>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                }`
              }
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100/80">
                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
              </span>
              <span className="flex-1">Panel Admin</span>
              <ShieldCheck className="w-3.5 h-3.5 opacity-60" />
            </NavLink>
          </div>
        )}
      </nav>

      {/* Nueva publicación */}
      {user?.rol === 'profesional' && (
        <div className="px-3 pb-3">
          <button
            onClick={() => navigate('/publicaciones/crear')}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md"
          >
            <PenSquare className="w-4 h-4" />
            Nueva publicación
          </button>
        </div>
      )}

      {/* User footer */}
      {user ? (
        <div className="border-t border-gray-100 px-3 py-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                user.rol === 'admin'
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                  : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'
              }`}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                {user.nombre_completo}
              </p>
              <p className="text-[11px] text-gray-400 capitalize truncate leading-tight">
                {user.rol === 'admin' ? '🛡 Administrador' : user.rol}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-3 py-3 space-y-2 flex-shrink-0">
          <NavLink
            to="/login"
            className="block w-full text-center px-3 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Iniciar sesión
          </NavLink>
          <NavLink
            to="/register"
            className="block w-full text-center px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Crear cuenta
          </NavLink>
        </div>
      )}
    </aside>
  );
}
