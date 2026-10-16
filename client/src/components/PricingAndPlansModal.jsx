import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Crown, 
  Sparkle, 
  Heart, 
  GameController, 
  Planet, 
  SquareHalf, 
  NavigationArrow, 
  CloudArrowUp,
  Confetti
} from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import MaryCupidAvatar from './mary/MaryCupidAvatar';

export default function PricingAndPlansModal({ isOpen, onClose, currentPlan = 'freemium', onPlanUpgraded }) {
  const [cycle, setCycle] = useState('annual'); // 'monthly' | 'annual'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  const handleSelectPlan = async (targetTier) => {
    if (targetTier === currentPlan) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTier, cycle })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(data.message);
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 }
        });
        onPlanUpgraded?.(data.planTier);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 2200);
      }
    } catch (e) {
      console.warn('Erro ao atualizar plano:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const plans = [
    {
      id: 'freemium',
      name: 'Gratuito',
      tagline: 'O essencial para começar a história',
      monthlyPrice: 'R$ 0',
      annualPrice: 'R$ 0',
      features: [
        'Editor de Relatos com fotos básicas',
        'Até 10 itens no Mural do Casal',
        'Últimos 14 dias no Céu Estelar',
        '5 rodadas por dia nos Minigames',
        'Distância entre o casal em km',
        'Contém anúncios sutis'
      ],
      isPopular: false,
      btnText: 'Plano Atual',
      disabled: currentPlan === 'freemium'
    },
    {
      id: 'romance',
      name: 'Romance',
      tagline: 'Para casais que querem viver sem limites',
      monthlyPrice: 'R$ 12,90/mês',
      annualPrice: 'R$ 109,90/ano (R$ 9,15/mês)',
      discount: '29% OFF',
      features: [
        'Zero Anúncios para os dois',
        'Acesso Ilimitado às 1.000 questões de jogos',
        'Histórico Anual do Céu de Sentimentos',
        'Até 50 itens no Mural (fotos e Spotify)',
        'Backup automático diário no Google Drive',
        'Wrappers HD para Instagram Stories'
      ],
      isPopular: true,
      btnText: currentPlan === 'romance' ? 'Plano Ativo' : 'Escolher Romance',
      disabled: currentPlan === 'romance'
    },
    {
      id: 'almas_gemeas',
      name: 'Almas Gêmeas VIP',
      tagline: 'A experiência máxima e definitiva de amor',
      monthlyPrice: 'R$ 24,90/mês',
      annualPrice: 'R$ 199,90/ano (R$ 16,65/mês)',
      discount: '33% OFF',
      features: [
        'Tudo do Plano Romance incluído',
        'Criar Perguntas Próprias nos Minigames',
        'Mural Infinito com Spotify, Vídeos e Desenhos',
        'Rastreio em Tempo Real com alertas de bateria',
        'Todos os Temas Imersivos animados liberados',
        'Widgets de Tela Inicial exclusivos',
        'Selo Dourado VIP do Casal'
      ],
      isPopular: false,
      btnText: currentPlan === 'almas_gemeas' ? 'Plano VIP Ativo' : 'Ser Alma Gêmea VIP',
      disabled: currentPlan === 'almas_gemeas'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-card w-full max-w-4xl rounded-3xl p-5 sm:p-8 border border-white/15 bg-slate-950/95 shadow-2xl relative my-auto"
        >
          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Header com Mary */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left mb-6">
            <div className="w-16 h-16 shrink-0">
              <MaryCupidAvatar state="excited" size={64} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold mb-1">
                <Crown size={14} weight="fill" />
                <span>1 Assinatura Libera Para os 2 Parceiros</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Escolham o Plano do Seu Universo
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Sem cobranças duplicadas: você assina e seu amor ganha todos os mesmos benefícios instantaneamente!
              </p>
            </div>
          </div>

          {/* Mensagem de Sucesso */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-center text-xs font-bold"
            >
              {successMessage}
            </motion.div>
          )}

          {/* Alternância Ciclo Mensal / Anual */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="p-1 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCycle('monthly')}
                className={`py-1.5 px-4 rounded-xl transition-all ${
                  cycle === 'monthly'
                    ? 'bg-white/20 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cobrança Mensal
              </button>
              <button
                type="button"
                onClick={() => setCycle('annual')}
                className={`py-1.5 px-4 rounded-xl flex items-center gap-1.5 transition-all ${
                  cycle === 'annual'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Plano Anual</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9px]">
                  33% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Grid de Planos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isSelected = p.id === currentPlan;

              return (
                <div
                  key={p.id}
                  className={`rounded-3xl p-5 border flex flex-col justify-between gap-5 relative transition-all ${
                    p.isPopular
                      ? 'bg-gradient-to-b from-rose-950/40 via-purple-950/30 to-slate-950/80 border-rose-500/40 shadow-xl'
                      : isSelected
                      ? 'bg-white/5 border-amber-400/40'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {p.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-[10px] uppercase tracking-wider shadow">
                      Mais Popular
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-black text-white">{p.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] min-h-[32px] mt-1 leading-snug">
                      {p.tagline}
                    </p>

                    <div className="my-4">
                      <div className="text-2xl font-black text-white font-display">
                        {cycle === 'annual' ? p.annualPrice : p.monthlyPrice}
                      </div>
                      {cycle === 'annual' && p.discount && (
                        <span className="text-[10px] text-amber-300 font-bold block mt-0.5">
                          Economia de {p.discount} no plano anual
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300">
                      {p.features.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check size={14} weight="bold" className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={p.disabled || isSubmitting}
                    onClick={() => handleSelectPlan(p.id)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-white/10 text-slate-400 cursor-default'
                        : p.isPopular
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 text-white shadow-lg'
                        : 'bg-white/15 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {p.btnText}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-center text-slate-400 mt-6">
            Pagamento seguro e transparente. Cancele quando quiser diretamente nas configurações.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
