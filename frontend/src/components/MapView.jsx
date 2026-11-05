import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapView.module.css';

// Centro de Rio Claro (SP), usado quando ainda não há pontos com coordenada
const RIO_CLARO = [-22.4114, -47.5614];
const ZOOM_CIDADE = 13;
const ZOOM_PONTO = 16;
// Com o local do usuário, o mapa enquadra ele e os N pontos mais próximos
const PROXIMOS_NO_ENQUADRAMENTO = 3;

// Pino em SVG (divIcon), sem depender das imagens padrão do Leaflet
const pinSvg = (cor) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44" aria-hidden="true">
    <path d="M17 1C8.2 1 1 8 1 16.8 1 28.6 17 43 17 43s16-14.4 16-26.2C33 8 25.8 1 17 1z"
          fill="${cor}" stroke="#fff" stroke-width="2"/>
    <circle cx="17" cy="16.5" r="6" fill="#fff"/>
  </svg>`;

const criarIcone = (cor) =>
  L.divIcon({ html: pinSvg(cor), className: styles.pin, iconSize: [34, 44], iconAnchor: [17, 43] });

const ICONE = criarIcone('#087ccc'); // --blue-primary
const ICONE_SELECIONADO = criarIcone('#53bc22'); // --green-accent
// "Você está aqui": ponto com halo
const ICONE_USUARIO = L.divIcon({
  html: `<span class="${styles.userDot}"></span>`,
  className: styles.pin,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Move o mapa: enquadra os pontos (ou o usuário + os mais próximos) e voa até o selecionado
function Camera({ points, selected, userPosition }) {
  const map = useMap();

  useEffect(() => {
    const alvo = userPosition
      ? [userPosition, ...points.slice(0, PROXIMOS_NO_ENQUADRAMENTO).map((p) => p.position)]
      : points.map((p) => p.position);
    if (!alvo.length) return;
    if (alvo.length === 1) map.setView(alvo[0], ZOOM_PONTO - 1);
    else map.fitBounds(alvo, { padding: [48, 48], maxZoom: ZOOM_PONTO });
  }, [map, points, userPosition]);

  useEffect(() => {
    if (selected?.position) map.flyTo(selected.position, Math.max(map.getZoom(), ZOOM_PONTO - 1), { duration: 0.6 });
  }, [map, selected]);

  return null;
}

// Repassa o clique no mapa (modo "escolher no mapa")
function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/**
 * Mapa interativo (Leaflet + OpenStreetMap).
 * Recebe os pontos já convertidos (utils/pontos.js); só os que têm `position` viram marcador.
 * `userPosition` desenha "Você está aqui"; `onMapClick` (se passado) recebe [lat, lng] do clique.
 * `children` é o card do ponto selecionado, desenhado por cima do mapa.
 */
export default function MapView({ points, selectedId, onSelect, children, notice, userPosition, onMapClick }) {
  const located = useMemo(() => points.filter((p) => p.position), [points]);
  const selected = located.find((p) => p.id === selectedId) ?? null;

  return (
    <div className={`${styles.wrapper} ${onMapClick ? styles.picking : ''}`}>
      <MapContainer center={RIO_CLARO} zoom={ZOOM_CIDADE} className={styles.map} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((p) => (
          <Marker
            key={p.id}
            position={p.position}
            icon={p.id === selectedId ? ICONE_SELECIONADO : ICONE}
            zIndexOffset={p.id === selectedId ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(p.id === selectedId ? null : p.id) }}
            title={p.name}
            keyboard
          >
            <Tooltip direction="top" offset={[0, -40]}>
              {p.name}{p.distance ? ` · ${p.distance}` : ''}
            </Tooltip>
          </Marker>
        ))}
        {userPosition && (
          <Marker position={userPosition} icon={ICONE_USUARIO} zIndexOffset={2000} interactive={false}>
            {/* Embaixo do ponto, para não cobrir um pino que esteja logo acima */}
            <Tooltip direction="bottom" offset={[0, 12]} permanent>Você está aqui</Tooltip>
          </Marker>
        )}
        <Camera points={located} selected={selected} userPosition={userPosition} />
        <ClickHandler onMapClick={onMapClick} />
      </MapContainer>

      {notice && <p className={styles.notice}>{notice}</p>}
      {children && <div className={styles.overlay}>{children}</div>}
    </div>
  );
}
