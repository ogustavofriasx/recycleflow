import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapView.module.css';

// Centro de Rio Claro (SP), usado quando ainda não há pontos com coordenada
const RIO_CLARO = [-22.4114, -47.5614];
const ZOOM_CIDADE = 13;
const ZOOM_PONTO = 16;

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

// Move o mapa: enquadra todos os pontos ao carregar e voa até o ponto selecionado
function Camera({ points, selected }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0].position, ZOOM_PONTO);
    else map.fitBounds(points.map((p) => p.position), { padding: [48, 48], maxZoom: ZOOM_PONTO });
  }, [map, points]);

  useEffect(() => {
    if (selected?.position) map.flyTo(selected.position, Math.max(map.getZoom(), ZOOM_PONTO - 1), { duration: 0.6 });
  }, [map, selected]);

  return null;
}

/**
 * Mapa interativo (Leaflet + OpenStreetMap).
 * Recebe os pontos já convertidos (utils/pontos.js); só os que têm `position` viram marcador.
 * `children` é o card do ponto selecionado, desenhado por cima do mapa.
 */
export default function MapView({ points, selectedId, onSelect, children, notice }) {
  const located = useMemo(() => points.filter((p) => p.position), [points]);
  const selected = located.find((p) => p.id === selectedId) ?? null;

  return (
    <div className={styles.wrapper}>
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
            <Tooltip direction="top" offset={[0, -40]}>{p.name}</Tooltip>
          </Marker>
        ))}
        <Camera points={located} selected={selected} />
      </MapContainer>

      {notice && <p className={styles.notice}>{notice}</p>}
      {children && <div className={styles.overlay}>{children}</div>}
    </div>
  );
}
