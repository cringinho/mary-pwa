import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MaryCupidAvatar
 * Componente Visual da Mascote e Guardiã Oficial do Aplicativo: Anjinha Cupido Mary
 * Renderiza as ilustrações originais oficiais das 5 expressões com auréola e animações suaves
 * Expressões suportadas: 'welcoming' | 'explaining' | 'excited' | 'love' | 'sleeping'
 */
const MARY_ASSETS = {
  welcoming: '/assets/mary/mary-welcoming.webp',
  explaining: '/assets/mary/mary-explaining.webp',
  excited: '/assets/mary/mary-excited.webp',
  love: '/assets/mary/mary-love.webp',
  sleeping: '/assets/mary/mary-sleeping.webp'
};

export default function MaryCupidAvatar({ 
  state = 'welcoming', 
  size = 120, 
  className = '', 
  interactive = true,
  onClick
}) {
  const [tapEffect, setTapEffect] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const imageSrc = MARY_ASSETS[state] || MARY_ASSETS.welcoming;

  // Animação de flutuação suave e respiração da Mary
  const floatAnimation = state === 'sleeping' 
    ? { y: [-2, 2, -2], rotate: [-1, 1, -1] }
    : { y: [-4, 3, -4], rotate: [-1.5, 1.5, -1.5] };

  const floatTransition = {
    duration: state === 'sleeping' ? 3.5 : 2.6,
    repeat: Infinity,
    ease: 'easeInOut'
  };

  // Reação fofa ao toque / clique
  const handleInteraction = (e) => {
    if (!interactive) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([25]);
    }

    setTapEffect(true);
    setTimeout(() => setTapEffect(false), 600);

    // Gerar mini coração flutuante
    const heartId = Date.now();
    setFloatingHearts(prev => [...prev.slice(-3), { id: heartId, x: (Math.random() - 0.5) * 30 }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
    }, 1200);

    onClick?.(e);
  };

  return (
    <div
      onClick={handleInteraction}
      className={`relative inline-flex items-center justify-center select-none ${interactive ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 1. Halo Celestial Duplo (Aura de Luz Mágica) */}
      <motion.div
        animate={{
          scale: [0.94, 1.08, 0.94],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-500/30 via-amber-300/25 to-pink-400/25 blur-lg pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1.02, 0.96, 1.02],
          opacity: [0.25, 0.5, 0.25]
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -inset-1 rounded-full bg-gradient-to-b from-amber-300/20 via-transparent to-pink-500/20 blur-md pointer-events-none"
      />

      {/* 2. Mini Estrelinhas Cintilantes ao Redor da Auréola */}
      {state !== 'sleeping' && (
        <>
          <motion.span
            animate={{
              scale: [0.6, 1.2, 0.6],
              opacity: [0.3, 0.9, 0.3],
              y: [-2, 2, -2]
            }}
            transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-1 right-2 text-amber-300 text-xs pointer-events-none drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
          >
            ✦
          </motion.span>
          <motion.span
            animate={{
              scale: [1, 0.5, 1],
              opacity: [0.8, 0.2, 0.8],
              y: [1, -2, 1]
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute top-2 -left-1 text-pink-300 text-[10px] pointer-events-none drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]"
          >
            ★
          </motion.span>
        </>
      )}

      {/* 3. Mini Corações Flutuantes ao Tocar */}
      {floatingHearts.map((h) => (
        <motion.span
          key={h.id}
          initial={{ opacity: 1, y: 0, scale: 0.6, x: h.x }}
          animate={{ opacity: 0, y: -45, scale: 1.3 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="absolute -top-3 text-rose-400 text-sm pointer-events-none drop-shadow-md z-30"
        >
          💖
        </motion.span>
      ))}

      {/* 4. Ilustração Oficial com Transição Suave e Física de Salto */}
      <motion.div
        animate={tapEffect ? { scale: [1, 1.15, 0.98, 1], y: [-6, 2, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="w-full h-full relative z-10 flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={state}
            src={imageSrc}
            alt={`Anjinha Cupido Mary (${state})`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)] drop-shadow-[0_0_12px_rgba(251,191,36,0.22)]"
            style={{ imageRendering: 'auto' }}
          />
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
