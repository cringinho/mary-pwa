import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GameController, 
  Sparkle, 
  Heart, 
  ThumbsUp, 
  ThumbsDown, 
  MinusCircle, 
  Users, 
  CheckCircle, 
  PlusCircle, 
  Fire, 
  TrendUp,
  ArrowsClockwise,
  Confetti,
  VideoCamera
} from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import MaryCupidAvatar from './mary/MaryCupidAvatar';
import CustomQuestionModal from './CustomQuestionModal';
import TrendVideoGenerator from './TrendVideoGenerator';

export default function CoupleMinigamesView() {
  const [activeTab, setActiveTab] = useState('prefer_dislike'); // 'prefer_dislike' | 'who_would'
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [compatibility, setCompatibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isVideoGenOpen, setIsVideoGenOpen] = useState(false);

  // Carregar categorias
  const fetchCategories = useCallback(async (type) => {
    try {
      const res = await fetch(`/api/minigames/categories?type=${type}`);
      if (res.ok) {
        const cats = await res.json();
        setCategories(cats);
      }
    } catch (e) {
      console.warn('Erro ao carregar categorias:', e);
    }
  }, []);

  // Carregar dados de compatibilidade
  const fetchCompatibility = useCallback(async () => {
    try {
      const res = await fetch('/api/minigames/compatibility');
      if (res.ok) {
        const data = await res.json();
        setCompatibility(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar compatibilidade:', e);
    }
  }, []);

  // Carregar perguntas
  const fetchQuestions = useCallback(async (type, cat) => {
    try {
      setLoading(true);
      let url = `/api/minigames/questions?type=${type}&limit=50`;
      if (cat) url += `&category=${encodeURIComponent(cat)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setCurrentIndex(0);
      }
    } catch (e) {
      console.warn('Erro ao carregar perguntas:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(activeTab);
    fetchQuestions(activeTab, selectedCategory);
    fetchCompatibility();
  }, [activeTab, selectedCategory, fetchCategories, fetchQuestions, fetchCompatibility]);

  // Responder à pergunta atual
  const handleVote = async (choice) => {
    const currentQ = questions[currentIndex];
    if (!currentQ || answering) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([30]);
    }

    try {
      setAnswering(true);
      const res = await fetch('/api/minigames/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          answerChoice: choice
        })
      });

      if (res.ok) {
        const data = await res.json();

        // Disparar confetes se der MATCH
        if (data.isMatch) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        }

        // Atualizar lista local
        setQuestions(prev => prev.map((q, idx) => {
          if (idx === currentIndex) {
            return {
              ...q,
              myAnswer: choice,
              partnerAnswer: data.partnerAnswer,
              answeredByMe: true,
              isRevealed: data.isRevealed,
              isMatch: data.isMatch
            };
          }
          return q;
        }));

        fetchCompatibility();
      }
    } catch (e) {
      console.warn('Erro ao votar:', e);
    } finally {
      setAnswering(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-28 pt-4 px-3 sm:px-6 max-w-3xl mx-auto flex flex-col gap-4">
      
      {/* 1. Header com Mascote Mary & Resumo de Sintonia */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-[var(--border-card)] shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 flex-shrink-0">
            <MaryCupidAvatar state={compatibility?.overallCompatibility > 80 ? 'love' : 'explaining'} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <GameController weight="fill" className="w-3.5 h-3.5" />
                Minigames do Casal (1.000 Questões)
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-rose-400">
              {compatibility ? `${compatibility.overallCompatibility}% de Sintonia` : 'Calculando Sintonia...'}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {compatibility?.totalAnsweredTogether > 0 
                ? `${compatibility.totalAnsweredTogether} respostas em sintonia mútua`
                : 'Respondam juntos para revelar as afinidades!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVideoGenOpen(true)}
            className="py-2 px-3 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-500/40 text-pink-300 hover:bg-pink-500/30 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5 shadow"
            title="Gerar Vídeo de Trend 9:16 para TikTok ou Reels"
          >
            <VideoCamera className="w-4 h-4 text-pink-400" weight="bold" />
            <span className="hidden sm:inline">Vídeo da Trend</span>
          </button>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="py-2 px-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <PlusCircle className="w-4 h-4" weight="bold" />
            <span className="hidden sm:inline">Criar Pergunta</span>
          </button>
        </div>
      </motion.div>

      {/* 2. Seletor de Modo de Jogo */}
      <div className="grid grid-cols-2 gap-2 glass-card p-1.5 rounded-2xl border border-[var(--border-card)]">
        <button
          onClick={() => { setActiveTab('prefer_dislike'); setSelectedCategory(''); }}
          className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'prefer_dislike'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
              : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" weight="fill" />
          Prefiro / Não Gosto (500)
        </button>

        <button
          onClick={() => { setActiveTab('who_would'); setSelectedCategory(''); }}
          className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'who_would'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md'
              : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" weight="fill" />
          Quem Faria? (500)
        </button>
      </div>

      {/* 3. Filtro por Categoria */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === ''
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10'
          }`}
        >
          Todas as Categorias
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. Card Principal da Pergunta Interativa */}
      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-[var(--border-card)] animate-pulse">
          <p className="text-sm text-[var(--text-muted)]">Carregando perguntas de sintonia...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center border border-[var(--border-card)] flex flex-col items-center gap-3">
          <MaryCupidAvatar state="sleeping" />
          <p className="text-sm text-[var(--text-muted)]">Nenhuma pergunta encontrada nesta categoria.</p>
        </div>
      ) : currentQ ? (
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border-card)] shadow-2xl flex flex-col justify-between gap-6 min-h-[340px] relative overflow-hidden"
        >
          {/* Header da Pergunta */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              {currentQ.category}
            </span>
            <span className="text-[var(--text-muted)] font-mono">
              Questão {currentIndex + 1} de {questions.length}
            </span>
          </div>

          {/* Texto Central da Pergunta */}
          <div className="py-4 text-center">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
              "{currentQ.questionText}"
            </h2>
          </div>

          {/* Estado de Revelação e Respostas */}
          {currentQ.isRevealed ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border text-center ${
                currentQ.isMatch 
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-200' 
                  : 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 font-bold text-sm mb-1">
                {currentQ.isMatch ? (
                  <>
                    <Confetti className="w-5 h-5 text-rose-400" weight="fill" />
                    <span>DEU MATCH! Vocês pensam igual! 💘</span>
                  </>
                ) : (
                  <>
                    <Sparkle className="w-5 h-5 text-indigo-400" weight="fill" />
                    <span>Vocês se completam nas diferenças! ✨</span>
                  </>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Você respondeu: <b>{currentQ.myAnswer}</b> • Seu amor respondeu: <b>{currentQ.partnerAnswer}</b>
              </p>
            </motion.div>
          ) : currentQ.answeredByMe ? (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" weight="fill" />
              <span>Você já votou! Aguardando seu amor responder para revelar.</span>
            </div>
          ) : null}

          {/* Botões de Votação Táteis */}
          <div className="flex flex-col gap-2.5">
            {activeTab === 'prefer_dislike' ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleVote('prefer')}
                  disabled={answering}
                  className={`py-3.5 px-3 rounded-2xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md ${
                    currentQ.myAnswer === 'prefer'
                      ? 'bg-rose-500 text-white ring-2 ring-rose-300'
                      : 'bg-white/10 hover:bg-rose-500/20 text-white border border-white/10'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5 text-rose-400" weight="fill" />
                  <span>Amo / Prefiro</span>
                </button>

                <button
                  onClick={() => handleVote('neutral')}
                  disabled={answering}
                  className={`py-3.5 px-3 rounded-2xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md ${
                    currentQ.myAnswer === 'neutral'
                      ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300'
                      : 'bg-white/10 hover:bg-amber-500/20 text-white border border-white/10'
                  }`}
                >
                  <MinusCircle className="w-5 h-5 text-amber-400" weight="fill" />
                  <span>Neutro</span>
                </button>

                <button
                  onClick={() => handleVote('dislike')}
                  disabled={answering}
                  className={`py-3.5 px-3 rounded-2xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md ${
                    currentQ.myAnswer === 'dislike'
                      ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                      : 'bg-white/10 hover:bg-purple-500/20 text-white border border-white/10'
                  }`}
                >
                  <ThumbsDown className="w-5 h-5 text-purple-400" weight="fill" />
                  <span>Não Gosto</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleVote('me')}
                  disabled={answering}
                  className={`py-4 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                    currentQ.myAnswer === 'me'
                      ? 'bg-rose-500 text-white ring-2 ring-rose-300'
                      : 'bg-white/10 hover:bg-rose-500/20 text-white border border-white/10'
                  }`}
                >
                  <span className="text-lg">🙋‍♂️</span>
                  <span>Eu Com Certeza!</span>
                </button>

                <button
                  onClick={() => handleVote('partner')}
                  disabled={answering}
                  className={`py-4 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                    currentQ.myAnswer === 'partner'
                      ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300'
                      : 'bg-white/10 hover:bg-amber-500/20 text-white border border-white/10'
                  }`}
                >
                  <span className="text-lg">🙋‍♀️</span>
                  <span>Meu Amor!</span>
                </button>
              </div>
            )}

            {/* Controles de Navegação Anterior / Próxima */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                className="text-xs text-[var(--text-muted)] hover:text-white disabled:opacity-30 p-2"
              >
                ← Anterior
              </button>

              <button
                onClick={nextQuestion}
                disabled={currentIndex >= questions.length - 1}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 disabled:opacity-30 p-2"
              >
                Próxima Pergunta →
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* 5. Breakdown de Categorias de Compatibilidade */}
      {compatibility?.byCategory?.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-[var(--border-card)] flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <TrendUp className="w-4 h-4" />
            Onde Vocês Mais Combinam
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {compatibility.byCategory.slice(0, 4).map((c) => (
              <div key={c.category} className="bg-white/5 rounded-xl p-2.5 flex items-center justify-between border border-white/5">
                <span className="text-white font-medium">{c.category}</span>
                <span className="font-bold text-rose-400">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Criação de Pergunta */}
      <CustomQuestionModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onCreated={(newQ) => {
          setQuestions(prev => [newQ, ...prev]);
          setCurrentIndex(0);
        }}
      />

      {/* Modal do Gerador de Vídeos da Trend 9:16 */}
      {isVideoGenOpen && (
        <TrendVideoGenerator
          isOpen={isVideoGenOpen}
          onClose={() => setIsVideoGenOpen(false)}
          minigameResult={{
            compatibility: compatibility?.overallCompatibility || 94
          }}
        />
      )}

    </div>
  );
}
