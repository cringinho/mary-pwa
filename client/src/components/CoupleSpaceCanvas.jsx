import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SquareHalf, 
  Plus, 
  Trash, 
  SpotifyLogo, 
  Camera, 
  PaintBrush, 
  SmileySticker, 
  ArrowsOutCardinal, 
  Sparkle,
  X,
  Check
} from '@phosphor-icons/react';
import { Loader2 } from 'lucide-react';
import MaryCupidAvatar from './mary/MaryCupidAvatar';

const POSTIT_COLORS = [
  '#FEF08A', // Amarelo clássico
  '#FBCFE8', // Rosa doce
  '#BAE6FD', // Azul céu
  '#A7F3D0', // Verde menta
  '#E9D5FF'  // Lavanda
];

export default function CoupleSpaceCanvas({ coupleData }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planInfo, setPlanInfo] = useState({ plan: 'freemium', limit: 10, count: 0 });

  // Modais de Criação
  const [modalType, setModalType] = useState(null); // 'note' | 'spotify' | 'photo' | 'drawing' | 'sticker'
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState(POSTIT_COLORS[0]);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Canvas de Desenho
  const drawCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#F43F5E');

  async function loadItems() {
    try {
      setLoading(true);
      const res = await fetch('/api/canvas', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setPlanInfo({ plan: data.plan, limit: data.limit, count: data.count });
      }
    } catch (err) {
      console.warn('Erro ao carregar itens do mural:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleCreateItem(itemType, payload, width = 220, height = 160) {
    setSavingItem(true);
    try {
      const res = await fetch('/api/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          itemType,
          x: Math.floor(Math.random() * 200) + 40,
          y: Math.floor(Math.random() * 200) + 40,
          width,
          height,
          payload
        })
      });

      if (res.ok) {
        setModalType(null);
        setNoteText('');
        setSpotifyUrl('');
        setPhotoUrl('');
        setPhotoCaption('');
        await loadItems();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Falha ao adicionar item.');
      }
    } catch (err) {
      console.warn('Erro ao criar item:', err);
    } finally {
      setSavingItem(false);
    }
  }

  async function handleUpdatePosition(id, newX, newY) {
    try {
      await fetch(`/api/canvas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ x: newX, y: newY })
      });
    } catch (err) {
      console.warn('Erro ao atualizar posição:', err);
    }
  }

  async function handleDeleteItem(id) {
    try {
      const res = await fetch(`/api/canvas/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.warn('Erro ao remover item:', err);
    }
  }

  // Conversão de URL do Spotify para Embed oficial
  function formatSpotifyEmbed(url) {
    try {
      const clean = String(url).trim();
      const match = clean.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
      if (match) {
        return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Funções do Canvas de Desenho
  function startDrawing(e) {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }

  function draw(e) {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function saveDrawing() {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    handleCreateItem('drawing', { image: dataUrl }, 260, 200);
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MURAL */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <MaryCupidAvatar state="excited" size={54} />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1">
              <Sparkle size={14} weight="fill" />
              Espaço Livre Colaborativo
            </span>
            <h2 className="text-xl font-bold text-white font-display">
              Nosso Mural Mágico
            </h2>
          </div>
        </div>

        {/* BARRA DE FERRAMENTAS DE CRIAÇÃO */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalType('note')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 text-xs font-semibold transition-colors"
          >
            <SquareHalf size={16} weight="duotone" />
            Post-it
          </button>

          <button
            type="button"
            onClick={() => setModalType('photo')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/30 text-xs font-semibold transition-colors"
          >
            <Camera size={16} weight="duotone" />
            Polaroid
          </button>

          <button
            type="button"
            onClick={() => setModalType('spotify')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-semibold transition-colors"
          >
            <SpotifyLogo size={16} weight="fill" />
            Spotify
          </button>

          <button
            type="button"
            onClick={() => setModalType('drawing')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-colors"
          >
            <PaintBrush size={16} weight="duotone" />
            Desenhar
          </button>

          <span className="text-[11px] font-mono text-purple-300/70 ml-2">
            {items.length}/{planInfo.limit} itens ({planInfo.plan})
          </span>
        </div>
      </div>

      {/* ÁREA DO MURAL LIVRE (CANVAS ARRASTÁVEL) */}
      <div className="relative w-full min-h-[640px] rounded-3xl border border-white/10 bg-[#100B1D] overflow-hidden p-6 shadow-2xl">
        {/* Padrão de bolinhas / grid sutil do mural */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-purple-300">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500 mb-2" />
            <p className="text-xs">Carregando memórias do mural...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center relative z-10">
            <MaryCupidAvatar state="explaining" size={80} className="mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">O mural de vocês está em branco!</h3>
            <p className="text-xs text-purple-200/70 max-w-sm mb-4">
              Colem notas adesivas, suas músicas favoritas do Spotify, fotos polaroids ou façam desenhos à mão livre um para o outro!
            </p>
            <button
              type="button"
              onClick={() => setModalType('note')}
              className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all"
            >
              Colar Primeira Nota ✨
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full min-h-[600px]">
            {items.map((item) => (
              <motion.div
                key={item.id}
                drag
                dragMomentum={false}
                initial={{ x: item.x, y: item.y }}
                onDragEnd={(e, info) => {
                  const newX = Math.round(item.x + info.offset.x);
                  const newY = Math.round(item.y + info.offset.y);
                  handleUpdatePosition(item.id, newX, newY);
                }}
                className="absolute cursor-grab active:cursor-grabbing select-none group"
                style={{ zIndex: item.zIndex }}
              >
                {/* BOTÃO EXCLUIR ITEM */}
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="absolute -top-2 -right-2 z-20 p-1.5 rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  title="Remover do mural"
                >
                  <Trash size={12} weight="bold" />
                </button>

                {/* 1. NOTA ADESIVA (POST-IT) */}
                {item.itemType === 'note' && (
                  <div
                    className="p-4 rounded-xl shadow-xl border border-black/10 text-gray-900 font-caveat text-xl leading-relaxed relative"
                    style={{
                      backgroundColor: item.payload?.color || '#FEF08A',
                      width: item.width || 220,
                      minHeight: 140
                    }}
                  >
                    <div className="w-8 h-3 bg-white/40 rounded-sm absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-xs" />
                    {item.payload?.text}
                  </div>
                )}

                {/* 2. POLAROID DE FOTO */}
                {item.itemType === 'photo' && (
                  <div
                    className="p-3 bg-white text-gray-900 rounded-sm shadow-2xl border border-black/10"
                    style={{ width: item.width || 220 }}
                  >
                    <div className="w-full h-44 bg-gray-100 overflow-hidden mb-2">
                      <img
                        src={item.payload?.url}
                        alt="Polaroid"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>
                    {item.payload?.caption && (
                      <p className="text-center font-caveat text-base text-gray-800 leading-tight">
                        {item.payload.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* 3. PLAYER SPOTIFY */}
                {item.itemType === 'spotify' && (
                  <div
                    className="rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/30 bg-black"
                    style={{ width: item.width || 300, height: 152 }}
                  >
                    <iframe
                      src={item.payload?.embedUrl}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-2xl"
                    />
                  </div>
                )}

                {/* 4. DESENHO À MÃO LIVRE */}
                {item.itemType === 'drawing' && (
                  <div
                    className="rounded-2xl p-2 bg-black/40 border border-white/10 shadow-2xl backdrop-blur-xs"
                    style={{ width: item.width || 260 }}
                  >
                    <img
                      src={item.payload?.image}
                      alt="Desenho do amor"
                      className="w-full h-auto pointer-events-none drop-shadow-md"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL ADICIONAR POST-IT */}
      <AnimatePresence>
        {modalType === 'note' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm p-6 rounded-3xl bg-[#160E25] border border-pink-500/30 text-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-purple-300"
              >
                <X size={18} />
              </button>

              <h3 className="text-base font-bold text-white mb-3 font-display">
                Novo Post-it para o Mural ✨
              </h3>

              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escreva um recado carinhoso, lembrete fofo ou declaração..."
                className="w-full p-3 rounded-2xl bg-black/40 border border-white/10 text-sm text-white placeholder-purple-300/40 outline-none focus:border-pink-500 mb-3"
              />

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-purple-200">Cor do papel:</span>
                {POSTIT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNoteColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${noteColor === c ? 'scale-125 border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={!noteText.trim() || savingItem}
                onClick={() => handleCreateItem('note', { text: noteText.trim(), color: noteColor })}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                Fixar Post-it no Mural
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ADICIONAR SPOTIFY */}
      <AnimatePresence>
        {modalType === 'spotify' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm p-6 rounded-3xl bg-[#160E25] border border-emerald-500/30 text-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-purple-300"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 text-emerald-400 mb-3">
                <SpotifyLogo size={24} weight="fill" />
                <h3 className="text-base font-bold text-white font-display">
                  Tocar Música no Mural
                </h3>
              </div>

              <p className="text-xs text-purple-200/80 mb-3">
                Cole o link de uma música, álbum ou playlist do Spotify para ouvir juntos no mural:
              </p>

              <input
                type="text"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-purple-300/40 outline-none focus:border-emerald-500 mb-4"
              />

              <button
                type="button"
                disabled={!formatSpotifyEmbed(spotifyUrl) || savingItem}
                onClick={() => {
                  const embed = formatSpotifyEmbed(spotifyUrl);
                  if (embed) handleCreateItem('spotify', { embedUrl: embed }, 300, 152);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                Fixar Player no Mural 🎵
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ADICIONAR POLAROID */}
      <AnimatePresence>
        {modalType === 'photo' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm p-6 rounded-3xl bg-[#160E25] border border-pink-500/30 text-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-purple-300"
              >
                <X size={18} />
              </button>

              <h3 className="text-base font-bold text-white mb-3 font-display">
                Adicionar Foto Polaroid 📸
              </h3>

              <div className="space-y-3 mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => setPhotoUrl(event.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-purple-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-pink-500/20 file:text-pink-300 file:font-semibold hover:file:bg-pink-500/30"
                />

                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Legenda da polaroid (ex: Nosso dia perfeito)..."
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-purple-300/40 outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="button"
                disabled={!photoUrl || savingItem}
                onClick={() => handleCreateItem('photo', { url: photoUrl, caption: photoCaption }, 220, 240)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                Colar Polaroid no Mural
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DESENHO À MÃO LIVRE */}
      <AnimatePresence>
        {modalType === 'drawing' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm p-6 rounded-3xl bg-[#160E25] border border-purple-500/30 text-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-purple-300"
              >
                <X size={18} />
              </button>

              <h3 className="text-base font-bold text-white mb-2 font-display">
                Desenhe com Carinho 🎨
              </h3>

              <div className="border border-white/20 rounded-2xl overflow-hidden mb-3 bg-[#0B0614]">
                <canvas
                  ref={drawCanvasRef}
                  width={320}
                  height={220}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair w-full h-[220px] touch-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-1.5">
                  {['#F43F5E', '#FBBF24', '#38BDF8', '#34D399', '#FFFFFF'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setDrawColor(color)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${drawColor === color ? 'scale-125 border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const canvas = drawCanvasRef.current;
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                  }}
                  className="text-xs text-purple-300 hover:text-white"
                >
                  Limpar
                </button>
              </div>

              <button
                type="button"
                disabled={savingItem}
                onClick={saveDrawing}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                Colar Desenho no Mural ✨
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
