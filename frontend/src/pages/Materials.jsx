import { useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import ChipGroup from '../components/ChipGroup.jsx';
import PointItem from '../components/PointItem.jsx';
import SearchInput from '../components/SearchInput.jsx';
import { materials } from '../data/materials.js';
import { points } from '../data/points.js';
import styles from './Materials.module.css';

// Deixa minúsculo e tira acento, assim "óleo" e "oleo" dão no mesmo
const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export default function Materials() {
  // Material escolhido pelos chips (começa em Pilha, igual ao protótipo)
  const [selectedId, setSelectedId] = useState('pilha');
  const [query, setQuery] = useState('');

  const chipOptions = materials.map((m) => ({ value: m.id, label: m.chip }));

  // Busca por texto: seleciona o primeiro material cujo nome/palavra-chave combina.
  const matched = useMemo(() => {
    const q = normalize(query);
    if (!q) return null;
    return materials.find((m) => [m.name, m.chip, ...m.keywords].some((k) => normalize(k).includes(q))) ?? 'none';
  }, [query]);

  // Se a busca achou algo, ela manda; senão vale o chip selecionado
  const material = matched && matched !== 'none' ? matched : materials.find((m) => m.id === selectedId);
  const notFound = matched === 'none';
  // Pontos que aceitam o material atual
  const acceptingPoints = points.filter((p) => !p.mapOnly && p.materials.includes(material.id));

  // Clicou num chip: seleciona e limpa a busca pra não brigar com ela
  const handleChip = (id) => {
    setSelectedId(id);
    setQuery('');
  };

  return (
    <>
      <section className={styles.hero}>
        <img src="/assets/search-bg.png" alt="" className={styles.heroBg} />
        <h1 className={styles.title}>Buscar material</h1>
        <p className={styles.subtitle}>Digite o material que deseja descartar e veja as orientações corretas</p>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Ex: pilha, óleo de cozinha, eletrônico..."
          className={styles.search}
          aria-label="Buscar material"
        />
        <ChipGroup
          options={chipOptions}
          value={material.id}
          onChange={handleChip}
          label="Materiais comuns"
          className={styles.chips}
        />
      </section>

      <section className={styles.results}>
        {notFound ? (
          <div className={`${styles.card} ${styles.empty}`}>
            <p className={styles.emptyTitle}>Nenhum material encontrado para “{query}”.</p>
            <p className={styles.emptyText}>Tente outro termo ou escolha uma das opções acima.</p>
          </div>
        ) : (
          <>
            <article className={styles.card}>
              <header className={styles.cardHeader}>
                <span className={styles.matIcon}>
                  {material.icon ? (
                    <img src={material.icon} alt="" width="30" height="30" />
                  ) : (
                    <span className={styles.matInitial}>{material.chip[0]}</span>
                  )}
                </span>
                <div className={styles.cardHeading}>
                  <h2 className={styles.matName}>{material.name}</h2>
                  {material.recyclable ? (
                    <span className={styles.badge}>
                      <img src="/assets/icon-check.svg" alt="" width="12" height="12" />
                      Reciclável
                    </span>
                  ) : (
                    <span className={`${styles.badge} ${styles.badgeWarn}`}>Não reciclável</span>
                  )}
                </div>
              </header>
              <dl className={styles.info}>
                <InfoRow label="Descarte" value={material.disposal} />
                <InfoRow label="Preparo" value={material.preparation} />
                <InfoRow label="Categoria" value={material.category} />
                <InfoRow label="Por quê?" value={material.why} />
              </dl>
            </article>

            <aside className={styles.side}>
              <h3 className={styles.sideTitle}>Pontos que aceitam este material</h3>
              {acceptingPoints.length ? (
                acceptingPoints.map((p) => <PointItem key={p.id} point={p} size="sm" />)
              ) : (
                <p className={styles.sideEmpty}>Nenhum ponto próximo aceita este material ainda.</p>
              )}
              <Button to="/mapa" className={styles.mapButton}>
                <img src="/assets/icon-pin-white-sm.svg" alt="" width="16" height="16" />
                Ver no mapa
              </Button>
            </aside>
          </>
        )}
      </section>
    </>
  );
}

// Uma linha do card (rótulo à esquerda, texto à direita)
function InfoRow({ label, value }) {
  return (
    <div className={styles.row}>
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={styles.rowValue}>{value}</dd>
    </div>
  );
}
