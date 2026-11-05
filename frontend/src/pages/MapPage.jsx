import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChipGroup from '../components/ChipGroup.jsx';
import LocationBar from '../components/LocationBar.jsx';
import MapView from '../components/MapView.jsx';
import PointItem from '../components/PointItem.jsx';
import PointPopup from '../components/PointPopup.jsx';
import SearchInput from '../components/SearchInput.jsx';
import useUserLocation, { toLatLngParams } from '../hooks/useUserLocation.js';
import { buscarMateriais, listarPontosColeta } from '../services/api.js';
import { toPoint } from '../utils/pontos.js';
import styles from './MapPage.module.css';

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const byName = (a, b) => a.localeCompare(b, 'pt-BR');

export default function MapPage() {
  // Filtros de material, bairro e tipo ficam na URL: /mapa?material=7&bairro=Cervezão&tipo=Ecoponto
  const [searchParams, setSearchParams] = useSearchParams();
  const material = searchParams.get('material') ?? '';
  const bairro = searchParams.get('bairro') ?? '';
  const tipo = searchParams.get('tipo') ?? '';

  const [allPoints, setAllPoints] = useState([]); // sem filtro: monta as opções de bairro e tipo
  const [materials, setMaterials] = useState([]);
  const [points, setPoints] = useState([]); // resultado filtrado pela API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const location = useUserLocation();
  const [picking, setPicking] = useState(false); // modo "escolher no mapa"

  // Opções dos filtros (uma vez)
  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([listarPontosColeta({}, ctrl.signal), buscarMateriais(undefined, ctrl.signal)])
      .then(([pontos, mats]) => {
        setAllPoints(pontos.map(toPoint));
        setMaterials(mats);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError('Não foi possível carregar os filtros. Verifique se a API está rodando.');
      });
    return () => ctrl.abort();
  }, []);

  // Pontos filtrados pela API sempre que material, bairro, tipo ou o local do usuário mudam.
  // Com local, a API devolve a distância e ordena do mais próximo para o mais distante.
  const userPosition = location.position;
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    listarPontosColeta({ material, bairro, tipo, ...toLatLngParams(userPosition) }, ctrl.signal)
      .then((lista) => {
        setPoints(lista.map(toPoint));
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setError('Não foi possível carregar os pontos. Verifique se a API está rodando.');
          setLoading(false);
        }
      });
    return () => ctrl.abort();
  }, [material, bairro, tipo, userPosition]);

  const typeOptions = useMemo(() => {
    const tipos = [...new Set(allPoints.map((p) => p.typeLabel))].sort(byName);
    return [{ value: '', label: 'Todos' }, ...tipos.map((t) => ({ value: t, label: `${t}s` }))];
  }, [allPoints]);
  const bairros = useMemo(
    () => [...new Set(allPoints.map((p) => p.bairro).filter(Boolean))].sort(byName),
    [allPoints],
  );

  // Busca por texto continua no navegador, por cima do resultado da API
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return q ? points.filter((p) => normalize(`${p.name} ${p.fullAddress}`).includes(q)) : points;
  }, [points, query]);

  // Se o ponto selecionado sair do filtro, fecha o card
  useEffect(() => {
    if (selectedId != null && !filtered.some((p) => p.id === selectedId)) setSelectedId(null);
  }, [filtered, selectedId]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };
  const hasFilters = Boolean(material || bairro || tipo || query);
  const clearFilters = () => {
    setSearchParams({}, { replace: true });
    setQuery('');
  };

  const selected = filtered.find((p) => p.id === selectedId) ?? null;
  const semCoordenada = filtered.filter((p) => !p.position).length;
  const notice =
    !loading && !error && semCoordenada
      ? `${semCoordenada} ponto(s) ainda sem localização no mapa — aparecem só na lista.`
      : null;

  return (
    <div className={styles.page}>
      <aside className={styles.panel}>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nome ou endereço"
          aria-label="Buscar por nome ou endereço"
        />

        <LocationBar location={location} picking={picking} onTogglePick={() => setPicking((v) => !v)} />

        <div className={styles.filters}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Material</span>
            <select className={styles.select} value={material} onChange={(e) => setFilter('material', e.target.value)}>
              <option value="">Todos os materiais</option>
              {materials.map((m) => (
                <option key={m.id_material} value={m.id_material}>{m.nome}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Bairro</span>
            <select className={styles.select} value={bairro} onChange={(e) => setFilter('bairro', e.target.value)}>
              <option value="">Todos os bairros</option>
              {bairros.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
        </div>

        <ChipGroup
          options={typeOptions}
          value={tipo}
          onChange={(v) => setFilter('tipo', v)}
          label="Tipo de ponto"
          className={styles.chips}
        />

        <div className={styles.resultBar}>
          <span className={styles.count}>
            {loading ? 'Carregando...' : `${filtered.length} ponto(s) encontrado(s)`}
          </span>
          {hasFilters && (
            <button type="button" className={styles.clear} onClick={clearFilters}>Limpar filtros</button>
          )}
        </div>

        <div className={styles.list}>
          {error ? (
            <p className={styles.empty}>{error}</p>
          ) : !loading && !filtered.length ? (
            <p className={styles.empty}>Nenhum ponto encontrado com esses filtros.</p>
          ) : (
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
          )}
        </div>
      </aside>

      <div className={styles.mapArea}>
        <MapView
          points={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          notice={notice}
          userPosition={userPosition}
          onMapClick={
            picking
              ? (pos) => {
                  location.setManualLocation(pos);
                  setPicking(false);
                }
              : undefined
          }
        >
          {selected && <PointPopup point={selected} onClose={() => setSelectedId(null)} />}
        </MapView>
      </div>
    </div>
  );
}
