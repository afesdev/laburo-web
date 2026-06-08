import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Upload, X, Trash2 } from 'lucide-react';
import { fetchPublicacion, updatePublicacion, uploadFile } from '../../lib/publicaciones';
import { useAuth } from '../../store/auth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function EditPublication() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pubId = Number(id);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [newMainFile, setNewMainFile] = useState<File | null>(null);
  const [newMainPreview, setNewMainPreview] = useState('');
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const [newExtraFiles, setNewExtraFiles] = useState<{ file: File; preview: string }[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: pub, isLoading } = useQuery({
    queryKey: ['publicacion', pubId],
    queryFn: () => fetchPublicacion(pubId),
    enabled: !isNaN(pubId),
  });

  useEffect(() => {
    if (pub) {
      setTitulo(pub.titulo);
      setDescripcion(pub.descripcion || '');
      setMainImageUrl(pub.imagen_url);
      if (pub.fotos && pub.fotos.length > 0) {
        setExtraPhotos(pub.fotos.map((f) => f.imagen_url));
      }
    }
  }, [pub]);

  const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewMainFile(file);
    setNewMainPreview(URL.createObjectURL(file));
  };

  const handleExtraImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const items = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setNewExtraFiles((prev) => [...prev, ...items]);
  };

  const removeExistingPhoto = (idx: number) => {
    setExtraPhotos(extraPhotos.filter((_, i) => i !== idx));
  };

  const removeNewExtra = (idx: number) => {
    URL.revokeObjectURL(newExtraFiles[idx].preview);
    setNewExtraFiles(newExtraFiles.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) { setError('El título es requerido'); return; }
    setError('');
    setSaving(true);

    try {
      let imagen_url = mainImageUrl;
      if (newMainFile) {
        const result = await uploadFile(newMainFile, 'publicaciones');
        imagen_url = result.url;
      }

      const fotos_urls = [...extraPhotos];
      for (const item of newExtraFiles) {
        const result = await uploadFile(item.file, 'publicaciones');
        fotos_urls.push(result.url);
      }

      await updatePublicacion(pubId, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        imagen_url,
        fotos_urls: fotos_urls.length > 0 ? fotos_urls : undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['publicacion', pubId] });
      queryClient.invalidateQueries({ queryKey: ['publicaciones'] });
      queryClient.invalidateQueries({ queryKey: ['my-publications'] });
      navigate(`/publicaciones/${pubId}`, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!pub) return <div className="text-center py-12"><p className="text-red-500">Publicación no encontrada</p></div>;

  if (!user || (user.rol !== 'profesional' && pub.profesional.usuario_id !== user.id)) {
    return <div className="text-center py-12"><p className="text-red-500">No tienes permiso para editar esta publicación</p></div>;
  }

  return (
    <div>
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-4">Editar publicación</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagen principal</label>
          {newMainPreview ? (
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
              <img src={newMainPreview} alt="" className="w-full h-full object-cover" />
              <button onClick={() => { setNewMainFile(null); setNewMainPreview(''); }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
              <img src={mainImageUrl} alt="" className="w-full h-full object-cover" />
              <button onClick={() => imgInputRef.current?.click()}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors">
                <Upload className="w-4 h-4" />
              </button>
            </div>
          )}
          <input ref={imgInputRef} type="file" accept="image/*" onChange={handleMainImage} className="hidden" />
          <p className="text-xs text-gray-400 mt-1">Selecciona una nueva imagen para reemplazarla (opcional).</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Fotos adicionales</label>
            <button type="button" onClick={() => extraInputRef.current?.click()}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
              <Upload className="w-3 h-3" /> Agregar fotos
            </button>
            <input ref={extraInputRef} type="file" accept="image/*" multiple onChange={handleExtraImages} className="hidden" />
          </div>
          {(extraPhotos.length > 0 || newExtraFiles.length > 0) && (
            <div className="grid grid-cols-3 gap-2">
              {extraPhotos.map((url, i) => (
                <div key={`existing-${i}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <button onClick={() => removeExistingPhoto(i)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newExtraFiles.map((item, i) => (
                <div key={`new-${i}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeNewExtra(i)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded text-white hover:bg-black/70 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
