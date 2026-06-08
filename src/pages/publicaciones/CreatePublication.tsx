import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Loader2, Upload, Trash2, X,
  ImagePlus, FileVideo, Link2, Sparkles, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../store/auth';
import { fetchProfile } from '../../lib/auth';
import { createPublicacion, uploadFile } from '../../lib/publicaciones';

export default function CreatePublication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const imgInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState('');
  const [extraImages, setExtraImages] = useState<{ file: File; preview: string }[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: fetchProfile,
    enabled: !!user,
  });

  const profId = profile?.profesional?.id;

  // ── Handlers de imagen ──
  const applyMainFile = (file: File) => {
    setMainImage(file);
    setMainPreview(URL.createObjectURL(file));
  };

  const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyMainFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) applyMainFile(file);
  };

  const handleExtraImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const items = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setExtraImages((prev) => [...prev, ...items]);
  };

  const removeExtra = (i: number) => {
    URL.revokeObjectURL(extraImages[i].preview);
    setExtraImages(extraImages.filter((_, j) => j !== i));
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setVideoUrl('');
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!titulo.trim()) { setError('El título es requerido'); return; }
    if (!mainImage) { setError('Selecciona una imagen principal'); return; }
    if (!profId) { setError('Perfil profesional no encontrado'); return; }
    setError('');
    setPublishing(true);

    try {
      const imagen_url = (await uploadFile(mainImage, 'publicaciones')).url;
      const fotos_urls: string[] = [];
      for (const img of extraImages) {
        fotos_urls.push((await uploadFile(img.file, 'publicaciones')).url);
      }

      let vurl: string | undefined;
      if (videoFile) vurl = (await uploadFile(videoFile, 'publicaciones')).url;
      else if (videoUrl) vurl = videoUrl;

      const pub = await createPublicacion({
        profesional_id: profId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        imagen_url,
        video_url: vurl,
        fotos_urls: fotos_urls.length > 0 ? fotos_urls : undefined,
      });

      navigate(`/publicaciones/${pub.id}`, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg ?? 'Error al publicar');
    } finally {
      setPublishing(false);
    }
  };

  if (!user || user.rol !== 'profesional') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <ImagePlus className="w-7 h-7 text-red-300" />
        </div>
        <p className="font-bold text-gray-700 mb-1">Acceso restringido</p>
        <p className="text-sm text-gray-400 mb-4">Solo profesionales pueden crear publicaciones.</p>
        <button onClick={() => navigate(-1)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Volver
        </button>
      </div>
    );
  }

  const charCount = descripcion.length;
  const tituloOk = titulo.trim().length >= 3;
  const imageOk = !!mainImage;
  const steps = [tituloOk, imageOk];
  const progress = steps.filter(Boolean).length;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Nueva publicación</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Muestra tu trabajo a miles de clientes</p>
          </div>
          {/* Progress mini */}
          <div className="flex-shrink-0 flex items-center gap-1.5">
            {steps.map((ok, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${ok ? 'bg-indigo-500' : 'bg-gray-200'}`}
              />
            ))}
            <span className="text-[11px] font-semibold text-gray-400 ml-1">{progress}/{steps.length}</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-700 text-[13px] rounded-2xl px-4 py-3">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Sección: Contenido ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h2 className="text-[14px] font-bold text-gray-800">Información del trabajo</h2>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Título */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-semibold text-gray-700">
                Título <span className="text-red-400">*</span>
              </label>
              {tituloOk && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={100}
              placeholder="Ej: Instalación de piso cerámico en sala"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{titulo.length}/100</p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Descripción <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={1000}
              placeholder="Describe el trabajo realizado, materiales usados, tiempo de entrega..."
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-[14px] text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-indigo-400 focus:bg-white transition-all leading-relaxed"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{charCount}/1000</p>
          </div>
        </div>
      </div>

      {/* ── Sección: Imagen principal ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-indigo-500" />
            <h2 className="text-[14px] font-bold text-gray-800">
              Imagen principal <span className="text-red-400">*</span>
            </h2>
          </div>
          {imageOk && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        </div>

        <div className="px-5 py-4">
          {mainPreview ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
              <img src={mainPreview} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <button
                onClick={() => { setMainImage(null); setMainPreview(''); }}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3">
                <span className="text-[11px] font-semibold text-white/80 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {mainImage?.name}
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imgInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`w-full aspect-video border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all ${
                dragOver
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                dragOver ? 'bg-indigo-100' : 'bg-white border border-gray-200'
              }`}>
                <Upload className={`w-5 h-5 ${dragOver ? 'text-indigo-600' : 'text-gray-400'}`} />
              </div>
              <div className="text-center">
                <p className={`text-[14px] font-semibold ${dragOver ? 'text-indigo-700' : 'text-gray-600'}`}>
                  {dragOver ? 'Suelta la imagen aquí' : 'Arrastra o selecciona una imagen'}
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5">PNG, JPG, WEBP · Máx. 10 MB</p>
              </div>
              {!dragOver && (
                <span className="px-4 py-1.5 bg-indigo-600 text-white text-[12px] font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                  Elegir archivo
                </span>
              )}
            </button>
          )}
          <input ref={imgInputRef} type="file" accept="image/*" onChange={handleMainImage} className="hidden" />
        </div>
      </div>

      {/* ── Sección: Fotos adicionales ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-gray-400" />
            <h2 className="text-[14px] font-bold text-gray-800">
              Fotos adicionales
              <span className="ml-2 text-[11px] font-normal text-gray-400">opcional</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => extraInputRef.current?.click()}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Agregar
          </button>
          <input ref={extraInputRef} type="file" accept="image/*" multiple onChange={handleExtraImages} className="hidden" />
        </div>

        <div className="px-5 py-4">
          {extraImages.length === 0 ? (
            <button
              type="button"
              onClick={() => extraInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:border-indigo-200 hover:text-indigo-500 transition-all"
            >
              <ImagePlus className="w-5 h-5" />
              <span className="text-[13px] font-medium">Agregar más fotos del trabajo</span>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {extraImages.map((img, i) => (
                <div key={i} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button
                    onClick={() => removeExtra(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {/* Add more */}
              <button
                type="button"
                onClick={() => extraInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 hover:border-indigo-200 hover:text-indigo-400 transition-all"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Sección: Video ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
          <FileVideo className="w-4 h-4 text-gray-400" />
          <h2 className="text-[14px] font-bold text-gray-800">
            Video
            <span className="ml-2 text-[11px] font-normal text-gray-400">opcional</span>
          </h2>
        </div>

        <div className="px-5 py-4 space-y-3">
          {videoPreview ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900">
              <video src={videoPreview} controls className="w-full h-full" />
              <button
                onClick={() => { setVideoFile(null); setVideoPreview(''); }}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : videoUrl ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900">
              <video src={videoUrl} controls className="w-full h-full" />
              <button
                onClick={() => setVideoUrl('')}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2.5 text-gray-400 hover:border-indigo-200 hover:text-indigo-500 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-semibold">Subir video del trabajo</p>
                  <p className="text-[11px]">MP4, MOV · Máx. 100 MB</p>
                </div>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] font-medium text-gray-400">o pega una URL</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://ejemplo.com/video.mp4"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                />
              </div>
            </>
          )}
          <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoFile} className="hidden" />
        </div>
      </div>

      {/* ── Botones ── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-5 py-3 text-[14px] font-semibold text-gray-600 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={publishing || !tituloOk || !imageOk}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-[14px] font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          {publishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Publicar trabajo
            </>
          )}
        </button>
      </div>
    </div>
  );
}
