import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import {
  Sparkle, Heart, CalendarBlank, LockKey, EnvelopeSimple,
  User, ArrowLeft, Check, Key
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { calculateZodiacSign, ZODIAC_LABELS_PT } from '../services/zodiacUtils';

export default function RegisterWizard({ onBackToLogin }) {
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('2002-10-15');
  const [anniversaryDate, setAnniversaryDate] = useState('2026-01-30');
  const [coupleAction, setCoupleAction] = useState('create'); // 'create' | 'join'
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const zodiacSign = calculateZodiacSign(birthDate);
  const zodiacLabel = ZODIAC_LABELS_PT[zodiacSign] || 'Libra';

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await register({
        displayName,
        nickname,
        email,
        password,
        birthDate,
        anniversaryDate,
        coupleAction,
        inviteCode
      });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-pink-500/20 space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 font-sans"
        >
          <ArrowLeft weight="bold" className="w-3.5 h-3.5" />
          <span>Voltar ao Login</span>
        </button>

        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 border border-pink-500/30 text-pink-300 font-mono">
          NOVO CASAL
        </span>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold font-display text-white flex items-center justify-center gap-1.5">
          <span>Criar Nosso Universo</span>
          <Sparkle weight="fill" className="w-5 h-5 text-pink-400" />
        </h2>
        <p className="text-xs text-pink-200/70 font-sans">
          Crie seu espaço privado a dois ou entre com o código do seu amor
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">Seu Nome</label>
            <div className="relative">
              <User weight="duotone" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Mariana"
                required
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">Apelido Carinhoso</label>
            <div className="relative">
              <Heart weight="duotone" className="w-4 h-4 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: Meu Amor, Vida"
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">E-mail</label>
            <div className="relative">
              <EnvelopeSimple weight="duotone" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">Senha</label>
            <div className="relative">
              <LockKey weight="duotone" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Data de Nascimento + Signo Automático com @iconify/react */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 flex items-center justify-between">
              <span>Data de Nascimento</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                <Icon icon={`mdi:zodiac-${zodiacSign}`} className="w-3.5 h-3.5 text-amber-400" />
                <span>{zodiacLabel}</span>
              </span>
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 flex items-center gap-1">
              <CalendarBlank weight="duotone" className="w-3.5 h-3.5 text-pink-400" />
              <span>Início do Relacionamento</span>
            </label>
            <input
              type="date"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Criar Novo Espaço ou Entrar com Código do Parceiro */}
        <div className="pt-1 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCoupleAction('create')}
              className={`p-2.5 rounded-2xl border text-xs font-semibold font-display transition-all ${
                coupleAction === 'create'
                  ? 'bg-pink-500/20 border-pink-500 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              ✨ Criar Novo Espaço
            </button>

            <button
              type="button"
              onClick={() => setCoupleAction('join')}
              className={`p-2.5 rounded-2xl border text-xs font-semibold font-display transition-all ${
                coupleAction === 'join'
                  ? 'bg-purple-500/20 border-purple-500 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              🔑 Tenho um Código
            </button>
          </div>

          {coupleAction === 'join' && (
            <div>
              <label className="block text-[11px] font-semibold text-purple-300 mb-1 flex items-center gap-1">
                <Key weight="duotone" className="w-3.5 h-3.5" />
                <span>Código de 6 Caracteres do seu Amor</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ex: AMOR26"
                required={coupleAction === 'join'}
                className="w-full px-3 py-2 bg-purple-500/10 border border-purple-500/40 rounded-xl text-white text-center font-mono text-sm tracking-widest uppercase focus:outline-none focus:border-purple-400"
              />
            </div>
          )}
        </div>

        {formError && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center font-sans">
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 font-display"
        >
          <Check weight="bold" className="w-4 h-4" />
          <span>{submitting ? 'Criando Nosso Universo...' : 'Começar Nossa História'}</span>
        </button>
      </form>
    </div>
  );
}

