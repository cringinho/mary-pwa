import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Planet, 
  CalendarBlank, 
  Sparkle, 
  Plus, 
  Heart, 
  Star, 
  Smiley, 
  ChatCircleText, 
  X,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';
import { Loader2 } from 'lucide-react';
import MaryCupidAvatar from './mary/MaryCupidAvatar';

export default function DailyFeelingsSkyView({ coupleData }) {
  const [viewMode, setViewMode] = useState('sky'); // 'sky' | 'calendar'
  const [feelingsData, setFeelingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState(null);

  // Form de registro
  const [selectedMood, setSelectedMood] = useState(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Calendário
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [calendarMap, setCalendarMap] = useState({});

  async function loadFeelings() {
    try {
      setLoading(true);
      const res = await fetch('/api/feelings', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFeelingsData(data);
      }
    } catch (err) {
      console.warn('Erro ao carregar sentimentos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCalendar(yearMonth) {
    try {
      const res = await fetch(`/api/feelings/calendar/${yearMonth}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCalendarMap(data.calendarDays || {});
      }
    } catch (err) {
      console.warn('Erro ao carregar calendário emocional:', err);
    }
  }

  useEffect(() => {
    loadFeelings();
  }, []);

  useEffect(() => {
    if (viewMode === 'calendar') {
      loadCalendar(currentMonth);
    }
  }, [viewMode, currentMonth]);

  async function handleSaveFeeling(e) {
    e.preventDefault();
    if (!selectedMood) return;

    setSaving(true);
    try {
      const res = await fetch('/api/feelings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          moodId: selectedMood.id,
          moodLabel: selectedMood.name,
          moodColor: selectedMood.color || '#F43F5E',
          moodIcon: selectedMood.iconName || 'Heart',
          intensity,
          note: note.trim() || null
        })
      });

      if (res.ok) {
        setIsRegisterOpen(false);
        setNote('');
        await loadFeelings();
        if (viewMode === 'calendar') loadCalendar(currentMonth);
      }
    } catch (err) {
      console.warn('Erro ao salvar sentimento:', err);
    } finally {
      setSaving(false);
    }
  }

  const moodsList = coupleData?.customizations?.moods || [
    { id: 1, name: 'Apaixonado(a)', color: '#F43F5E', iconName: 'Heart' },
    { id: 2, name: 'Radiante', color: '#FBBF24', iconName: 'Sparkle' },
    { id: 3, name: 'Acolhido(a)', color: '#A855F7', iconName: 'HandHeart' },
    { id: 4, name: 'Com Saudade', color: '#EC4899', iconName: 'ChatTeardropText' },
    { id: 5, name: 'Grato(a)', color: '#10B981', iconName: 'HandsClapping' }
  ];

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO CÉU DE SENTIMENTOS */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <MaryCupidAvatar state="love" size={54} />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1">
              <Planet size={14} weight="fill" />
              Constelação Emocional do Casal
            </span>
            <h2 className="text-xl font-bold text-white font-display">
              Céu de Sentimentos Diários
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternador de Modo */}
          <div className="p-1 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('sky')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'sky' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25' : 'text-purple-300 hover:text-white'
              }`}
            >
              <Planet size={15} weight="duotone" />
              Céu de Estrelas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25' : 'text-purple-300 hover:text-white'
              }`}
            >
              <CalendarBlank size={15} weight="duotone" />
              Calendário Mensal
            </button>
          </div>

          {/* Botão Registrar Sentimento de Hoje */}
          <button
            type="button"
            onClick={() => {
              setSelectedMood(moodsList[0]);
              setIsRegisterOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold shadow-lg shadow-pink-500/25 transition-all shrink-0"
          >
            <Plus size={15} weight="bold" />
            <span className="hidden sm:inline">Sentimento de Hoje</span>
            <span className="sm:hidden">Hoje</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-purple-300">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mb-2" />
          <p className="text-xs">Alinhando as estrelas do seu amor...</p>
        </div>
      ) : viewMode === 'sky' ? (
        /* ========================================================================= */
        /* VISUALIZAÇÃO 1: CÉU DE ESTRELAS COM DESCIDA CÓSMICA TEMPORAL              */
        /* ========================================================================= */
        <div className="relative w-full rounded-3xl border border-indigo-500/30 bg-[#070512] overflow-hidden p-6 sm:p-10 shadow-2xl min-h-[580px]">
          {/* Fundo Estelar Cósmico */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-950/40 via-[#0A0718] to-[#040209] pointer-events-none" />

          {/* Partículas sutis de estrelas estáticas */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* 1. SEÇÃO DO TOPO: O DIA DE HOJE (ALINHADO LADO A LADO COM FEIXE DE LUZ) */}
          <div className="relative z-10 mb-14 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-xs font-bold text-pink-300 mb-4">
              <Sparkle size={13} weight="fill" />
              Sintonia de Hoje • {feelingsData?.todayDate?.split('-').reverse().join('/')}
            </span>

            {feelingsData?.todayFeelings?.length === 0 ? (
              <div className="p-6 max-w-sm mx-auto rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
                <MaryCupidAvatar state="explaining" size={64} className="mx-auto mb-2" />
                <p className="text-xs text-purple-200/80 mb-3">
                  Nenhum dos dois registrou o sentimento de hoje ainda. Que tal ser o primeiro a iluminar o céu hoje?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMood(moodsList[0]);
                    setIsRegisterOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all"
                >
                  Registrar Agora ✨
                </button>
              </div>
            ) : (
              <div className="relative max-w-md mx-auto flex items-center justify-around py-4">
                {/* Feixe de Luz Estelar unindo os dois */}
                <div className="absolute top-1/2 left-16 right-16 h-1 bg-gradient-to-r from-pink-500 via-amber-300 to-indigo-400 blur-[1px] animate-pulse -translate-y-1/2 pointer-events-none" />

                {feelingsData.todayFeelings.map((feeling) => (
                  <motion.div
                    key={feeling.id}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedFeeling(feeling)}
                    className="relative z-10 flex flex-col items-center cursor-pointer group"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all border-2 border-white/40"
                      style={{
                        backgroundColor: feeling.moodColor,
                        boxShadow: `0 0 28px ${feeling.moodColor}88`
                      }}
                    >
                      <Heart size={28} weight="fill" className="text-white drop-shadow" />
                    </div>
                    <span className="mt-2 text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                      {feeling.user?.nickname || feeling.user?.displayName}
                    </span>
                    <span className="text-[11px] text-purple-300/80 font-medium">
                      {feeling.moodLabel} ({feeling.intensity}★)
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 2. SEÇÃO DE BAIXO: DESCIDA CÓSMICA DOS DIAS ANTERIORES */}
          <div className="relative z-10 space-y-6">
            <h4 className="text-xs uppercase tracking-widest font-bold text-purple-300/60 text-center border-t border-white/10 pt-6">
              Descida Cósmica • Histórico de Emoções
            </h4>

            {feelingsData?.pastFeelings?.length === 0 ? (
              <p className="text-xs text-center text-purple-300/60 py-8">
                As estrelas dos próximos dias descerão aqui formando a constelação eterna de vocês! ✨
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {feelingsData.pastFeelings.map((feeling, idx) => (
                  <motion.div
                    key={feeling.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedFeeling(feeling)}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all backdrop-blur-sm flex items-center gap-3 group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                      style={{
                        backgroundColor: feeling.moodColor,
                        boxShadow: `0 0 14px ${feeling.moodColor}55`
                      }}
                    >
                      <Star size={20} weight="fill" className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-purple-300/70 block">
                        {feeling.feelingDate.split('-').reverse().join('/')}
                      </span>
                      <strong className="text-xs text-white block truncate group-hover:text-pink-300 transition-colors">
                        {feeling.moodLabel}
                      </strong>
                      <span className="text-[10px] text-purple-200/60 truncate block">
                        {feeling.user?.nickname || feeling.user?.displayName}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VISUALIZAÇÃO 2: CALENDÁRIO EMOCIONAL BICOLOR                             */
        /* ========================================================================= */
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-pink-500/20 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-display">
              Grade do Mês • {currentMonth}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const [y, m] = currentMonth.split('-').map(Number);
                  const prev = new Date(y, m - 2, 1);
                  setCurrentMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <CaretLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const [y, m] = currentMonth.split('-').map(Number);
                  const next = new Date(y, m, 1);
                  setCurrentMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <CaretRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <span key={d} className="text-[11px] font-bold text-purple-300/70 uppercase">
                {d}
              </span>
            ))}

            {Array.from({ length: 31 }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentMonth}-${String(dayNum).padStart(2, '0')}`;
              const dayFeelings = calendarMap[dateStr] || [];

              const color1 = dayFeelings[0]?.moodColor || 'transparent';
              const color2 = dayFeelings[1]?.moodColor || color1;

              return (
                <div
                  key={dateStr}
                  className={`min-h-[64px] p-2 rounded-2xl border transition-all flex flex-col items-center justify-between ${
                    dayFeelings.length > 0 
                      ? 'bg-white/10 border-pink-500/30' 
                      : 'bg-white/5 border-white/5 opacity-50'
                  }`}
                >
                  <span className="text-xs font-mono font-bold text-white">{dayNum}</span>

                  {dayFeelings.length > 0 && (
                    <div
                      className="w-7 h-7 rounded-full border border-white/30 shadow-md cursor-pointer transition-transform hover:scale-125"
                      style={{
                        background: dayFeelings.length > 1
                          ? `linear-gradient(90deg, ${color1} 50%, ${color2} 50%)`
                          : color1
                      }}
                      title={dayFeelings.map(f => `${f.user?.displayName || 'Amor'}: ${f.moodLabel}`).join(' | ')}
                      onClick={() => setSelectedFeeling(dayFeelings[0])}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRAR SENTIMENTO DE HOJE */}
      <AnimatePresence>
        {isRegisterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="relative w-full max-w-md p-6 rounded-3xl bg-[#150F24] border border-pink-500/30 shadow-2xl text-white"
            >
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-purple-300"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <MaryCupidAvatar state="explaining" size={60} />
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Como você está se sentindo hoje?
                  </h3>
                  <p className="text-xs text-purple-300/80">
                    Sua estrela ficará brilhando no topo do céu do casal! ✨
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveFeeling} className="space-y-4">
                {/* Seletor de Humor */}
                <div>
                  <label className="text-xs font-semibold text-purple-200 block mb-2">
                    Escolha seu sentimento:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {moodsList.map((m) => (
                      <button
                        key={m.id || m.name}
                        type="button"
                        onClick={() => setSelectedMood(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                          selectedMood?.name === m.name
                            ? 'bg-pink-500 border-pink-400 text-white shadow-md shadow-pink-500/30'
                            : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color || '#F43F5E' }} />
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensidade de 1 a 5 Estrelas */}
                <div>
                  <label className="text-xs font-semibold text-purple-200 block mb-1">
                    Intensidade: {intensity} / 5
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setIntensity(star)}
                        className="p-1 text-amber-300 hover:scale-125 transition-transform"
                      >
                        <Star size={24} weight={star <= intensity ? 'fill' : 'regular'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nota Carinhosa Opcional */}
                <div>
                  <label className="text-xs font-semibold text-purple-200 block mb-1">
                    Quer deixar um bilhete para o seu amor ler? (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ex: Te amo tanto, hoje o dia foi produtivo pensando em você..."
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-purple-300/40 focus:border-pink-500 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkle size={16} weight="fill" />}
                  Iluminar Nossa Estrela 🌟
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DETALHE DA ESTRELA CLICADA */}
      <AnimatePresence>
        {selectedFeeling && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm p-6 rounded-3xl bg-[#160E26] border border-pink-500/30 shadow-2xl text-white text-center"
            >
              <button
                type="button"
                onClick={() => setSelectedFeeling(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-purple-300"
              >
                <X size={18} />
              </button>

              <div
                className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-xl"
                style={{
                  backgroundColor: selectedFeeling.moodColor,
                  boxShadow: `0 0 24px ${selectedFeeling.moodColor}88`
                }}
              >
                <Heart size={32} weight="fill" className="text-white" />
              </div>

              <span className="text-[11px] font-mono text-purple-300/70 block mb-1">
                {selectedFeeling.feelingDate.split('-').reverse().join('/')}
              </span>
              <h3 className="text-lg font-bold text-white font-display">
                {selectedFeeling.moodLabel}
              </h3>
              <p className="text-xs text-pink-300 font-semibold mb-3">
                Registrado por {selectedFeeling.user?.nickname || selectedFeeling.user?.displayName}
              </p>

              <div className="flex items-center justify-center gap-1 text-amber-300 mb-4">
                {Array.from({ length: selectedFeeling.intensity || 5 }).map((_, i) => (
                  <Star key={i} size={16} weight="fill" />
                ))}
              </div>

              {selectedFeeling.note && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-purple-100/90 italic leading-relaxed text-left">
                  "{selectedFeeling.note}"
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
