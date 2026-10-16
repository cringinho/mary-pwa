import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle, X, Heart } from '@phosphor-icons/react';
import MaryCupidAvatar from './MaryCupidAvatar';

export default function MaryHelpTrigger({ onOpenTour }) {
  const [showBubble, setShowBubble] = useState(false);

  const tips = [
    "Dica da Mary: Vocês podem arrastar memórias no Grafo para criar sua própria constelação! ✨",
    "Já registrou seu sentimento de hoje no Céu Estelar? O dia atual fica brilhando no topo! 🌟",
    "No Diário Literário, ativem o Modo Wattpad para escrever cartas longas sem distrações! 📖",
    "Que tal desafiar seu amor com uma rodada de 'Prefiro ou Não Gosto' nos Minigames? 🎮"
  ];

  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            className="mb-2 p-3.5 max-w-xs rounded-2xl bg-[#1A122E]/95 border border-pink-500/30 text-white shadow-xl pointer-events-auto backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-pink-300 flex items-center gap-1">
                <Heart size={12} weight="fill" /> Dica da Mary
              </span>
              <button
                type="button"
                onClick={() => setShowBubble(false)}
                className="text-purple-300 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-purple-100/90 leading-relaxed mb-3">
              {randomTip}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowBubble(false);
                onOpenTour();
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/30 text-xs font-medium transition-colors text-center"
            >
              Rever Tour & Código de Casal
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setShowBubble(prev => !prev)}
        className="pointer-events-auto p-1.5 rounded-full bg-gradient-to-tr from-pink-950/80 via-[#221338]/90 to-amber-950/80 border border-pink-500/40 shadow-xl shadow-pink-500/20 hover:border-pink-400 transition-all group"
        title="Ajuda e Dicas da Mary"
      >
        <MaryCupidAvatar state="welcoming" size={48} />
      </motion.button>
    </div>
  );
}
