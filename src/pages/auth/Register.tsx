import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, User, Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';
import { register as registerUser } from '../../lib/auth';
import { useAuth } from '../../store/auth';
import LaburoLogo from '../../components/common/LaburoLogo';

const schema = z.object({
  nombre_completo: z.string().min(3, 'Mínimo 3 caracteres').max(150),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(255),
  telefono: z.string().min(7, 'Teléfono inválido').max(20),
  rol: z.enum(['cliente', 'profesional']),
});

type FormData = z.infer<typeof schema>;

const ROL_OPTIONS = [
  {
    value: 'cliente' as const,
    label: 'Cliente',
    desc: 'Busco servicios profesionales',
    icon: User,
  },
  {
    value: 'profesional' as const,
    label: 'Profesional',
    desc: 'Ofrezco mis servicios',
    icon: Briefcase,
  },
];

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rol: 'cliente' },
  });

  const selectedRol = watch('rol');

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await registerUser(data);
      setAuth(res.usuario, res.access_token);
      navigate('/feed', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (Array.isArray(msg)) setError(msg[0]);
      else if (msg) setError(msg);
      else setError('Error al registrarse. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-12 py-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 left-1/3 w-56 h-56 bg-white/5 rounded-full" />
        </div>

        <div className="relative">
          <Link to="/feed"><LaburoLogo showText light /></Link>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
              Únete a la comunidad de profesionales
            </h2>
            <p className="mt-3 text-indigo-200 text-base leading-relaxed">
              Crea tu cuenta en segundos y empieza a conectar hoy mismo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '10K+', label: 'Profesionales activos' },
              { num: '25K+', label: 'Servicios completados' },
              { num: '50+', label: 'Categorías de oficio' },
              { num: '4.9★', label: 'Valoración promedio' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl px-4 py-3">
                <p className="text-white font-bold text-xl">{stat.num}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-indigo-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-300 shrink-0" />
            Tu información está protegida y nunca será compartida sin tu permiso.
          </div>
        </div>

        <p className="relative text-xs text-indigo-300">
          © {new Date().getFullYear()} OficiosApp · Todos los derechos reservados
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 bg-white overflow-y-auto">
        {/* Logo visible solo en móvil */}
        <div className="lg:hidden mb-8">
          <Link to="/feed"><LaburoLogo showText /></Link>
        </div>

        <div className="w-full max-w-[420px]">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
            <p className="text-sm text-gray-500 mt-1">Completa los datos para registrarte</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
                <span className="mt-0.5 text-red-400">✕</span>
                {error}
              </div>
            )}

            {/* Tipo de cuenta */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Tipo de cuenta</label>
              <div className="grid grid-cols-2 gap-3">
                {ROL_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('rol', value)}
                    className={`flex flex-col items-start gap-1 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selectedRol === value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${selectedRol === value ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                      <Icon className={`w-4 h-4 ${selectedRol === value ? 'text-indigo-600' : 'text-gray-500'}`} />
                    </div>
                    <span className={`text-sm font-semibold ${selectedRol === value ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {label}
                    </span>
                    <span className="text-xs text-gray-400 leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
              <input
                type="text"
                autoComplete="name"
                {...register('nombre_completo')}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.nombre_completo ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="Tu nombre completo"
              />
              {errors.nombre_completo && (
                <p className="text-red-500 text-xs">{errors.nombre_completo.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
              <input
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.email ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="tel"
                autoComplete="tel"
                {...register('telefono')}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.telefono ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="3001234567"
              />
              {errors.telefono && (
                <p className="text-red-500 text-xs">{errors.telefono.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  className={`w-full px-4 py-2.5 pr-11 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                    errors.password ? 'border-red-400' : 'border-gray-200'
                  }`}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200 mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>

            <p className="text-center text-xs text-gray-400">
              Al registrarte aceptas nuestros{' '}
              <span className="text-indigo-500 cursor-pointer hover:underline">Términos de uso</span>
              {' '}y{' '}
              <span className="text-indigo-500 cursor-pointer hover:underline">Política de privacidad</span>
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
