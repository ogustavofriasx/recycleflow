import { useMemo, useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import MapPlaceholder from '../components/MapPlaceholder.jsx';
import PointItem from '../components/PointItem.jsx';
import PointPopup from '../components/PointPopup.jsx';
import SearchInput from '../components/SearchInput.jsx';
import { points, pointTypeFilters } from '../data/points.js';
import styles from './MapPage.module.css';

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function MapPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('todos');
  const [selectedId, setSelectedId] = useState(null);

  // Filtra por tipo (chips) e por texto ao mesmo tempo; useMemo evita refazer à toa
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return points.filter(
      (p) =>
        (type === 'todos' || p.type === type) &&
        (!q || normalize(`${p.name} ${p.address} ${p.fullAddress}`).includes(q)),
    );
  }, [query, type]);

  const selected = points.find((p) => p.id === selectedId) ?? null;

  return (
    <div className={styles.page}>
      <aside className={styles.panel}>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por bairro ou endereço"
          aria-label="Buscar por bairro ou endereço"
        />
        <ChipGroup options={pointTypeFilters} value={type} onChange={setType} label="Tipo de ponto" className={styles.chips} />
        <div className={styles.list}>
          {filtered.length ? (
            filtered.map((p, i) => (
              <PointItem
                key={p.id}
                point={p}
                divider={i > 0}
                selected={p.id === selectedId}
                // Clicar de novo no mesmo ponto fecha o card
                onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
              />
            ))
          ) : (
            <p className={styles.empty}>Nenhum ponto encontrado.</p>
          )}
        </div>
      </aside>

      <div className={styles.mapArea}>
        {/* Área reservada pro mapa — o card do ponto aparece aqui dentro */}
        <MapPlaceholder>
          {selected && <PointPopup point={selected} onClose={() => setSelectedId(null)} />}
        </MapPlaceholder>
      </div>
    </div>
  );
}
