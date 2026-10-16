import React from 'react';
import { motion } from 'framer-motion';

/**
 * MaryCupidAvatar
 * Componente Visual da Mascote e Guardiã Oficial do Aplicativo: Anjinha Cupido Mary
 * Renderiza as ilustrações originais oficiais das 5 expressões com auréola e animações suaves
 * Expressões suportadas: 'welcoming' | 'explaining' | 'excited' | 'love' | 'sleeping'
 */
const MARY_ASSETS = {
  welcoming: '/assets/mary/mary-welcoming.png',
  explaining: '/assets/mary/mary-explaining.png',
  excited: '/assets/mary/mary-excited.png',
  love: '/assets/mary/mary-love.png',
  sleeping: '/assets/mary/mary-sleeping.png'
};

export default function MaryCupidAvatar({ state = 'welcoming', size = 120, className = '' }) {
  const imageSrc = MARY_ASSETS[state] || MARY_ASSETS.welcoming;

  // Animação de flutuação suave e respiração da Mary
  const floatAnimation = state === 'sleeping' 
    ? { y: [-2, 2, -2], rotate: [-1, 1, -1] }
    : { y: [-4, 3, -4], rotate: [-2, 2, -2] };

  const floatTransition = {
    duration: state === 'sleeping' ? 3.5 : 2.5,
    repeat: Infinity,
    ease: 'easeInOut'
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Auréola / Brilho etéreo de fundo */}
      <motion.div
        animate={{
          scale: [0.92, 1.08, 0.92],
          opacity: [0.35, 0.6, 0.35]
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-1 rounded-full bg-gradient-to-tr from-pink-500/25 via-amber-400/20 to-rose-500/20 blur-md pointer-events-none"
      />

      {/* Ilustração oficial da Mary animada */}
      <motion.img
        src={imageSrc}
        alt={`Anjinha Cupido Mary (${state})`}
        animate={floatAnimation}
        transition={floatTransition}
        className="w-full h-full object-contain drop-shadow-xl relative z-10 pointer-events-none"
      />
    </div>
  );
}
