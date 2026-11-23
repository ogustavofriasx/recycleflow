import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import ChipGroup from '../components/ChipGroup.jsx';
import GameBanner from '../components/GameBanner.jsx';
import MaterialSearch from '../components/MaterialSearch.jsx';
import PointItem from '../components/PointItem.jsx';
import { buscarMateriais, obterMaterial } from '../services/api.js';
import styles from './Materials.module.css';

// Ícone do card: primeiro o do material, depois o da categoria (campo `icone` de
// categoria_material) e, se nenhum existir, o símbolo de reciclagem
const DEFAULT_ICON = '/assets/icon-recycle-white.svg';

const CATEGORY_ICONS = {
  battery: '/assets/icon-battery-white.svg',
  pill: '/assets/icon-medicine-white.svg',
  droplet: '/assets/icon-drop-white.svg',
};

const MATERIAL_ICONS = {
  medicamentos: '/assets/icon-medicine-white.svg',
  'papel e papelão': '/assets/icon-cardboard-white.svg',
  vidro: '/assets/icon-glass-white.svg',
  'óleo de cozinha': '/assets/icon-drop-white.svg',
};

// Filtros especiais além das categorias do banco
const COMMON = 'comuns';
const ALL = 'todos';
// Se nenhum material estiver marcado como destaque no admin, mostra os primeiros
const COMMON_FALLBACK = 8;

// Agrupa os materiais por categoria (maiores primeiro) para os filtros
function groupByCategory(materials) {
  const groups = new Map();
  materials.forEach((m) => {
    if (!groups.has(m.id_categoria)) {
      groups.set(m.id_categoria, { id: m.id_categoria, nome: m.categoria, cor: m.categoria_cor, items: [] });
    }
    groups.get(m.id_categoria).items.push(m);
  });
  return [...groups.values()].sort((a, b) => b.items.length - a.items.length || a.nome.localeCompare(b.nome, 'pt-BR'));
}

const toChips = (materials) => materials.map((m) => ({ value: m.id_material, label: m.nome }));

// Converte um ponto da API para o formato que o PointItem espera
const toPointItem = (p) => ({
  id: p.id_ponto,
  name: p.nome,
  address: [[p.logradouro, p.numero].filter(Boolean).join(', '), p.bairro].filter(Boolean).join(' - '),
  distance: '', // distância entra na etapa 7 (pontos próximos ao usuário)
});

export default function Materials() {
  const [allMaterials, setAllMaterials] = useState([]);
  const [category, setCategory] = useState(COMMON); // COMMON | ALL | id_categoria
  const [selectedId, setSelectedId] = useState(null);
  const [material, setMaterial] = useState(null); // detalhe + pontos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) Carrega a lista para os filtros e seleciona Pilha (igual ao protótipo) ou o primeiro
  useEffect(() => {
    const ctrl = new AbortController();
    buscarMateriais(undefined, ctrl.signal)
      .then((lista) => {
        setAllMaterials(lista);
        const inicial = lista.find((m) => m.palavras_chave.includes('pilha')) ?? lista[0];
        setSelectedId(inicial?.id_material ?? null);
        if (!inicial) setLoading(false);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setError('Não foi possível carregar os materiais. Verifique se a API está rodando.');
          setLoading(false);
        }
      });
    return () => ctrl.abort();
  }, []);

  // 2) Carrega o detalhe (com pontos que aceitam) do material selecionado
  useEffect(() => {
    if (selectedId == null) return undefined;
    const ctrl = new AbortController();
    setLoading(true);
    obterMaterial(selectedId, ctrl.signal)
      .then((m) => {
        setMaterial(m);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setError('Erro ao carregar o material.');
          setLoading(false);
        }
      });
    return () => ctrl.abort();
  }, [selectedId]);

  const categories = useMemo(() => groupByCategory(allMaterials), [allMaterials]);
  const commonMaterials = useMemo(() => {
    const marked = allMaterials.filter((m) => m.destaque);
    return marked.length ? marked : allMaterials.slice(0, COMMON_FALLBACK);
  }, [allMaterials]);
  const currentGroup = categories.find((c) => c.id === category);

  // Escolheu pela busca: seleciona e abre a categoria do material, para o chip aparecer marcado
  const handleSearchSelect = (m) => {
    setSelectedId(m.id_material);
    const isCommon = category === COMMON && commonMaterials.some((c) => c.id_material === m.id_material);
    if (!isCommon && category !== ALL) setCategory(m.id_categoria);
  };

  const acceptingPoints = material?.pontos?.map(toPointItem) ?? [];
  const icon = material && (
    MATERIAL_ICONS[material.nome.toLocaleLowerCase('pt-BR')] ??
    CATEGORY_ICONS[material.categoria_icone] ??
    DEFAULT_ICON
  );

  return (
    <>
      <section className={styles.hero}>
        <img src="/assets/fundo_busca_materiais.png" alt="" className={styles.heroBg} />
        <div className={styles.heroInner}>
          <div className={styles.heroTop}>
            <div className={styles.heroText}>
              <span className={styles.eyebrow}>
                <img src="/assets/leaf.svg" alt="" />
                DESCARTE DO JEITO CERTO
              </span>
              <h1 className={styles.title}>Como descartar cada material?</h1>
              <p className={styles.subtitle}>
                Encontre orientações de preparo e descubra onde levar seus recicláveis em Rio Claro.
              </p>
              <MaterialSearch onSelect={handleSearchSelect} className={styles.search} />
            </div>
          </div>
          <div className={styles.filterBox}>
            <h2 className={styles.filterTitle}>Filtrar por categoria</h2>
            <div className={styles.categories} role="group" aria-label="Categorias de materiais">
              <CategoryButton active={category === COMMON} onClick={() => setCategory(COMMON)} label="Mais comuns" />
              {categories.map((c) => (
                <CategoryButton
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                  label={c.nome}
                  color={c.cor}
                  count={c.items.length}
                />
              ))}
              <CategoryButton
                active={category === ALL}
                onClick={() => setCategory(ALL)}
                label="Todos"
                count={allMaterials.length}
              />
            </div>
            <div className={styles.materialsArea}>
              {category === ALL ? (
                categories.map((c) => (
                  <div key={c.id} className={styles.group}>
                    <h3 className={styles.groupTitle}>
                      <span className={styles.dot} style={{ background: c.cor ?? 'var(--border-strong)' }} />
                      {c.nome}
                    </h3>
                    <ChipGroup
                      options={toChips(c.items)}
                      value={selectedId}
                      onChange={setSelectedId}
                      label={c.nome}
                      className={styles.chips}
                      variant="material"
                    />
                  </div>
                ))
              ) : (
                <ChipGroup
                  options={toChips(category === COMMON ? commonMaterials : currentGroup?.items ?? [])}
                  value={selectedId}
                  onChange={setSelectedId}
                  label={category === COMMON ? 'Materiais mais comuns' : currentGroup?.nome}
                  className={styles.chips}
                  variant="material"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.results} aria-live="polite">
        {error ? (
          <div className={`${styles.card} ${styles.empty}`}>
            <p className={styles.emptyTitle}>Algo deu errado.</p>
            <p className={styles.emptyText}>{error}</p>
          </div>
        ) : !material ? (
          <div className={`${styles.card} ${styles.empty}`}>
            <p className={styles.emptyText}>{loading ? 'Carregando...' : 'Nenhum material cadastrado ainda.'}</p>
          </div>
        ) : (
          <>
            <article className={styles.card} aria-busy={loading}>
              <header className={styles.cardHeader}>
                <span className={styles.matIcon}>
                  <img src={icon} alt="" width="30" height="30" />
                </span>
                <div className={styles.cardHeading}>
                  <h2 className={styles.matName}>{material.nome}</h2>
                  {material.reciclavel ? (
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
                <InfoRow label="Descarte" value={material.cuidados} />
                <InfoRow label="Preparo" value={material.instrucoes_preparo} />
                <InfoRow label="Categoria" value={material.categoria} />
                <InfoRow label="Por quê?" value={material.descricao} />
              </dl>
            </article>

            <aside className={styles.side}>
              <h3 className={styles.sideTitle}>Pontos que aceitam este material</h3>
              {acceptingPoints.length ? (
                acceptingPoints.map((p) => <PointItem key={p.id} point={p} size="sm" />)
              ) : (
                <p className={styles.sideEmpty}>Nenhum ponto cadastrado aceita este material ainda.</p>
              )}
              <Button to={`/mapa?material=${material.id_material}`} className={styles.mapButton}>
                <img src="/assets/icon-pin-white-sm.svg" alt="" width="16" height="16" />
                Ver no mapa
              </Button>
            </aside>
          </>
        )}
      </section>

      <div className={styles.game}>
        <GameBanner title="Teste seus conhecimentos em reciclagem" text="Teste no jogo da separação se você já sabe para onde vai cada material." />
      </div>
    </>
  );
}

// Botão de categoria: bolinha com a cor da categoria + quantidade de materiais
function CategoryButton({ active, onClick, label, color, count }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={active ? `${styles.category} ${styles.categoryActive}` : styles.category}
      onClick={onClick}
    >
      {color && <span className={styles.dot} style={{ background: color }} />}
      {label}
      {count != null && <span className={styles.count}>{count}</span>}
    </button>
  );
}

// Uma linha do card (rótulo à esquerda, texto à direita); some se o campo estiver vazio
function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.row}>
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={styles.rowValue}>{value}</dd>
    </div>
  );
}
