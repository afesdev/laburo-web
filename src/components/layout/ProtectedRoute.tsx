import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../store/auth';

interface Props {
  roles?: string[];
}

export default function ProtectedRoute({ roles }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/feed" replace />;

  return <Outlet />;
}
