import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkle, Trophy, VideoCamera, UsersThree, ShareNetwork,
  CheckCircle, ArrowSquareOut, Copy, Crown, Heart, Gift
} from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import MaryCupidAvatar from './mary/MaryCupidAvatar';
import TrendVideoGenerator from './TrendVideoGenerator';

export default function RewardsAndTrendsView({ coupleData, onOpenPricing }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    cupidCrystals: 50,
    referralCode: 'AMOR26',
    planTier: 'freemium',
    missions: [],
    submissions: []
  });

  const [copiedReferral, setCopiedReferral] = useState(false);
  const [socialUrl, setSocialUrl] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('tiktok');
  const [isVideoGenOpen, setIsVideoGenOpen] = useState(false);
  const [submittingLink, setSubmittingLink] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  async function loadCatalog() {
    try {
      setLoading(true);
      const res = await fetch('/api/rewards/catalog');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Erro ao carregar recompensas:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimMission(missionId) {
    try {
      const res = await fetch('/api/rewards/claim-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId })
      });
      if (res.ok) {
        const result = await res.json();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setFeedback({ type: 'success', message: result.message });
        loadCatalog();
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Falha ao resgatar recompensa' });
    }
  }

  async function handleSubmitSocialVideo(e) {
    e.preventDefault();
    if (!socialUrl) return;
    try {
      setSubmittingLink(true);
      const res = await fetch('/api/rewards/submit-social-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: socialPlatform, postUrl: socialUrl })
      });
      if (res.ok) {
        const result = await res.json();
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
        setFeedback({ type: 'success', message: result.message });
        setSocialUrl('');
        loadCatalog();
      } else {
        const err = await res.json();
        setFeedback({ type: 'error', message: err.error || 'Erro ao enviar link' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao validar postagem' });
    } finally {
      setSubmittingLink(false);
    }
  }

  function handleCopyReferral() {
    navigator.clipboard?.writeText(data.referralCode);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BANNER PRINCIPAL COM A MASCOTE MARY */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-pink-500/20 shadow-2xl relative overflow-hidden bg-gradient-to-br from-purple-950/40 via-pink-950/30 to-slate-900/80">
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <MaryCupidAvatar expression="excited" size="lg" />

          <div className="text-center sm:text-left flex-1 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold">
              <Trophy weight="fill" className="w-3.5 h-3.5" />
              <span>Central de Recompensas & Trends</span>
            </div>

            <h2 className="text-2xl font-bold font-display text-white">
              Cresça e Ganhe Dias VIP com a Mary! ✨
            </h2>
            <p className="text-xs text-gray-300 font-sans max-w-xl">
              Compartilhe seus momentos, crie vídeos curtos para as redes sociais com seus resultados dos Minigames e convide casais amigos para liberar benefícios exclusivos!
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setIsVideoGenOpen(true)}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
              >
                <VideoCamera weight="bold" className="w-4 h-4" />
                <span>Criar Vídeo de Casal 9:16 (TikTok/Reels)</span>
              </button>
            </div>
          </div>

          {/* Saldo de Cristais */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center shrink-0 min-w-[130px]">
            <div className="flex items-center justify-center gap-1.5 text-pink-400 mb-1">
              <Sparkle weight="fill" className="w-5 h-5 animate-pulse" />
              <span className="text-2xl font-black font-mono text-white">{data.cupidCrystals}</span>
            </div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Cristais de Cupido</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold text-center ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* GRADE DE MISSÕES E REFERRAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: MISSÕES DIÁRIAS & SHARE-TO-EARN */}
        <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <Gift weight="duotone" className="w-5 h-5 text-pink-400" />
              <span>Missões de Afeto</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
              SHARE-TO-EARN
            </span>
          </div>

          <div className="space-y-3">
            {data.missions.map((mission) => (
              <div
                key={mission.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                    <Sparkle weight="bold" className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-display">{mission.title}</h4>
                    <p className="text-[11px] text-gray-400 font-sans">{mission.description}</p>
                    <span className="text-[10px] font-semibold text-pink-300 font-mono mt-0.5 inline-block">
                      +{mission.rewardAmount} {mission.rewardType === 'crystals' ? 'Cristais' : 'Dias VIP'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleClaimMission(mission.id)}
                  className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-[11px] shrink-0 active:scale-95 transition-all shadow-md"
                >
                  Resgatar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 2: CONVITE DE CASAL AMIGO (REFERRAL) */}
        <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <UsersThree weight="duotone" className="w-5 h-5 text-purple-400" />
                <span>Indicação de Casais</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                +15 DIAS GRÁTIS
              </span>
            </div>

            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              Indique um casal de amigos para criar seu próprio Universo! Quando eles se cadastrarem com seu código, <strong>ambos os casais ganham 15 dias de Plano Romance sem anúncios</strong>.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
              <div>
                <p className="text-[9px] uppercase font-bold text-purple-300 tracking-wider">Seu Código de Indicação</p>
                <p className="text-lg font-black font-mono text-white tracking-widest">{data.referralCode}</p>
              </div>

              <button
                onClick={handleCopyReferral}
                className="py-2 px-3.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Copy weight="bold" className="w-3.5 h-3.5" />
                <span>{copiedReferral ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* CARD 3: VALIDAÇÃO DE VÍDEO VIRAL */}
          <form onSubmit={handleSubmitSocialVideo} className="pt-3 border-t border-white/10 space-y-2">
            <label className="block text-[11px] font-bold text-gray-300">
              Postou um vídeo no TikTok, Reels ou Shorts? Cole o link para ganhar +7 dias VIP:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@casal/video/..."
                className="flex-1 px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                disabled={submittingLink || !socialUrl}
                className="py-2 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs disabled:opacity-50 shrink-0"
              >
                {submittingLink ? 'Validando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL DO GERADOR DE VÍDEOS DE TRENDS (MEDIARECORDER 9:16) */}
      {isVideoGenOpen && (
        <TrendVideoGenerator
          isOpen={isVideoGenOpen}
          onClose={() => setIsVideoGenOpen(false)}
          coupleData={coupleData}
        />
      )}
    </div>
  );
}

