import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Heart, Sparkle, CalendarHeart } from '@phosphor-icons/react';
import { Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ZODIAC_LABELS_PT } from '../services/zodiacUtils';

export default function CoupleHeader({ onOpenProfile, coupleData: externalCoupleData }) {
  const { user } = useAuth();
  const [internalCoupleData, setInternalCoupleData] = useState(null);
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0 });

  const coupleData = externalCoupleData || internalCoupleData;

  useEffect(() => {
    if (externalCoupleData) return;
    async function loadCouple() {
      try {
        const res = await fetch('/api/couple', { credentials: 'include' });
        if (res.ok) setInternalCoupleData(await res.json());
      } catch (err) {
        console.warn('Erro ao carregar dados do casal:', err);
      }
    }
    loadCouple();
  }, [user?.avatarUrl, user?.nickname, user?.moodStatus, externalCoupleData]);

  useEffect(() => {
    const anniversaryStr = coupleData?.settings?.anniversaryDate || '2026-01-30';
    const startDate = new Date(`${anniversaryStr}T00:00:00`);

    function updateCounter() {
      const diffMs = Math.max(0, Date.now() - startDate.getTime());
      setTimeTogether({
        days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diffMs / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diffMs / (1000 * 60)) % 60)
      });
    }

    updateCounter();
    const interval = setInterval(updateCounter, 60000);
    return () => clearInterval(interval);
  }, [coupleData?.settings?.anniversaryDate]);

  const me = user || {};
  const partner = coupleData?.partner || {
    displayName: 'Seu Amor',
    nickname: 'Parceiro(a)',
    zodiacSign: 'leo',
    avatarUrl: null
  };

  const myInitial = (me.displayName || me.nickname || 'E')[0]?.toUpperCase();
  const partnerInitial = (partner.displayName || partner.nickname || 'P')[0]?.toUpperCase();

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-pink-500/20 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Avatares do Casal */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Meu Avatar */}
          <div
            onClick={onOpenProfile}
            className="relative group cursor-pointer"
            title="Editar meu perfil"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-sky-400 via-pink-400 to-purple-500 shadow-md shadow-pink-500/20">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#18121e] flex items-center justify-center">
                {me.avatarUrl ? (
                  <img src={me.avatarUrl} alt={me.displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold font-serif text-sky-300">{myInitial}</span>
                )}
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-pink-500 text-white shadow-sm border border-[#0b090e]">
              <Settings className="w-2.5 h-2.5" />
            </span>
          </div>

          <motion.div
            animate={{ scale: [1, 1.25, 1, 1.28, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="text-pink-500 px-0.5"
          >
            <Heart weight="fill" className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.div>

          {/* Avatar do Parceiro */}
          <div className="relative" title={partner.displayName}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#18121e] flex items-center justify-center">
                {partner.avatarUrl ? (
                  <img src={partner.avatarUrl} alt={partner.displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold font-serif text-purple-300">{partnerInitial}</span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden xs:block pl-1">
            <div className="flex items-center gap-1.5 font-display font-semibold text-xs sm:text-sm text-white">
              <span className="text-sky-300 inline-flex items-center gap-1">
                <span>{me.nickname || me.displayName}</span>
                {me.zodiacSign && (
                  <Icon
                    icon={`mdi:zodiac-${me.zodiacSign}`}
                    className="w-3.5 h-3.5 text-amber-300"
                    title={ZODIAC_LABELS_PT[me.zodiacSign] || me.zodiacSign}
                  />
                )}
              </span>
              <span className="text-pink-400 font-serif italic text-xs">&</span>
              <span className="text-purple-300 inline-flex items-center gap-1">
                <span>{partner.nickname || partner.displayName}</span>
                {partner.zodiacSign && (
                  <Icon
                    icon={`mdi:zodiac-${partner.zodiacSign}`}
                    className="w-3.5 h-3.5 text-amber-300"
                    title={ZODIAC_LABELS_PT[partner.zodiacSign] || partner.zodiacSign}
                  />
                )}
              </span>
            </div>
            <div className="text-[10px] text-pink-300/70 flex items-center gap-1">
              <Sparkle weight="fill" className="w-2.5 h-2.5 text-pink-400" />
              <span>{coupleData?.settings?.coupleName || 'Nosso Universo Privado'}</span>
              {coupleData?.settings?.inviteCode && !coupleData?.partner && (
                <span className="ml-1 px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-200 font-mono text-[9px]">
                  Código: {coupleData.settings.inviteCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contador de Tempo */}
        <div className="flex items-center gap-2 bg-white/5 px-2.5 sm:px-3 py-1.5 rounded-2xl border border-white/10 shadow-sm">
          <CalendarHeart weight="duotone" className="w-4 h-4 text-pink-400 shrink-0" />
          <div className="text-right">
            <div className="text-xs font-bold font-display text-white">
              {timeTogether.days}d {timeTogether.hours}h {timeTogether.minutes}m
            </div>
            <div className="text-[9px] text-pink-200/60 uppercase tracking-wider">
              Juntos no Tempo
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
