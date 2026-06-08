import { useEffect } from 'react';
import { useAuth } from '../../store/auth';
import { fetchProfile } from '../../lib/auth';
import LoadingSpinner from '../common/LoadingSpinner';

export default function AuthInit({ children }: { children: React.ReactNode }) {
  const { token, user, isLoading, setUser, setLoading, logout } = useAuth();

  useEffect(() => {
    if (token && !user) {
      fetchProfile()
        .then((profile) => setUser(profile))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else if (!token) {
      setLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return <>{children}</>;
}
