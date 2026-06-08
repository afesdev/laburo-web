import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Megaphone, Users, FileWarning, ShieldCheck,
  Wrench, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../store/auth';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/promociones', icon: Megaphone, label: 'Promociones' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/admin/denuncias', icon: FileWarning, label: 'Denuncias' },
  { to: '/admin/verificaciones', icon: ShieldCheck, label: 'Verificaciones' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.rol !== 'admin') return <Navigate to="/feed" replace />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar fijo */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-gray-900 flex flex-col z-40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-700">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-none">OficiosApp</p>
            <p className="text-indigo-400 text-[10px] font-medium mt-0.5">Panel Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {adminNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3 h-3 opacity-40" />
            </NavLink>
          ))}

          <div className="border-t border-gray-700 my-3" />

          <NavLink
            to="/feed"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Wrench className="w-4 h-4" />
            <span>Ir a la App</span>
          </NavLink>
        </nav>

        {/* User */}
        <div className="border-t border-gray-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.nombre_completo.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.nombre_completo}</p>
              <p className="text-[11px] text-indigo-400">Administrador</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <main className="ml-60 flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
