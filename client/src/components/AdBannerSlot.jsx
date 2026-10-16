import React from 'react';
import { Sparkle, Crown } from '@phosphor-icons/react';

export default function AdBannerSlot({ planTier = 'freemium', onUpgradeClick }) {
  // Planos pagos (Romance e Almas Gêmeas) não exibem NENHUM anúncio
  if (planTier === 'romance' || planTier === 'almas_gemeas') {
    return null;
  }

  return (
    <div className="w-full my-3 p-3 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-amber-950/40 border border-pink-500/20 backdrop-blur-md flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300">
          <Sparkle size={16} weight="fill" />
        </div>
        <div>
          <span className="font-bold text-white block text-[11px]">
            Viva o Nosso Universo sem anúncios
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            A partir de R$ 12,90/mês (1 assinatura vale para os dois)
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onUpgradeClick}
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0 shadow-md active:scale-95 transition-all"
      >
        <Crown size={12} weight="fill" />
        <span>Seja VIP</span>
      </button>
    </div>
  );
}
