import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Cálculo da distância geográfica (fórmula de Haversine)
 * @returns {number|null} Distância em quilômetros
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;

  const R = 6371; // Raio da terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formata distância amigável (em metros ou km)
 */
export function formatDistanceString(km) {
  if (km === null || km === undefined) return 'Calculando...';
  if (km < 0.05) return 'Juntinhos no mesmo lugar! ❤️';
  if (km < 1) return `A ${Math.round(km * 1000)} metros`;
  if (km < 10) return `A ${km.toFixed(1)} km`;
  return `A ${Math.round(km)} km`;
}

/**
 * Hook para presença em tempo real: localização geográfica + status de bateria
 * Blindado contra ausência da Battery Status API no iOS/Safari
 */
export function usePartnerTelemetry() {
  const [selfTelemetry, setSelfTelemetry] = useState(null);
  const [partnerTelemetry, setPartnerTelemetry] = useState(null);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [hasPartner, setHasPartner] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const watchIdRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Leitura segura da bateria (blindagem para iOS/Safari)
  const getBatteryStatus = useCallback(async () => {
    if (
      typeof navigator !== 'undefined' &&
      'getBattery' in navigator &&
      typeof navigator.getBattery === 'function'
    ) {
      try {
        const battery = await navigator.getBattery();
        return {
          level: Math.round(battery.level * 100),
          charging: Boolean(battery.charging)
        };
      } catch (e) {
        return { level: null, charging: false };
      }
    }
    return { level: null, charging: false };
  }, []);

  // Enviar ping de telemetria para a API
  const sendTelemetryPing = useCallback(async (coords) => {
    try {
      const battery = await getBatteryStatus();
      await fetch('/api/telemetry/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          speed: coords.speed,
          batteryLevel: battery.level,
          isCharging: battery.charging
        })
      });
    } catch (err) {
      console.warn('Falha ao enviar ping de telemetria:', err);
    }
  }, [getBatteryStatus]);

  // Buscar telemetria do parceiro
  const fetchPartnerTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry/partner');
      if (!res.ok) return;
      const data = await res.json();

      setHasPartner(Boolean(data.hasPartner));
      if (data.partner) {
        setPartnerInfo(data.partner);
      }
      if (data.partnerTelemetry) {
        setPartnerTelemetry(data.partnerTelemetry);
      }
      if (data.selfTelemetry) {
        setSelfTelemetry(data.selfTelemetry);
      }
    } catch (err) {
      console.warn('Falha ao obter telemetria do parceiro:', err);
    }
  }, []);

  // Calcular distância entre o casal sempre que uma das coordenadas mudar
  useEffect(() => {
    if (selfTelemetry?.latitude && partnerTelemetry?.latitude) {
      const d = calculateDistance(
        selfTelemetry.latitude,
        selfTelemetry.longitude,
        partnerTelemetry.latitude,
        partnerTelemetry.longitude
      );
      setDistanceKm(d);
    }
  }, [selfTelemetry, partnerTelemetry]);

  // Ativar monitoramento contínuo de GPS
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocalização não suportada neste dispositivo.');
      return;
    }

    const onGeoSuccess = (position) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed
      };
      setSelfTelemetry(prev => ({
        ...prev,
        ...coords,
        updatedAt: new Date().toISOString()
      }));
      setGeoError(null);
      setIsWatching(true);
      sendTelemetryPing(coords);
    };

    const onGeoError = (err) => {
      console.warn('Erro de geolocalização:', err.message);
      setGeoError('Permissão de localização não concedida ou indisponível.');
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onGeoSuccess, onGeoError, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000
    });

    // Polling a cada 20 segundos para atualizar dados do parceiro
    fetchPartnerTelemetry();
    const interval = setInterval(() => {
      fetchPartnerTelemetry();
    }, 20000);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      clearInterval(interval);
    };
  }, [fetchPartnerTelemetry, sendTelemetryPing]);

  // Modo Me Acompanhe até em Casa (Screen Wake Lock)
  const toggleKeepAwake = async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!wakeLockActive) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          setWakeLockActive(true);
        } else {
          await wakeLockRef.current?.release();
          wakeLockRef.current = null;
          setWakeLockActive(false);
        }
      } catch (e) {
        console.warn('WakeLock erro:', e);
      }
    }
  };

  return {
    selfTelemetry,
    partnerTelemetry,
    partnerInfo,
    distanceKm,
    distanceString: formatDistanceString(distanceKm),
    hasPartner,
    isWatching,
    geoError,
    wakeLockActive,
    toggleKeepAwake,
    refreshPartner: fetchPartnerTelemetry
  };
}
