import { create } from 'zustand';

interface User {
  id: number;
  nombre_completo: string;
  email: string;
  telefono?: string;
  rol: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isLoading: !!localStorage.getItem('access_token'),
  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, token, isLoading: false });
  },
  setUser: (user) => set({ user, isLoading: false }),
  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isLoading: false });
  },
  setLoading: (loading) => set({ isLoading: loading }),
}));
