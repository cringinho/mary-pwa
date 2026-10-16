import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, VideoCamera, DownloadSimple, Play, Stop, Sparkle,
  ShareNetwork, Heart, Trophy, Confetti
} from '@phosphor-icons/react';
import MaryCupidAvatar from './mary/MaryCupidAvatar';

export default function TrendVideoGenerator({ isOpen, onClose, coupleData, minigameResult }) {
  const canvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('minigame'); // 'minigame' | 'couple_thread' | 'sky_tour'

  if (!isOpen) return null;

  const coupleName = coupleData?.couple?.coupleName || 'Nosso Universo';
  const partnerName = coupleData?.partner?.nickname || coupleData?.partner?.displayName || 'Meu Amor';
  const meName = coupleData?.user?.displayName || 'Eu';

  async function startRecording() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecording(true);
    setProgress(0);
    setRecordedVideoUrl(null);

    const ctx = canvas.getContext('2d');
    const stream = canvas.captureStream(30); // 30 FPS

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      setIsRecording(false);
    };

    recorder.start();

    // Loop de Animação de 8 segundos no Canvas 1080x1920 (9:16)
    const duration = 8000;
    const startTime = performance.now();

    function render(time) {
      const elapsed = time - startTime;
      const progressFraction = Math.min(1, elapsed / duration);
      setProgress(Math.round(progressFraction * 100));

      // Limpar Canvas e Desenhar Gradiente de Fundo Noturno
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGrad.addColorStop(0, '#0f0c1b');
      bgGrad.addColorStop(0.5, '#24102c');
      bgGrad.addColorStop(1, '#09070f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Partículas de Estrelas Flutuantes
      for (let i = 0; i < 40; i++) {
        const starX = (Math.sin(i * 99 + elapsed * 0.001) * 0.5 + 0.5) * 1080;
        const starY = (Math.cos(i * 33 + elapsed * 0.0008) * 0.5 + 0.5) * 1920;
        const radius = (Math.sin(elapsed * 0.003 + i) * 0.5 + 0.5) * 3 + 1;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(244, 63, 94, 0.6)' : 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(starX, starY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Moldura Neon Exterior
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 12;
      ctx.strokeRect(60, 60, 960, 1800);

      // Header: Nosso Universo & Mary
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(coupleName.toUpperCase(), 540, 220);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('✨ Trend de Casal no TikTok ✨', 540, 280);

      // Conteúdo Dinâmico por Template
      if (selectedTemplate === 'minigame') {
        // Círculo de Compatibilidade Pulsante
        const pulse = Math.sin(elapsed * 0.005) * 10;
        ctx.beginPath();
        ctx.arc(540, 650, 180 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
        ctx.fill();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 110px sans-serif';
        const compat = minigameResult?.compatibility || 94;
        ctx.fillText(`${compat}%`, 540, 680);

        ctx.fillStyle = '#fda4af';
        ctx.font = 'bold 38px sans-serif';
        ctx.fillText('DE SINTONIA & AFETO', 540, 750);

        // Cards de Perguntas respondidas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.roundRect(140, 920, 800, 180, 28);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('Quem pediria desculpas primeiro?', 540, 990);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText(`Ambos votaram em: ${partnerName} ❤️`, 540, 1050);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.roundRect(140, 1140, 800, 180, 28);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('Dormir abraçadinhos ou maratonar?', 540, 1210);
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('MATCH PERFEITO: Abraçadinhos! ✨', 540, 1270);
      } else {
        // Template Constelação
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText(`${meName} & ${partnerName}`, 540, 700);

        ctx.fillStyle = '#fda4af';
        ctx.font = '36px sans-serif';
        ctx.fillText('Mais de 100 memórias no nosso céu', 540, 770);
      }

      // Rodapé com Mascote Mary e Hashtag
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.roundRect(200, 1620, 680, 120, 24);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('#NossoUniverso #Casal #TrendMary', 540, 1690);

      if (elapsed < duration) {
        requestAnimationFrame(render);
      } else {
        recorder.stop();
      }
    }

    requestAnimationFrame(render);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-slate-900 border border-pink-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <VideoCamera weight="duotone" className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-white">Gerador de Vídeos 9:16 (TikTok/Reels)</h3>
                <p className="text-[11px] text-pink-300 font-sans">Gere vídeos animados de 8 segundos com a Mary!</p>
              </div>
            </div>

            <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400">
              <X weight="bold" className="w-5 h-5" />
            </button>
          </div>

          {/* Seletor de Template */}
          <div className="grid grid-cols-2 gap-2 pt-3 shrink-0">
            <button
              onClick={() => setSelectedTemplate('minigame')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                selectedTemplate === 'minigame'
                  ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              🎮 Resultado dos Minigames
            </button>
            <button
              onClick={() => setSelectedTemplate('sky_tour')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                selectedTemplate === 'sky_tour'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              🌌 Constelação do Casal
            </button>
          </div>

          {/* Canvas oculto/preview escalado */}
          <div className="relative my-4 flex-1 flex items-center justify-center bg-black/60 rounded-2xl overflow-hidden border border-white/10 p-2 min-h-[260px]">
            <canvas
              ref={canvasRef}
              width={1080}
              height={1920}
              className="max-h-[250px] w-auto aspect-[9/16] rounded-xl shadow-2xl border border-pink-500/30 object-contain"
            />

            {isRecording && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                <Sparkle weight="fill" className="w-8 h-8 text-pink-400 animate-spin" />
                <p className="text-xs font-bold text-white font-mono">Renderizando 60fps... {progress}%</p>
                <div className="w-48 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2 shrink-0">
            {!recordedVideoUrl ? (
              <button
                onClick={startRecording}
                disabled={isRecording}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <Play weight="fill" className="w-4 h-4" />
                <span>{isRecording ? 'Gravando Vídeo...' : 'Gravar Vídeo de 8s (Full HD)'}</span>
              </button>
            ) : (
              <>
                <a
                  href={recordedVideoUrl}
                  download={`nosso-universo-trend-${Date.now()}.webm`}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-center"
                >
                  <DownloadSimple weight="bold" className="w-4 h-4" />
                  <span>Baixar Vídeo Pronto</span>
                </a>
                <button
                  onClick={startRecording}
                  className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all"
                >
                  Regravar
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
