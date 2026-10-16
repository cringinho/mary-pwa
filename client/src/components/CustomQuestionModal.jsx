import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkle, PlusCircle } from '@phosphor-icons/react';

export default function CustomQuestionModal({ isOpen, onClose, onCreated }) {
  const [questionType, setQuestionType] = useState('prefer_dislike');
  const [category, setCategory] = useState('Romantismo');
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setError('Por favor, escreva a pergunta.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch('/api/minigames/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionType,
          category,
          questionText: questionText.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar pergunta');
      }

      const data = await res.json();
      onCreated?.(data.question);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-card w-full max-w-md rounded-3xl p-6 border border-white/15 bg-slate-950/90 shadow-2xl relative"
        >
          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Sparkle weight="fill" className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Pergunta Própria do Casal</span>
          </div>
          <h2 className="text-lg font-black text-white mb-4">
            Criar Desafio para o Meu Amor
          </h2>

          {error && (
            <div className="mb-4 text-xs text-rose-300 bg-rose-500/20 border border-rose-500/40 p-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Escolha do Tipo de Jogo */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 block">
                Modo do Jogo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuestionType('prefer_dislike')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    questionType === 'prefer_dislike'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  Prefiro / Não Gosto
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionType('who_would')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    questionType === 'who_would'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  Quem Faria Tal Coisa?
                </button>
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
              >
                <option value="Romantismo">Romantismo & Afeto</option>
                <option value="Cotidiano">Cotidiano & Casa</option>
                <option value="Viagens">Viagens & Passeios</option>
                <option value="Gastronomia">Gastronomia & Comida</option>
                <option value="Futuro">Futuro & Família</option>
                <option value="Situações Engraçadas">Situações Engraçadas & Micos</option>
                <option value="Segredos & Intimidade">Segredos & Intimidade</option>
              </select>
            </div>

            {/* Texto da Pergunta */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                {questionType === 'prefer_dislike' 
                  ? 'O que você quer saber a opinião do seu amor?' 
                  : 'Quem é mais provável de...'}
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                placeholder={questionType === 'prefer_dislike' 
                  ? 'Ex: Fazer uma viagem de motorhome pela serra no inverno?' 
                  : 'Ex: Quem gastaria todo o dinheiro em guloseimas no meio da noite?'}
                className="w-full bg-slate-900 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            {/* Botão de Enviar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <span>Criando...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" weight="bold" />
                  Salvar Pergunta Exclusiva
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
