import { NavLink } from 'react-router-dom';
import { House, Search, Heart, MapPin, User } from 'lucide-react';
import { useAuth } from '../../store/auth';

const nav = [
  { to: '/feed', icon: House, label: 'Inicio' },
  { to: '/search', icon: Search, label: 'Buscar' },
  { to: '/mapa', icon: MapPin, label: 'Mapa' },
  { to: '/favoritos', icon: Heart, label: 'Favs', auth: true },
  { to: '/perfil', icon: User, label: 'Perfil', auth: true },
];

export default function BottomNav() {
  const { user } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-100 flex justify-around items-center h-16 px-2 safe-area-bottom">
      {nav.map(({ to, icon: Icon, label, auth }) => {
        const dest = auth && !user ? '/login' : to;
        return (
          <NavLink
            key={to}
            to={dest}
            className="relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-full"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center w-9 h-8 rounded-xl transition-all duration-150 ${
                    isActive ? 'bg-indigo-50' : ''
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-gray-400'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </span>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
