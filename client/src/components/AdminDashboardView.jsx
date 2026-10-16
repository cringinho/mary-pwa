import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, HardDrives, Crown, ChartBar, LockKey, ShieldCheck,
  TrendUp, ArrowClockwise, CurrencyDollar, CloudArrowUp
} from '@phosphor-icons/react';

export default function AdminDashboardView({ onClose }) {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('mary_admin_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (adminKey) {
      fetchMetrics(adminKey);
    }
  }, []);

  async function fetchMetrics(keyToUse = adminKey) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/metrics', {
        headers: { 'x-admin-key': keyToUse }
      });
      if (res.ok) {
        const json = await res.json();
        setMetrics(json);
        setIsAuthenticated(true);
        localStorage.setItem('mary_admin_key', keyToUse);
      } else {
        setIsAuthenticated(false);
        setError('Chave mestra inválida ou acesso não autorizado.');
      }
    } catch (e) {
      setError('Erro de rede ao consultar telemetria do servidor.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    fetchMetrics(adminKey);
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header SuperAdmin */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xl">
              <ShieldCheck weight="duotone" className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white">Painel SuperAdmin & Telemetria</h1>
              <p className="text-xs text-pink-300">Nosso Universo — Métricas em Tempo Real (LGPD Compliant)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => fetchMetrics()}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ArrowClockwise weight="bold" className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="py-2 px-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold"
              >
                Fechar
              </button>
            )}
          </div>
        </div>

        {/* Form de Autenticação se não autenticado */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto glass-panel p-8 rounded-3xl border border-pink-500/20 text-center space-y-4">
            <LockKey weight="duotone" className="w-12 h-12 text-pink-400 mx-auto" />
            <h2 className="text-lg font-bold font-display text-white">Acesso Restrito ao Administrador</h2>
            <p className="text-xs text-gray-400">Insira a chave mestra de telemetria configurada no backend.</p>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Chave Mestra Admin..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs text-center focus:outline-none focus:border-pink-500"
              />
              {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
              <button
                type="submit"
                disabled={loading || !adminKey}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 font-bold text-xs shadow-lg shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Validando...' : 'Acessar Painel'}
              </button>
            </form>
          </div>
        ) : metrics ? (
          <div className="space-y-6">
            {/* CARDS DE VISÃO GERAL */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-2xl border border-pink-500/20 space-y-1">
                <div className="flex items-center justify-between text-pink-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Usuários</span>
                  <Users weight="bold" className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black font-mono text-white">{metrics.overview.totalUsers}</p>
                <p className="text-[10px] text-gray-400 font-sans">{metrics.overview.totalCouples} casais pareados</p>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 space-y-1">
                <div className="flex items-center justify-between text-purple-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Atividade (DAU/MAU)</span>
                  <TrendUp weight="bold" className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black font-mono text-white">{metrics.overview.dau} / {metrics.overview.mau}</p>
                <p className="text-[10px] text-gray-400 font-sans">Hoje / No Mês</p>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-sky-500/20 space-y-1">
                <div className="flex items-center justify-between text-sky-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Armazenamento</span>
                  <HardDrives weight="bold" className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black font-mono text-white">{metrics.storage.totalUsedMB} MB</p>
                <p className="text-[10px] text-gray-400 font-sans">Nuvem Própria da VM</p>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 space-y-1">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">MRR Estimado</span>
                  <CurrencyDollar weight="bold" className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black font-mono text-emerald-300">R$ {metrics.billing.mrr.toFixed(2)}</p>
                <p className="text-[10px] text-gray-400 font-sans">{metrics.billing.romanceCount + metrics.billing.almasGemeasCount} assinaturas ativas</p>
              </div>
            </div>

            {/* SEÇÃO 2: RAIO-X DE ARMAZENAMENTO & PLANOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Raio-X de Armazenamento */}
              <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <CloudArrowUp weight="duotone" className="w-5 h-5 text-sky-400" />
                  <span>Raio-X de Armazenamento</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-gray-300">Armazenamento Interno (Sem Google)</span>
                    <span className="font-bold text-white font-mono">{metrics.storage.internalCloudCouples} casais</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-gray-300">Armazenamento Próprio (Google Drive)</span>
                    <span className="font-bold text-white font-mono">{metrics.storage.googleDriveCouples} casais</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-gray-300">Armazenamento Misto / Híbrido</span>
                    <span className="font-bold text-white font-mono">{metrics.storage.hybridCouples} casais</span>
                  </div>
                </div>
              </div>

              {/* Distribuição de Assinantes */}
              <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <Crown weight="duotone" className="w-5 h-5 text-amber-400" />
                  <span>Distribuição por Planos</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-gray-300">Plano Gratuito (Freemium com Ads)</span>
                    <span className="font-bold text-gray-400 font-mono">{metrics.billing.freemiumCount} casais</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-rose-300 font-semibold">Plano Romance (R$ 12,90/mês)</span>
                    <span className="font-bold text-white font-mono">{metrics.billing.romanceCount} casais</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <span className="text-purple-300 font-semibold">Plano Almas Gêmeas VIP (R$ 24,90/mês)</span>
                    <span className="font-bold text-white font-mono">{metrics.billing.almasGemeasCount} casais</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
