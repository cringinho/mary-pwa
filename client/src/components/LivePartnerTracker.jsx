import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  BatteryCharging, 
  BatteryFull, 
  BatteryMedium, 
  BatteryWarning, 
  BatteryLow,
  NavigationArrow, 
  ShieldCheck, 
  ArrowsClockwise, 
  Eye, 
  Moon, 
  SunDim, 
  Sparkle,
  HeartStraight
} from '@phosphor-icons/react';
import L from 'leaflet';
import { usePartnerTelemetry } from '../hooks/usePartnerTelemetry';
import MaryCupidAvatar from './mary/MaryCupidAvatar';

export default function LivePartnerTracker() {
  const {
    selfTelemetry,
    partnerTelemetry,
    partnerInfo,
    distanceKm,
    distanceString,
    hasPartner,
    geoError,
    wakeLockActive,
    toggleKeepAwake,
    refreshPartner
  } = usePartnerTelemetry();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const lineLayerRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inicialização do Mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Coordenadas padrão (São Paulo como fallback)
    const defaultLat = selfTelemetry?.latitude || -23.55052;
    const defaultLng = selfTelemetry?.longitude || -46.633308;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 14,
      zoomControl: false
    });

    // Camada de tiles escura/voyager com CARTO Basemaps API Key oficial
    const cartoKey = import.meta.env.VITE_CARTO_API_KEY || 'cb1_4m3d_1_00288d0ac8c2a9be557cf5c6';
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    lineLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Atualizar marcadores quando as coordenadas mudarem
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !lineLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    lineLayerRef.current.clearLayers();

    const bounds = [];

    // Marcador do Usuário Atual (Eu)
    if (selfTelemetry?.latitude && selfTelemetry?.longitude) {
      const selfLat = selfTelemetry.latitude;
      const selfLng = selfTelemetry.longitude;
      bounds.push([selfLat, selfLng]);

      const selfIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-rose-500/30 animate-ping"></span>
            <div class="w-10 h-10 rounded-full border-2 border-white shadow-lg bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
              Eu
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      L.marker([selfLat, selfLng], { icon: selfIcon })
        .addTo(markersLayerRef.current)
        .bindPopup('<b>Você está aqui</b>');
    }

    // Marcador do Parceiro
    if (partnerTelemetry?.latitude && partnerTelemetry?.longitude) {
      const pLat = partnerTelemetry.latitude;
      const pLng = partnerTelemetry.longitude;
      bounds.push([pLat, pLng]);

      const partnerName = partnerInfo?.nickname || partnerInfo?.displayName || 'Meu Amor';
      const partnerAvatar = partnerInfo?.avatarUrl;

      const partnerIcon = L.divIcon({
        className: 'custom-map-pin-partner',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-10 h-10 rounded-full bg-amber-400/40 animate-pulse"></span>
            <div class="w-11 h-11 rounded-full border-2 border-amber-300 shadow-xl overflow-hidden bg-slate-900 flex items-center justify-center">
              ${partnerAvatar 
                ? `<img src="${partnerAvatar}" class="w-full h-full object-cover" />` 
                : `<span class="text-amber-300 font-bold text-xs">❤️</span>`
              }
            </div>
            <div class="absolute -bottom-2 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow">
              ${partnerName.slice(0, 8)}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      L.marker([pLat, pLng], { icon: partnerIcon })
        .addTo(markersLayerRef.current)
        .bindPopup(`<b>${partnerName}</b><br/>${partnerTelemetry.batteryLevel ? `Bateria: ${partnerTelemetry.batteryLevel}%` : ''}`);
    }

    // Traçar linha pontilhada de amor entre os dois se ambos tiverem localização
    if (bounds.length === 2) {
      const polyline = L.polyline(bounds, {
        color: '#F43F5E',
        weight: 3,
        opacity: 0.8,
        dashArray: '8, 8'
      }).addTo(lineLayerRef.current);

      map.fitBounds(polyline.getBounds(), { padding: [60, 60], maxZoom: 16 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  }, [selfTelemetry, partnerTelemetry, partnerInfo]);

  // Recarregar manual
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshPartner();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Abrir rota no app de mapas
  const handleOpenNavigation = () => {
    if (!partnerTelemetry?.latitude || !partnerTelemetry?.longitude) return;
    const dest = `${partnerTelemetry.latitude},${partnerTelemetry.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    window.open(url, '_blank');
  };

  // Renderizar ícone de bateria adequado
  const renderBatteryIcon = (level, charging) => {
    if (charging) return <BatteryCharging className="w-5 h-5 text-emerald-400 animate-pulse" weight="fill" />;
    if (level === null || level === undefined) return <BatteryMedium className="w-5 h-5 text-slate-400" />;
    if (level > 75) return <BatteryFull className="w-5 h-5 text-emerald-400" weight="fill" />;
    if (level > 25) return <BatteryMedium className="w-5 h-5 text-amber-400" weight="fill" />;
    if (level > 15) return <BatteryLow className="w-5 h-5 text-orange-400" weight="fill" />;
    return <BatteryWarning className="w-5 h-5 text-rose-500 animate-bounce" weight="fill" />;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-28 pt-4 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col gap-4">
      
      {/* 1. Header com Cupido Mary */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-4 sm:p-5 flex items-center justify-between border border-[var(--border-card)] shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 flex-shrink-0">
            <MaryCupidAvatar state={distanceKm && distanceKm < 0.5 ? 'excited' : 'welcoming'} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkle weight="fill" className="w-3.5 h-3.5" />
                Rastreio & Presença ao Vivo
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-rose-400">
              {distanceString}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {hasPartner ? `Conectado(a) com ${partnerInfo?.nickname || partnerInfo?.displayName || 'seu amor'}` : 'Aguardando o parceiro conectar'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white"
          title="Atualizar localização"
        >
          <ArrowsClockwise className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
        </button>
      </motion.div>

      {/* 2. Container do Mapa Interativo */}
      <div className="relative w-full h-[380px] sm:h-[460px] rounded-3xl overflow-hidden glass-card border border-[var(--border-card)] shadow-xl">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Alerta de erro de permissão */}
        {geoError && (
          <div className="absolute top-4 left-4 right-4 bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs p-3 rounded-2xl backdrop-blur-md z-10 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{geoError}</span>
          </div>
        )}

        {/* Overlay flutuante com dados rápidos do parceiro */}
        {partnerTelemetry && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-slate-950/85 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl z-10 flex flex-col gap-2.5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-white">
                  {partnerInfo?.nickname || partnerInfo?.displayName || 'Meu Amor'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full font-mono">
                {renderBatteryIcon(partnerTelemetry.batteryLevel, partnerTelemetry.isCharging)}
                <span>{partnerTelemetry.batteryLevel !== null ? `${partnerTelemetry.batteryLevel}%` : 'Bateria OK'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenNavigation}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <NavigationArrow className="w-4 h-4" weight="fill" />
                Traçar Rota até Meu Amor
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* 3. Cards de Telemetria e Modo Me Acompanhe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Card 1: Status de Bateria do Casal */}
        <div className="glass-card rounded-2xl p-4 border border-[var(--border-card)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <BatteryFull className="w-4 h-4" weight="fill" />
              Sintonia de Bateria
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Ao vivo</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Você */}
            <div className="bg-white/5 rounded-xl p-2.5 flex flex-col gap-1 border border-white/5">
              <span className="text-[11px] text-[var(--text-muted)]">Sua Bateria</span>
              <div className="flex items-center gap-1.5 font-bold text-white">
                {renderBatteryIcon(selfTelemetry?.batteryLevel, selfTelemetry?.isCharging)}
                <span>{selfTelemetry?.batteryLevel !== null ? `${selfTelemetry?.batteryLevel}%` : 'Carregando...'}</span>
              </div>
            </div>

            {/* Parceiro */}
            <div className="bg-white/5 rounded-xl p-2.5 flex flex-col gap-1 border border-white/5">
              <span className="text-[11px] text-[var(--text-muted)]">{partnerInfo?.nickname || 'Parceiro'}</span>
              <div className="flex items-center gap-1.5 font-bold text-white">
                {renderBatteryIcon(partnerTelemetry?.batteryLevel, partnerTelemetry?.isCharging)}
                <span>{partnerTelemetry?.batteryLevel !== null ? `${partnerTelemetry?.batteryLevel}%` : 'Via App'}</span>
              </div>
            </div>
          </div>

          {partnerTelemetry?.batteryLevel !== null && partnerTelemetry?.batteryLevel < 20 && !partnerTelemetry?.isCharging && (
            <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl flex items-center gap-1.5">
              <BatteryWarning className="w-4 h-4 text-amber-400 flex-shrink-0" weight="fill" />
              <span>O celular do seu amor está abaixo de 20%! Lembre-o de recarregar.</span>
            </div>
          )}
        </div>

        {/* Card 2: Modo "Me Acompanhe até em Casa" (Screen Wake Lock) */}
        <div className="glass-card rounded-2xl p-4 border border-[var(--border-card)] flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" weight="fill" />
                Me Acompanhe até em Casa
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${wakeLockActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400'}`}>
                {wakeLockActive ? 'Ativado' : 'Inativo'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Mantém a tela acesa e atualiza o trajeto de GPS em alta precisão enquanto você volta para casa.
            </p>
          </div>

          <button
            onClick={toggleKeepAwake}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
              wakeLockActive 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg' 
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
          >
            {wakeLockActive ? (
              <>
                <SunDim className="w-4 h-4" weight="fill" />
                Desativar Modo de Proteção
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" weight="fill" />
                Ativar Modo Me Acompanhe (Tela Acesa)
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
