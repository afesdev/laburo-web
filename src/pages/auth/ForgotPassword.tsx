import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { forgotPassword } from '../../lib/auth';
import LaburoLogo from '../../components/common/LaburoLogo';

const schema = z.object({
  email: z.string().email('Correo inválido'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Error al enviar el correo');
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

        <div className="relative space-y-6">
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="mt-3 text-indigo-200 text-base leading-relaxed">
              No te preocupes, te enviamos un enlace seguro para que puedas restablecerla en segundos.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-indigo-200">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
              El enlace expira en 30 minutos
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
              Revisa también tu carpeta de spam
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
              Solo funciona si el correo está registrado
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-indigo-300">
          © {new Date().getFullYear()} OficiosApp · Todos los derechos reservados
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 bg-white">
        <div className="lg:hidden mb-8">
          <Link to="/feed"><LaburoLogo showText /></Link>
        </div>

        <div className="w-full max-w-[400px]">
          {sent ? (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Correo enviado</h1>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Ingresa tu correo y te enviaremos un enlace para restablecerla
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
                    <span className="mt-0.5 text-red-400">✕</span>
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
