import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import ChipGroup from '../components/ChipGroup.jsx';
import PointItem from '../components/PointItem.jsx';
import SearchInput from '../components/SearchInput.jsx';
import { buscarMateriais, obterMaterial } from '../services/api.js';
import styles from './Materials.module.css';

// Ícone por categoria (campo `icone` de categoria_material); sem ícone mostra a inicial
const CATEGORY_ICONS = {
  battery: '/assets/icon-battery-white.svg',
  pill: '/assets/icon-medicine-white.svg',
};

const MATERIAL_ICONS = {
  medicamentos: '/assets/icon-medicine-white.svg',
  'papel e papelão': '/assets/icon-cardboard-white.svg',
  vidro: '/assets/icon-glass-white.svg',
  'óleo de cozinha': '/assets/icon-drop-white.svg',
};

// Espera o usuário parar de digitar antes de chamar a API
const DEBOUNCE_MS = 300;

// Converte um ponto da API para o formato que o PointItem espera
const toPointItem = (p) => ({
  id: p.id_ponto,
  name: p.nome,
  address: [[p.logradouro, p.numero].filter(Boolean).join(', '), p.bairro].filter(Boolean).join(' - '),
  distance: '', // distância entra na etapa 7 (pontos próximos ao usuário)
});

export default function Materials() {
  const [allMaterials, setAllMaterials] = useState([]); // usados nos chips
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null); // null = sem busca ativa
  const [material, setMaterial] = useState(null); // detalhe + pontos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) Carrega a lista para os chips e seleciona Pilha (igual ao protótipo) ou o primeiro
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

  // 2) Busca por texto na API (com debounce); o primeiro resultado vira o selecionado
  useEffect(() => {
    const termo = query.trim();
    if (!termo) {
      setResults(null);
      return undefined;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      buscarMateriais(termo, ctrl.signal)
        .then((lista) => {
          setResults(lista);
          setError(null);
          if (lista.length) setSelectedId(lista[0].id_material);
        })
        .catch((e) => {
          if (e.name !== 'AbortError') setError('Erro ao buscar materiais.');
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  // 3) Carrega o detalhe (com pontos que aceitam) do material selecionado
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

  const chipOptions = allMaterials.map((m) => ({ value: m.id_material, label: m.nome }));
  const notFound = results !== null && results.length === 0;
  const acceptingPoints = material?.pontos?.map(toPointItem) ?? [];
  const icon = material && (
    MATERIAL_ICONS[material.nome.toLocaleLowerCase('pt-BR')] ??
    CATEGORY_ICONS[material.categoria_icone]
  );

  // Clicou num chip: seleciona e limpa a busca pra não brigar com ela
  const handleChip = (id) => {
    setSelectedId(id);
    setQuery('');
  };

  return (
    <>
      <section className={styles.hero}>
        <img src="/assets/fundo_materiais.png" alt="" className={styles.heroBg} />
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
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Ex: pilha, óleo de cozinha, eletrônico..."
                className={styles.search}
                aria-label="Buscar material"
              />
            </div>
          </div>
          <div className={styles.filterBox}>
            <h2 className={styles.filterTitle}>Filtrar por categoria</h2>
            <ChipGroup
              options={chipOptions}
              value={notFound ? null : selectedId}
              onChange={handleChip}
              label="Materiais comuns"
              className={styles.chips}
              variant="material"
            />
          </div>
        </div>
      </section>

      <section className={styles.results} aria-live="polite">
        {error ? (
          <div className={`${styles.card} ${styles.empty}`}>
            <p className={styles.emptyTitle}>Algo deu errado.</p>
            <p className={styles.emptyText}>{error}</p>
          </div>
        ) : notFound ? (
          <div className={`${styles.card} ${styles.empty}`}>
            <p className={styles.emptyTitle}>Nenhum material encontrado para “{query}”.</p>
            <p className={styles.emptyText}>Tente outro termo ou escolha uma das opções acima.</p>
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
                  {icon ? (
                    <img src={icon} alt="" width="30" height="30" />
                  ) : (
                    <span className={styles.matInitial}>{material.nome[0]}</span>
                  )}
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
    </>
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
