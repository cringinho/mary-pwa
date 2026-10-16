import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Scroll, LockKey } from '@phosphor-icons/react';

export default function LegalTermsModal({ isOpen, onClose, activeTab = 'terms' }) {
  const [tab, setTab] = React.useState(activeTab);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-pink-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <ShieldCheck weight="duotone" className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">Transparência & Privacidade</h3>
                <p className="text-xs text-pink-300/80 font-sans">Nosso Universo — Seguro e em conformidade com a LGPD</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <X weight="bold" className="w-5 h-5" />
            </button>
          </div>

          {/* Abas Termos vs Privacidade */}
          <div className="flex gap-2 pt-4 pb-3 shrink-0">
            <button
              onClick={() => setTab('terms')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                tab === 'terms'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <Scroll weight="bold" className="w-4 h-4" />
              <span>Termos de Uso</span>
            </button>
            <button
              onClick={() => setTab('privacy')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                tab === 'privacy'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <LockKey weight="bold" className="w-4 h-4" />
              <span>Política de Privacidade (LGPD)</span>
            </button>
          </div>

          {/* Conteúdo com Rolagem Suave */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-xs text-gray-300 leading-relaxed font-sans custom-scrollbar">
            {tab === 'terms' ? (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white font-display">1. Elegibilidade e Espaço do Casal</h4>
                <p>
                  O aplicativo <strong>Nosso Universo</strong> é destinado ao registro afetivo compartilhado entre duas pessoas.
                  O pareamento ocorre exclusivamente via código de convite voluntário. O vínculo pode ser desfeito a qualquer momento através do menu de Ajustes.
                </p>

                <h4 className="text-sm font-bold text-white font-display">2. Planos de Assinatura e Benefícios</h4>
                <p>
                  Oferecemos os planos <em>Freemium</em> (gratuito com anúncios não-intrusivos), <em>Romance</em> (R$ 12,90/mês) e <em>Almas Gêmeas VIP</em> (R$ 24,90/mês).
                  Benefícios de assinatura são estendidos imediatamente para ambos os parceiros cadastrados no espaço do casal.
                </p>

                <h4 className="text-sm font-bold text-white font-display">3. Responsabilidade de Conteúdo</h4>
                <p>
                  O casal possui total custódia de seus textos, fotos e áudios. Ao exportar memórias em vídeos ou fotos para redes sociais externas, o usuário é responsável pelas informações que torna públicas fora da plataforma privada.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white font-display">1. Coleta e Finalidade (LGPD - Lei 13.709/2018)</h4>
                <p>
                  Tratamos apenas dados estritamente necessários: apelido, e-mail, senha criptografada (hash seguro), fotos, registros de sentimentos e telemetria de localização estritamente consentida.
                </p>

                <h4 className="text-sm font-bold text-white font-display">2. Zero Venda de Dados e Privacidade Máxima</h4>
                <p>
                  <strong>Nenhum dado pessoal, foto ou relato de casal é vendido ou compartilhado com terceiros.</strong> Todo o conteúdo reside em ambiente criptografado e isolado por ID do casal.
                </p>

                <h4 className="text-sm font-bold text-white font-display">3. Exclusão Definitiva (Direito ao Esquecimento)</h4>
                <p>
                  Conforme exigido pela LGPD e pelas diretrizes da Google Play Store, você pode clicar em <em>"Excluir Minha Conta e Todos os Dados Permanentemente"</em> nos Ajustes para expurgar seus dados de forma imediata e irreversível dos nossos servidores.
                </p>

                <div className="pt-2 p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400">
                  <p><strong>Encarregado de Proteção de Dados (DPO):</strong> cringe.support@gmail.com</p>
                  <p><strong>Versão Oficial:</strong> v1.0-2026</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/10 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
            >
              Compreendi e Concordo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

