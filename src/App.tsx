import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthInit from './components/layout/AuthInit';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';
import Feed from './pages/feed/Feed';
import Search from './pages/search/Search';
import Favoritos from './pages/favoritos/Favoritos';
import Mapa from './pages/mapa/Mapa';
import Perfil from './pages/perfil/Perfil';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ProfesionalDetail from './pages/profesionales/ProfesionalDetail';
import PublicationDetail from './pages/publicaciones/PublicationDetail';
import CreatePublication from './pages/publicaciones/CreatePublication';
import EditPublication from './pages/publicaciones/EditPublication';
import MisPromociones from './pages/promociones/MisPromociones';
import CrearPromocion from './pages/promociones/CrearPromocion';
import RegistrarPago from './pages/promociones/RegistrarPago';
import Dashboard from './pages/admin/Dashboard';
import PromocionesAdmin from './pages/admin/PromocionesAdmin';
import UsuariosAdmin from './pages/admin/UsuariosAdmin';
import DenunciasAdmin from './pages/admin/DenunciasAdmin';
import VerificacionesAdmin from './pages/admin/VerificacionesAdmin';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInit>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── Panel Admin ── */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="promociones" element={<PromocionesAdmin />} />
              <Route path="usuarios" element={<UsuariosAdmin />} />
              <Route path="denuncias" element={<DenunciasAdmin />} />
              <Route path="verificaciones" element={<VerificacionesAdmin />} />
            </Route>

            {/* ── App pública ── */}
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/feed" replace />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/search" element={<Search />} />

              {/* Rutas protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/favoritos" element={<Favoritos />} />
                <Route path="/perfil" element={<Perfil />} />
              </Route>

              <Route element={<ProtectedRoute roles={['profesional']} />}>
                <Route path="/publicaciones/crear" element={<CreatePublication />} />
                <Route path="/publicaciones/:id/editar" element={<EditPublication />} />
                <Route path="/promociones" element={<MisPromociones />} />
                <Route path="/promociones/crear" element={<CrearPromocion />} />
                <Route path="/promociones/:id/pagar" element={<RegistrarPago />} />
              </Route>

              <Route path="/mapa" element={<Mapa />} />
              <Route path="/profesionales/:id" element={<ProfesionalDetail />} />
              <Route path="/publicaciones/:id" element={<PublicationDetail />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthInit>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
