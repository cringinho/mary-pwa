import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle, X, Heart } from '@phosphor-icons/react';
import MaryCupidAvatar from './MaryCupidAvatar';

export default function MaryHelpTrigger({ onOpenTour }) {
  const [showBubble, setShowBubble] = useState(false);
  const [avatarMood, setAvatarMood] = useState('welcoming');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = [
    {
      mood: 'love',
      text: "O amor de vocês dois é lindo! Sabia que cada memória salva aqui vira uma estrela eterna? ✨"
    },
    {
      mood: 'excited',
      text: "Dica de ouro: desafie seu amor na aba 'Jogos' para ver a compatibilidade de vocês em 1.000 questões! 🎮"
    },
    {
      mood: 'explaining',
      text: "No Diário Literário, ativem o Modo Wattpad para escrever cartas românticas longas com fotos inline! 📖"
    },
    {
      mood: 'welcoming',
      text: "No Céu Estelar, o sentimento de hoje de vocês fica brilhando lado a lado no topo do universo! 🌟"
    },
    {
      mood: 'excited',
      text: "Vocês podem arrastar memórias e palavras no Grafo para desenhar a constelação da sua história! 🪐"
    }
  ];

  const currentTip = tips[currentTipIndex];

  const handleNextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    setAvatarMood(tips[(currentTipIndex + 1) % tips.length].mood);
  };

  const handleOpenHelp = () => {
    setShowBubble(prev => !prev);
    if (!showBubble) {
      setAvatarMood('excited');
    } else {
      setAvatarMood('welcoming');
    }
  };

  return (
    <div className="fixed bottom-20 right-3.5 sm:right-6 z-40 flex flex-col items-end pointer-events-none">
      
      {/* Balão de Fala Mágico da Mary */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 15, x: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 15, x: 10 }}
            className="mb-2 p-4 w-72 sm:w-80 rounded-3xl bg-[#140D22]/95 border border-pink-500/35 text-white shadow-2xl pointer-events-auto backdrop-blur-xl relative"
          >
            {/* Cabinho do balão apontando para a Mary */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-[#140D22] border-r border-b border-pink-500/35 transform rotate-45" />

            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/10">
              <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                <Heart size={14} weight="fill" className="text-rose-400 animate-pulse" />
                Anjinha Mary diz:
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowBubble(false);
                  setAvatarMood('welcoming');
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-rose-100/90 leading-relaxed mb-3.5 font-medium">
              "{currentTip.text}"
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNextTip}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-rose-200 border border-white/10 text-[11px] font-semibold transition-all active:scale-95"
              >
                Outra Dica ✨
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBubble(false);
                  onOpenTour();
                }}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 text-white text-[11px] font-bold shadow-md transition-all active:scale-95"
              >
                Tour & Código
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão Vivo da Mascote Mary com Nuvenzinha */}
      <motion.div
        className="pointer-events-auto relative flex flex-col items-center group cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleOpenHelp}
        title="Falar com a Anjinha Mary"
      >
        {/* Nuvem etérea suave sob a Mary */}
        <div className="absolute -bottom-1 w-14 h-4 bg-gradient-to-t from-pink-500/20 via-white/10 to-transparent blur-sm rounded-full pointer-events-none" />

        <div className="p-1.5 rounded-full bg-gradient-to-tr from-[#1b0b2b]/90 via-[#2d123d]/90 to-[#12081f]/90 border border-pink-500/40 shadow-[0_4px_20px_rgba(244,63,94,0.3)] group-hover:border-pink-300 transition-all relative">
          <MaryCupidAvatar 
            state={avatarMood} 
            size={56} 
            interactive={false}
          />

          {/* Badge cintilante */}
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-[#12081f] shadow-md animate-bounce">
            ✨
          </span>
        </div>
      </motion.div>

    </div>
  );
}
