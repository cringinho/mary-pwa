import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  SlidersHorizontal, Palette, BellRinging, BellSlash, Heart,
  Sparkle, CalendarHeart, Plus, Trash, DownloadSimple,
  SignOut, NotePencil, Check, PaperPlaneTilt, BookOpenText,
  Copy, Tag, Images, Smiley, PencilSimple, X, Crown, InstagramLogo
} from '@phosphor-icons/react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { usePushNotifications } from '../hooks/usePushNotifications';
import PricingAndPlansModal from './PricingAndPlansModal';
import SocialShareWrapperModal from './SocialShareWrapperModal';
import WidgetPreviewSection from './WidgetPreviewSection';

const CUSTOM_COLORS = ['#EC4899', '#F43F5E', '#A855F7', '#38BDF8', '#F59E0B', '#10B981'];

export default function SettingsView({ onOpenProfile, coupleData, onCoupleUpdated }) {
  const { user, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const {
    isSupported, isSubscribed, loading: pushLoading,
    subscribe, unsubscribe, sendThinkingOfYou
  } = usePushNotifications();

  const [thinkingSending, setThinkingSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [anniversaryDate, setAnniversaryDate] = useState('2026-01-30');
  const [enableBibleVerses, setEnableBibleVerses] = useState(false);
  const [inviteCode, setInviteCode] = useState('AMOR26');
  const [copiedCode, setCopiedCode] = useState(false);
  const [daysUntilAnniversary, setDaysUntilAnniversary] = useState(0);

  // CRUD de Personalizações (Tags, Álbuns, Humores)
  const [customTab, setCustomTab] = useState('moods'); // 'moods' | 'tags' | 'albums'
  const [customizations, setCustomizations] = useState({ moods: [], tags: [], albums: [] });
  const [newItemName, setNewItemName] = useState('');
  const [newItemColor, setNewItemColor] = useState('#EC4899');
  const [editingItem, setEditingItem] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Modais de Planos & Social Share
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [currentPlanTier, setCurrentPlanTier] = useState(coupleData?.couple?.planTier || coupleData?.settings?.planTier || 'freemium');

  // Instalação PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  async function handleInstallApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  }

  async function loadCoupleSettings() {
    try {
      const res = await fetch('/api/couple', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAnniversaryDate(data.settings?.anniversaryDate || '2026-01-30');
        setEnableBibleVerses(Boolean(data.settings?.enableBibleVerses));
        setInviteCode(data.settings?.inviteCode || 'AMOR26');
        if (data.customizations) {
          setCustomizations({
            moods: data.customizations.moods || [],
            tags: data.customizations.tags || [],
            albums: data.customizations.albums || []
          });
        }
        if (onCoupleUpdated) onCoupleUpdated(data);
      }
    } catch (err) {
      console.warn('Erro ao carregar configurações:', err);
    }
  }

  useEffect(() => {
    if (coupleData) {
      setAnniversaryDate(coupleData.settings?.anniversaryDate || '2026-01-30');
      setEnableBibleVerses(Boolean(coupleData.settings?.enableBibleVerses));
      setInviteCode(coupleData.settings?.inviteCode || 'AMOR26');
      if (coupleData.customizations) {
        setCustomizations({
          moods: coupleData.customizations.moods || [],
          tags: coupleData.customizations.tags || [],
          albums: coupleData.customizations.albums || []
        });
      }
    } else {
      loadCoupleSettings();
    }
  }, [coupleData]);

  useEffect(() => {
    function calcDays() {
      const now = new Date();
      const [, m, d] = anniversaryDate.split('-');
      const targetThisYear = new Date(now.getFullYear(), parseInt(m || '1', 10) - 1, parseInt(d || '1', 10));
      let nextTarget = targetThisYear;
      if (now > targetThisYear) {
        nextTarget = new Date(now.getFullYear() + 1, parseInt(m || '1', 10) - 1, parseInt(d || '1', 10));
      }
      const diffDays = Math.ceil((nextTarget.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setDaysUntilAnniversary(diffDays);
    }
    calcDays();
  }, [anniversaryDate]);

  async function handleToggleBibleVerses() {
    const nextValue = !enableBibleVerses;
    setEnableBibleVerses(nextValue);
    try {
      const res = await fetch('/api/couple/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enableBibleVerses: nextValue })
      });
      if (res.ok) {
        loadCoupleSettings();
      }
    } catch (err) {
      console.warn('Erro ao alternar versículos:', err);
    }
  }

  async function handleUpdateAnniversary(newDate) {
    setAnniversaryDate(newDate);
    try {
      await fetch('/api/couple/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ anniversaryDate: newDate })
      });
      loadCoupleSettings();
    } catch (err) {
      console.warn('Erro ao salvar data de aniversário:', err);
    }
  }

  async function handleCreateCustomization(e) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      const res = await fetch(`/api/couple/customizations/${customTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newItemName.trim(),
          color: newItemColor,
          iconName: customTab === 'moods' ? 'Heart' : customTab === 'tags' ? 'Tag' : 'Images'
        })
      });
      if (res.ok) {
        setNewItemName('');
        loadCoupleSettings();
      }
    } catch (err) {
      console.warn('Erro ao criar personalização:', err);
    }
  }

  async function handleSaveEditCustomization(itemId) {
    if (!editingName.trim()) return;
    try {
      const res = await fetch(`/api/couple/customizations/${customTab}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: editingName.trim() })
      });
      if (res.ok) {
        setEditingItem(null);
        setEditingName('');
        loadCoupleSettings();
      }
    } catch (err) {
      console.warn('Erro ao editar personalização:', err);
    }
  }

  async function handleDeleteCustomization(itemId) {
    try {
      const res = await fetch(`/api/couple/customizations/${customTab}/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        loadCoupleSettings();
      }
    } catch (err) {
      console.warn('Erro ao excluir personalização:', err);
    }
  }

  async function handleSendThinking() {
    setThinkingSending(true);
    setFeedback(null);
    try {
      confetti({ particleCount: 35, spread: 70, origin: { y: 0.8 }, colors: ['#EC4899', '#F43F5E', '#A855F7'] });
      const result = await sendThinkingOfYou();
      setFeedback({ type: result.success ? 'success' : 'error', text: result.message });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setThinkingSending(false);
    }
  }

  const currentItems = customizations[customTab] || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Ajustes */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-pink-400">
          <SlidersHorizontal weight="duotone" className="w-6 h-6" />
          <div>
            <h2 className="text-base font-bold font-display text-white">Ajustes & Personalização</h2>
            <p className="text-[11px] text-pink-300/70 font-sans">
              Pareamento, versículo diário, humores, tags, álbuns e notificações
            </p>
          </div>
        </div>

        {/* Código de Pareamento do Casal */}
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-2xl border border-pink-500/25">
          <span className="text-[10px] text-gray-400 font-sans">Código do Casal:</span>
          <span className="text-xs font-mono font-bold text-pink-300 tracking-wider">{inviteCode}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(inviteCode);
              setCopiedCode(true);
              setTimeout(() => setCopiedCode(false), 2000);
            }}
            className="p-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 text-[10px] flex items-center gap-1"
            title="Copiar código de convite"
          >
            {copiedCode ? <Check weight="bold" className="w-3 h-3 text-emerald-400" /> : <Copy weight="duotone" className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-2xl text-xs text-center font-sans font-medium ${
          feedback.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border border-red-500/30 text-red-300'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* CARD 1: INSTALAÇÃO DO PWA */}
      {isInstallable && (
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-600/10 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <DownloadSimple weight="bold" className="w-4 h-4" />
              <span>Instalar Aplicativo Nativo</span>
            </h3>
            <p className="text-[11px] text-gray-300 font-sans">
              Instale o Nosso Universo na tela inicial do seu celular para acesso rápido em tela cheia e offline!
            </p>
          </div>

          <button
            onClick={handleInstallApp}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-pink-500 text-black font-bold text-xs shrink-0 shadow-lg shadow-amber-500/20 font-display"
          >
            Instalar App
          </button>
        </div>
      )}

      {/* CARD 2: TOGGLE DE VERSÍCULO BÍBLICO DIÁRIO (Desabilitado por padrão - Item 14) */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 shadow-xl flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300">
            <BookOpenText weight="duotone" className="w-5 h-5" />
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">
              Exibir Versículo Bíblico Diário na Home
            </h3>
          </div>
          <p className="text-xs text-gray-400 font-sans">
            Quando ativado, exibe um card especial na tela inicial com versículos diários em português e opção de favoritar.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enableBibleVerses}
          onClick={handleToggleBibleVerses}
          className={`w-12 h-6 rounded-full transition-colors p-0.5 shrink-0 ${
            enableBibleVerses ? 'bg-pink-500' : 'bg-white/15'
          }`}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
              enableBibleVerses ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* CARD 3: CRUD DE HUMORES, TAGS E ÁLBUNS PERSONALIZADOS (Item 11) */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkle weight="duotone" className="w-4 h-4 text-pink-400" />
              <span>Personalizar Humores, Tags & Álbuns do Casal</span>
            </h3>
            <p className="text-[11px] text-gray-400 font-sans">
              Crie novos itens ou edite e exclua qualquer um dos padrões pré-existentes
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
            {[
              { id: 'moods', label: 'Humores', icon: Smiley },
              { id: 'tags', label: 'Tags', icon: Tag },
              { id: 'albums', label: 'Álbuns', icon: Images }
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCustomTab(tab.id);
                    setEditingItem(null);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                    customTab === tab.id ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <IconComp weight="duotone" className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulário de Criação */}
        <form onSubmit={handleCreateCustomization} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={
              customTab === 'moods'
                ? 'Novo humor (ex: Radiante, Com Saudade)...'
                : customTab === 'tags'
                ? 'Nova tag (ex: aniversario, praia)...'
                : 'Novo álbum (ex: Viagem 2026)...'
            }
            className="flex-1 min-w-[180px] px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
          />

          <div className="flex items-center gap-1">
            {CUSTOM_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewItemColor(c)}
                className={`w-5 h-5 rounded-full border ${newItemColor === c ? 'border-white scale-110' : 'border-transparent opacity-70'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold flex items-center gap-1 font-display"
          >
            <Plus weight="bold" className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </form>

        {/* Lista de Itens com Edição e Exclusão */}
        <div className="flex flex-wrap gap-2 pt-1">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className="px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-white"
              style={{ borderColor: `${item.color || '#EC4899'}55` }}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || '#EC4899' }} />

              {editingItem === item.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-28 px-1.5 py-0.5 bg-black/50 border border-pink-500 rounded text-xs text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEditCustomization(item.id)}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    <Check weight="bold" className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X weight="bold" className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-sans font-medium">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item.id);
                      setEditingName(item.name);
                    }}
                    className="text-gray-400 hover:text-pink-300 transition-colors"
                    title="Editar"
                  >
                    <PencilSimple weight="bold" className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomization(item.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash weight="bold" className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CARD 4: NOTIFICAÇÕES PUSH NATIVAS (VAPID) */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-pink-400">
            <BellRinging weight="duotone" className="w-5 h-5" />
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">
              Notificações Push em Tempo Real
            </h3>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider border ${
            isSubscribed
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-white/5 border-white/10 text-gray-400'
          }`}>
            {isSubscribed ? 'Ativo neste Celular' : 'Desativado'}
          </span>
        </div>

        <p className="text-xs text-gray-300 font-sans leading-relaxed">
          Receba avisos instantâneos quando o parceiro publicar um relato, curtir uma memória com corações ou adicionar fotos à galeria.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {isSubscribed ? (
            <button
              onClick={unsubscribe}
              disabled={pushLoading}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-sans font-medium flex items-center gap-1.5 transition-all"
            >
              <BellSlash weight="duotone" className="w-4 h-4" />
              <span>Desativar neste Dispositivo</span>
            </button>
          ) : (
            <button
              onClick={subscribe}
              disabled={pushLoading || !isSupported}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition-all font-display disabled:opacity-50"
            >
              <BellRinging weight="bold" className="w-4 h-4" />
              <span>Ativar Notificações Push</span>
            </button>
          )}

          <button
            onClick={handleSendThinking}
            disabled={thinkingSending}
            className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all font-display ml-auto"
          >
            {thinkingSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PaperPlaneTilt weight="fill" className="w-3.5 h-3.5 text-pink-400" />}
            <span>Pensando em você 💭</span>
          </button>
        </div>
      </div>

      {/* CARD 5: TEMAS VISUAIS DINÂMICOS */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 shadow-xl space-y-3">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
          <Palette weight="duotone" className="w-4 h-4 text-pink-400" />
          <span>Tema Visual do Universo</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                theme === t.id
                  ? 'border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: t.primary }} />
                <span className="text-xs font-bold font-display text-white">{t.name}</span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">{t.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      {/* CARD 6: DATAS COMEMORATIVAS & CONTAGEM REGRESSIVA */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
            <CalendarHeart weight="duotone" className="w-4 h-4 text-pink-400" />
            <span>Datas Marcantes do Casal</span>
          </h3>

          <span className="text-xs font-mono font-bold text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
            Faltam {daysUntilAnniversary} dias para o próximo marco!
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-white font-display font-semibold block">Início da Nossa História</span>
            <span className="text-[11px] text-pink-300 font-mono">{anniversaryDate}</span>
          </div>
          <input
            type="date"
            value={anniversaryDate}
            onChange={(e) => handleUpdateAnniversary(e.target.value)}
            className="px-2.5 py-1 bg-black/40 border border-white/15 rounded-xl text-white text-xs font-mono"
          />
        </div>
      </div>

      {/* CARD: PLANOS & ASSINATURA DO CASAL */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-amber-500/20 border border-amber-400/30 text-amber-300">
            <Crown size={24} weight="fill" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <span>Plano Atual:</span>
              <span className="capitalize px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs">
                {currentPlanTier}
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {currentPlanTier === 'almas_gemeas' 
                ? 'Plano VIP Máximo: todos os recursos liberados para os 2!' 
                : '1 assinatura desbloqueia tudo para os 2 membros do casal sem pagar em dobro.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPricingOpen(true)}
          className="w-full sm:w-auto py-2.5 px-5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all shrink-0"
        >
          Ver Planos & Benefícios
        </button>
      </div>

      {/* CARD: GERADOR DE STORIES HD (SOCIAL WRAPPERS) */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-pink-400/30 text-pink-300">
            <InstagramLogo size={24} weight="bold" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-display text-white">
              Social Wrappers para Stories & TikTok
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Gere cartões verticais em alta definição prontos para postar no Instagram e WhatsApp!
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsShareOpen(true)}
          className="w-full sm:w-auto py-2.5 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shrink-0"
        >
          Criar Story HD 📸
        </button>
      </div>

      {/* CARD: PREVIEW DE WIDGETS DE TELA INICIAL */}
      <WidgetPreviewSection />

      {/* CARD 7: AÇÕES DA CONTA */}
      <div className="glass-panel p-5 rounded-3xl border border-pink-500/20 shadow-xl flex flex-col sm:flex-row gap-3">
        <button
          onClick={onOpenProfile}
          className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2 font-display"
        >
          <NotePencil weight="duotone" className="w-4 h-4 text-pink-400" />
          <span>Editar Perfil & Foto de {user.displayName}</span>
        </button>

        <button
          onClick={logout}
          className="py-2.5 px-5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-300 flex items-center justify-center gap-2 font-display"
        >
          <SignOut weight="bold" className="w-4 h-4" />
          <span>Encerrar Sessão</span>
        </button>
      </div>

      {/* CARD 8: PRIVACIDADE & EXCLUSÃO DEFINITIVA (LGPD / GOOGLE PLAY) */}
      <div className="p-4 rounded-3xl bg-red-950/20 border border-red-500/20 text-center space-y-2">
        <p className="text-[11px] text-gray-400 font-sans">
          Em conformidade com a LGPD e regras do Google Play Console, você tem total autonomia para apagar permanentemente sua conta e todos os seus registros de nossos servidores a qualquer momento.
        </p>
        <button
          onClick={async () => {
            if (window.confirm('ATENÇÃO: Deseja realmente excluir permanentemente sua conta e todos os seus dados? Esta ação é irreversível e expurgará todos os seus relatos e fotos.')) {
              try {
                const res = await fetch('/api/account/purge', { method: 'DELETE' });
                if (res.ok) {
                  alert('Sua conta e dados foram expurgados com sucesso.');
                  window.location.reload();
                }
              } catch (e) {
                alert('Erro ao excluir conta.');
              }
            }
          }}
          className="py-2 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-[11px] font-bold text-red-300 transition-all inline-flex items-center gap-1.5"
        >
          <Trash weight="bold" className="w-3.5 h-3.5" />
          <span>Excluir Minha Conta e Todos os Dados Permanentemente</span>
        </button>
      </div>

      {/* MODAIS DE PLANOS E COMPARTILHAMENTO SOCIAL */}
      {isPricingOpen && (
        <PricingAndPlansModal
          isOpen={isPricingOpen}
          onClose={() => setIsPricingOpen(false)}
          currentTier={currentPlanTier}
          onPlanUpgraded={(newTier) => {
            setCurrentPlanTier(newTier);
            if (onCoupleUpdated) onCoupleUpdated();
          }}
        />
      )}

      {isShareOpen && (
        <SocialShareWrapperModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          coupleData={coupleData}
        />
      )}
    </div>
  );
}
