import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

const FULLSCREEN_ROUTES = ['/mapa'];

export default function AppLayout() {
  const { pathname } = useLocation();
  const fullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />

      {fullscreen ? (
        // Mapa y otras páginas full-screen — sin padding extra
        <div className="pb-16 md:pb-0">
          <Outlet />
        </div>
      ) : (
        // Páginas normales — sin restricción de ancho, cada página maneja su layout
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-8">
          <Outlet />
        </main>
      )}

      {/* BottomNav solo en mobile */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
