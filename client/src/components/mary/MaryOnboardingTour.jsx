import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkle, 
  Copy, 
  Check, 
  WhatsappLogo, 
  BookOpenText, 
  Planet, 
  MapPin, 
  GameController, 
  Crown, 
  ArrowRight, 
  X,
  Heart
} from '@phosphor-icons/react';
import MaryCupidAvatar from './MaryCupidAvatar';

export default function MaryOnboardingTour({ isOpen, onClose, coupleData }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const inviteCode = coupleData?.inviteCode || 'AMOR26';
  const coupleName = coupleData?.coupleName || 'Nosso Universo';

  const copyInvite = () => {
    navigator.clipboard?.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Oie meu amor! 💕 Criei nosso cantinho privado no Nosso Universo. Acesse https://mary.pyxie.com.br e use o nosso código de casal: ${inviteCode} ✨`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const steps = [
    {
      avatarState: 'welcoming',
      badge: 'Bem-vindos ao Nosso Universo! ✨',
      title: `Que alegria ter você aqui, no ${coupleName}!`,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-purple-200/90 leading-relaxed">
            Eu sou a <strong>Mary</strong>, a anjinha cupido guardiã das memórias de vocês. Estou aqui para cuidar de cada capítulo, risada e promessa que vocês construírem juntos!
          </p>
          <div className="p-4 rounded-2xl bg-white/5 border border-pink-500/20 space-y-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-pink-300">
              Código de Pareamento do Casal
            </span>
            <div className="flex items-center justify-between bg-black/40 px-4 py-3 rounded-xl border border-white/10">
              <span className="font-mono text-2xl font-bold tracking-widest text-amber-300">
                {inviteCode}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyInvite}
                  className="p-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/40 text-pink-200 transition-colors"
                  title="Copiar código"
                >
                  {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/30 text-xs font-medium transition-colors"
                >
                  <WhatsappLogo size={16} weight="fill" />
                  Mandar pro Amor
                </button>
              </div>
            </div>
            <p className="text-xs text-purple-300/70">
              Envie este código para o seu par se conectar no mesmo espaço instantaneamente!
            </p>
          </div>
        </div>
      )
    },
    {
      avatarState: 'explaining',
      badge: 'Conheça os Cantinhos Mágicos 🪐',
      title: 'Tudo o que vocês podem viver aqui:',
      content: (
        <div className="space-y-2.5 text-xs text-purple-200/90">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-300 shrink-0">
              <BookOpenText size={20} />
            </div>
            <div>
              <strong className="text-white block text-sm">Diário Literário</strong>
              Escrevam cartas e relatos juntos com fotos inline, modo Wattpad e capítulos.
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
              <Planet size={20} />
            </div>
            <div>
              <strong className="text-white block text-sm">Grafo & Céu de Sentimentos</strong>
              Visualizem a constelação de emoções diárias e as palavras que mais se repetem.
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
              <GameController size={20} />
            </div>
            <div>
              <strong className="text-white block text-sm">Minigames de Compatibilidade</strong>
              1.000 perguntas de "Prefiro/Não Gosto" e "Quem Faria" para testar a sintonia.
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <strong className="text-white block text-sm">Mural Livre & Mapa Ao Vivo</strong>
              Quadro branco para colar Spotify e fotos + presença ao vivo com bateria.
            </div>
          </div>
        </div>
      )
    },
    {
      avatarState: 'excited',
      badge: 'Planos Especiais 💖',
      title: 'Uma assinatura que cuida dos dois!',
      content: (
        <div className="space-y-3">
          <p className="text-xs text-purple-200/90">
            O Nosso Universo possui plano Gratuito completo e dois planos especiais para quem deseja recursos ilimitados:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-950/60 to-purple-950/60 border border-pink-500/30 space-y-1.5">
              <span className="font-bold text-pink-300 flex items-center gap-1">
                <Heart size={14} weight="fill" /> Romance
              </span>
              <p className="text-amber-300 font-bold text-sm">R$ 12,90<span className="text-[10px] text-purple-300/70 font-normal">/mês</span></p>
              <ul className="text-[11px] text-purple-200/80 space-y-1 list-disc list-inside">
                <li>Zero anúncios</li>
                <li>1.000 questões livres</li>
                <li>Céu anual de emoções</li>
                <li>Backup Google Drive</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-950/60 to-purple-950/60 border border-amber-500/30 space-y-1.5">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Crown size={14} weight="fill" /> Almas Gêmeas
              </span>
              <p className="text-amber-300 font-bold text-sm">R$ 24,90<span className="text-[10px] text-purple-300/70 font-normal">/mês</span></p>
              <ul className="text-[11px] text-purple-200/80 space-y-1 list-disc list-inside">
                <li>Tudo do Romance</li>
                <li>Mural Infinito com Spotify</li>
                <li>Criar Perguntas Próprias</li>
                <li>Mapa & Bateria contínuos</li>
              </ul>
            </div>
          </div>
          <p className="text-[11px] text-center text-purple-300/70">
            1 assinatura libera para ambos os parceiros. Vocês podem usar o plano Gratuito pelo tempo que quiserem!
          </p>
        </div>
      )
    }
  ];

  const current = steps[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md p-6 rounded-3xl bg-[#140F22]/95 border border-pink-500/30 shadow-2xl text-white overflow-hidden"
        >
          {/* Luz de fundo */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Botão de Fechar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Cabeçalho com Mascote Anjinha Mary */}
          <div className="flex items-center gap-4 mb-4">
            <MaryCupidAvatar state={current.avatarState} size={84} />
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-[11px] font-medium text-pink-300 mb-1">
                <Sparkle size={12} weight="fill" />
                {current.badge}
              </span>
              <h3 className="text-base font-bold text-white leading-snug">
                {current.title}
              </h3>
            </div>
          </div>

          {/* Conteúdo do Passo */}
          <div className="min-h-[170px] mb-6">
            {current.content}
          </div>

          {/* Indicadores de Passo e Ações */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep ? 'w-6 bg-pink-500' : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-3 py-1.5 text-xs text-purple-300 hover:text-white transition-colors"
                >
                  Voltar
                </button>
              )}
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-semibold shadow-lg shadow-pink-500/25 transition-all"
                >
                  Próximo <ArrowRight size={14} weight="bold" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Começar Nosso Amor ✨
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
