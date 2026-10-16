import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShareNetwork, 
  DownloadSimple, 
  WhatsappLogo, 
  InstagramLogo, 
  Sparkle, 
  Heart, 
  CalendarHeart,
  Crown
} from '@phosphor-icons/react';
import { toPng } from 'html-to-image';
import MaryCupidAvatar from './mary/MaryCupidAvatar';

export default function SocialShareWrapperModal({ 
  isOpen, 
  onClose, 
  coupleData, 
  compatibility,
  timeTogether,
  favoritePhoto
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('streak'); // 'streak' | 'compat' | 'feelings' | 'polaroid'
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef(null);

  if (!isOpen) return null;

  const coupleName = coupleData?.coupleName || 'Nosso Universo';
  const meName = coupleData?.me?.nickname || coupleData?.me?.displayName || 'Amor A';
  const partnerName = coupleData?.partner?.nickname || coupleData?.partner?.displayName || 'Amor B';
  const meZodiac = coupleData?.me?.zodiacSign || 'aries';
  const partnerZodiac = coupleData?.partner?.zodiacSign || 'scorpio';
  const days = timeTogether?.days || 250;

  // Baixar Imagem HD
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `nosso-universo-${selectedTemplate}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.warn('Erro ao gerar imagem:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Compartilhar via Web Share API
  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'nosso-universo.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Nosso Universo',
          text: `Olha só o nosso momento no Nosso Universo! 💕 mary.pyxie.com.br`
        });
      } else {
        // Fallback para download se Web Share com arquivo não for suportado
        handleDownload();
      }
    } catch (e) {
      console.warn('Erro no compartilhamento:', e);
      handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-card w-full max-w-lg rounded-3xl p-5 sm:p-6 border border-white/15 bg-slate-950/95 shadow-2xl relative my-auto"
        >
          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-1 text-amber-300">
            <Sparkle size={16} weight="fill" />
            <span className="text-xs font-bold uppercase tracking-wider">Social Wrappers HD</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white mb-4">
            Compartilhe Seu Amor nos Stories
          </h2>

          {/* Seletor de Templates */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedTemplate('streak')}
              className={`py-2 px-2 rounded-xl border text-center transition-all ${
                selectedTemplate === 'streak'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              Signos & Tempo
            </button>
            <button
              type="button"
              onClick={() => setSelectedTemplate('compat')}
              className={`py-2 px-2 rounded-xl border text-center transition-all ${
                selectedTemplate === 'compat'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              Sintonia Jogos
            </button>
            <button
              type="button"
              onClick={() => setSelectedTemplate('polaroid')}
              className={`py-2 px-2 rounded-xl border text-center transition-all ${
                selectedTemplate === 'polaroid'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              Polaroid Amor
            </button>
          </div>

          {/* Card Vertical Proporção 9:16 para Preview e Exportação */}
          <div className="flex justify-center my-3">
            <div
              ref={cardRef}
              className="w-[300px] h-[480px] rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between text-white shadow-2xl border border-white/15"
              style={{
                background: 'linear-gradient(135deg, #0e091b 0%, #200f2e 45%, #08040f 100%)'
              }}
            >
              {/* Luzes cósmicas de fundo */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-44 h-44 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

              {/* Topo do Card */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Heart size={16} weight="fill" className="text-rose-400" />
                  <span className="text-xs font-bold tracking-wider text-rose-200">
                    {coupleName}
                  </span>
                </div>
                <div className="w-9 h-9">
                  <MaryCupidAvatar state="love" size={36} interactive={false} />
                </div>
              </div>

              {/* Centro de acordo com o Template */}
              <div className="relative z-10 my-auto text-center flex flex-col items-center">
                {selectedTemplate === 'streak' && (
                  <div className="space-y-3">
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300 font-display">
                      {days} Dias
                    </div>
                    <p className="text-xs text-rose-200/80 font-medium">
                      Juntos construindo o nosso próprio universo!
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-bold">
                      <span className="capitalize">{meName}</span>
                      <span className="text-rose-400">❤️</span>
                      <span className="capitalize">{partnerName}</span>
                    </div>
                  </div>
                )}

                {selectedTemplate === 'compat' && (
                  <div className="space-y-3">
                    <span className="text-[11px] uppercase tracking-wider text-amber-300 font-bold block">
                      Sintonia Oficial do Casal
                    </span>
                    <div className="text-5xl font-black text-rose-400 font-display">
                      {compatibility?.overallCompatibility || 94}%
                    </div>
                    <p className="text-xs text-slate-300 max-w-[200px] leading-relaxed">
                      Provamos que nossas afinidades foram escritas nas estrelas!
                    </p>
                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-amber-200 font-medium">
                      1.000 Questões de Sintonia ✨
                    </div>
                  </div>
                )}

                {selectedTemplate === 'polaroid' && (
                  <div className="w-full flex flex-col items-center">
                    <div className="bg-white p-3 pb-8 rounded-2xl shadow-xl w-48 rotate-[-2deg]">
                      <div className="w-full h-36 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                        {favoritePhoto ? (
                          <img src={favoritePhoto} alt="Momento do Casal" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-16 h-16">
                            <MaryCupidAvatar state="excited" size={64} interactive={false} />
                          </div>
                        )}
                      </div>
                      <p className="text-slate-900 text-[10px] font-serif font-bold text-center mt-3">
                        Nosso amor infinito ❤️
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé do Card */}
              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>mary.pyxie.com.br</span>
                <span>#NossoUniverso</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleShare}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <InstagramLogo size={18} weight="bold" />
              <span>Stories / Whats</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownload}
              className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
            >
              <DownloadSimple size={18} weight="bold" />
              <span>Baixar HD</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
