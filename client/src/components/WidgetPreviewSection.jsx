import React, { useState, useEffect } from 'react';
import { 
  DeviceMobile, 
  Sparkle, 
  Heart, 
  BatteryCharging, 
  BatteryFull, 
  MapPin, 
  CalendarHeart,
  ArrowsClockwise
} from '@phosphor-icons/react';
import MaryCupidAvatar from './mary/MaryCupidAvatar';

export default function WidgetPreviewSection() {
  const [widgetData, setWidgetData] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('mood_battery'); // 'mood_battery' | 'counter_distance' | 'polaroid'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWidgetData() {
      try {
        const res = await fetch('/api/widgets/summary');
        if (res.ok) {
          const data = await res.json();
          setWidgetData(data);
        }
      } catch (e) {
        console.warn('Erro ao carregar dados de widget:', e);
      } finally {
        setLoading(false);
      }
    }
    loadWidgetData();
  }, []);

  const days = widgetData?.daysTogether || 250;
  const partnerName = widgetData?.partner?.nickname || widgetData?.partner?.displayName || 'Meu Amor';
  const partnerAvatar = widgetData?.partner?.avatarUrl;
  const partnerBattery = widgetData?.partnerBattery?.level || 85;
  const isCharging = widgetData?.partnerBattery?.isCharging || false;
  const distance = widgetData?.distanceKm !== null ? `${widgetData?.distanceKm} km` : 'Perto de você';
  const moodLabel = widgetData?.partnerMood?.label || 'Apaixonado(a)';

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 border border-[var(--border-card)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
            <DeviceMobile size={20} weight="duotone" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Widgets de Tela Inicial (PWA & Celular)</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                Exclusivo
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Tenha a presença do seu amor na tela inicial do seu celular
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de Estilos de Widget */}
      <div className="grid grid-cols-3 gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setSelectedStyle('mood_battery')}
          className={`py-2 px-2 rounded-xl border text-center transition-all ${
            selectedStyle === 'mood_battery'
              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          Humor & Bateria
        </button>
        <button
          type="button"
          onClick={() => setSelectedStyle('counter_distance')}
          className={`py-2 px-2 rounded-xl border text-center transition-all ${
            selectedStyle === 'counter_distance'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          Tempo & Distância
        </button>
        <button
          type="button"
          onClick={() => setSelectedStyle('polaroid')}
          className={`py-2 px-2 rounded-xl border text-center transition-all ${
            selectedStyle === 'polaroid'
              ? 'bg-purple-500/20 border-purple-500 text-purple-300'
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          Foto Polaroid
        </button>
      </div>

      {/* Moldura de Tela de Celular com Preview */}
      <div className="flex justify-center py-2">
        <div className="w-56 h-36 rounded-3xl p-4 bg-slate-900/90 border border-white/20 shadow-2xl flex flex-col justify-between relative overflow-hidden text-white">
          {/* Brilho suave */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-pink-500/15 rounded-full blur-xl pointer-events-none" />

          {selectedStyle === 'mood_battery' && (
            <>
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-pink-400/50 bg-black/40 flex items-center justify-center">
                    {partnerAvatar ? (
                      <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">❤️</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight">{partnerName}</span>
                    <span className="text-[10px] text-pink-300 flex items-center gap-0.5">
                      <Sparkle size={10} weight="fill" /> {moodLabel}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {isCharging ? (
                    <BatteryCharging size={14} className="text-emerald-400 animate-pulse" />
                  ) : (
                    <BatteryFull size={14} className="text-emerald-400" />
                  )}
                  <span>{partnerBattery}%</span>
                </div>
              </div>

              <div className="z-10 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/10">
                <span>Nosso Universo</span>
                <span className="text-rose-400 font-bold">Ao vivo</span>
              </div>
            </>
          )}

          {selectedStyle === 'counter_distance' && (
            <>
              <div className="z-10 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-rose-300 font-bold">
                  <CalendarHeart size={14} weight="fill" />
                  <span>Juntos há {days} dias</span>
                </div>
                <div className="w-6 h-6">
                  <MaryCupidAvatar state="love" size={24} interactive={false} />
                </div>
              </div>

              <div className="z-10 my-auto">
                <div className="flex items-center gap-1.5 text-xs text-white font-bold">
                  <MapPin size={14} className="text-amber-400" weight="fill" />
                  <span>{distance}</span>
                </div>
                <span className="text-[10px] text-slate-400">Distância agora</span>
              </div>

              <div className="z-10 text-[9px] text-slate-400 text-right">
                mary.pyxie.com.br
              </div>
            </>
          )}

          {selectedStyle === 'polaroid' && (
            <>
              <div className="z-10 flex items-center justify-between text-[11px] font-bold text-white">
                <span>Foto do Dia</span>
                <span className="text-rose-400">❤️</span>
              </div>

              <div className="z-10 my-auto flex items-center gap-2">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/20 shrink-0">
                  {widgetData?.latestFavoritePhoto?.thumbUrl ? (
                    <img src={widgetData.latestFavoritePhoto.thumbUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">📸</div>
                  )}
                </div>
                <span className="text-[10px] text-slate-300 line-clamp-2">
                  {widgetData?.latestFavoritePhoto?.caption || 'Amor que cresce a cada segundo.'}
                </span>
              </div>

              <div className="z-10 text-[9px] text-slate-400 text-right font-mono">
                Widget Nosso Universo
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-[11px] text-center text-slate-400">
        Instale o aplicativo pelo navegador clicando em <b>"Adicionar à Tela Inicial"</b> para habilitar atalhos rápidos e widgets!
      </p>
    </div>
  );
}
