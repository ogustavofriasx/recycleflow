import { useCallback, useEffect, useState } from 'react';

// Guarda o local só nesta aba (sessionStorage), para a Home e o Mapa usarem o mesmo.
// Nada é enviado ao servidor além da consulta de pontos próximos.
const STORAGE_KEY = 'recycleflow:local-usuario';

function lerSalvo() {
  try {
    const salvo = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (Array.isArray(salvo?.position) && salvo.position.length === 2) return salvo;
  } catch {
    // storage indisponível ou valor inválido: começa sem local
  }
  return null;
}

function salvar(valor) {
  try {
    if (valor) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(valor));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora: o local continua valendo só nesta página
  }
}

const MENSAGENS = {
  1: 'Permissão de localização negada. Você pode escolher seu local clicando no mapa.',
  2: 'Não foi possível descobrir sua localização agora.',
  3: 'A localização demorou demais para responder. Tente de novo.',
};

/**
 * Local do usuário para a busca de pontos próximos.
 * source: 'gps' (navegador) ou 'mapa' (clique no mapa).
 * status: idle | locating | ok | error
 */
export default function useUserLocation() {
  const [location, setLocation] = useState(lerSalvo); // { position: [lat, lng], source }
  const [status, setStatus] = useState(location ? 'ok' : 'idle');
  const [error, setError] = useState(null);

  useEffect(() => salvar(location), [location]);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('Seu navegador não permite obter a localização. Escolha o local clicando no mapa.');
      return;
    }
    setStatus('locating');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ position: [pos.coords.latitude, pos.coords.longitude], source: 'gps' });
        setStatus('ok');
      },
      (err) => {
        setStatus('error');
        setError(MENSAGENS[err.code] ?? MENSAGENS[2]);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const setManualLocation = useCallback((position) => {
    setLocation({ position, source: 'mapa' });
    setStatus('ok');
    setError(null);
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setStatus('idle');
    setError(null);
  }, []);

  return {
    position: location?.position ?? null,
    source: location?.source ?? null,
    status,
    error,
    requestLocation,
    setManualLocation,
    clearLocation,
  };
}

// Parâmetros lat/lng para a API (5 casas decimais ≈ 1 m de precisão)
export const toLatLngParams = (position) =>
  position ? { lat: position[0].toFixed(5), lng: position[1].toFixed(5) } : {};
