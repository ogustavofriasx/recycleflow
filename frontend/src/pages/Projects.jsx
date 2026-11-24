import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ArticleBody from '../components/ArticleBody.jsx';
import SourceInfo from '../components/SourceInfo.jsx';
import { buscarMateriais, listarPontosColeta, listarProjetos } from '../services/api.js';
import { JOGO_RECYCLEFLOW, toProject } from '../utils/projetos.js';
import styles from './Projects.module.css';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState(null); // { Ecoponto: 9, Cooperativa: 3, ... }
  const [materialCount, setMaterialCount] = useState(null);

  // Projetos publicados vêm da API
  useEffect(() => {
    const ctrl = new AbortController();
    listarProjetos(ctrl.signal)
      .then((lista) => setProjects(lista.map(toProject)))
      .catch((e) => {
        if (e.name !== 'AbortError') setError('Não foi possível carregar os projetos. Verifique se a API está rodando.');
      })
      .finally(() => setLoading(false));
    // Contagem de pontos ativos por tipo, para os indicadores do topo
    listarPontosColeta({}, ctrl.signal)
      .then((pontos) => {
        const porTipo = {};
        pontos.forEach((p) => { porTipo[p.tipo] = (porTipo[p.tipo] ?? 0) + 1; });
        setCounts(porTipo);
      })
      .catch(() => {}); // sem API, os indicadores ficam com "–"
    buscarMateriais(undefined, ctrl.signal)
      .then((lista) => setMaterialCount(lista.length))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const contagem = (tipo) => (counts ? String(counts[tipo] ?? 0) : '–');
  // Todos os indicadores são contados a partir do banco (nada de número fixo sem fonte)
  const stats = [
    { value: contagem('Ecoponto'), label: 'Ecopontos ativos' },
    { value: contagem('Cooperativa'), label: 'Cooperativas parceiras' },
    { value: contagem('Logística reversa'), label: 'Pontos de logística reversa' },
    { value: materialCount == null ? '–' : String(materialCount), label: 'Materiais com orientação' },
  ];

  return (
    <>
      <section className={styles.header}>
        <h1 className={styles.title}>Projetos e Iniciativas</h1>
        <p className={styles.subtitle}>
          Conheça iniciativas de reciclagem em Rio Claro e região e jogos educativos para aprender sobre sustentabilidade.
        </p>
      </section>

      <section className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      <section className={styles.list}>
        {/* O jogo do RecycleFlow vem sempre primeiro; os demais vêm da API */}
        {[JOGO_RECYCLEFLOW, ...projects].map((p) => (
          // Faixa horizontal: barra colorida pela categoria | ícone | texto | dados práticos.
          // Com link, a faixa inteira é clicável (o botão cobre o card via ::after).
          <article
            key={p.id}
            className={[styles.card, styles[`cat-${p.category}`], (p.link || p.to) && styles.cardLink].filter(Boolean).join(' ')}
          >
            <span className={styles.icon}>
              <img src={p.icon} alt="" width="26" height="26" />
            </span>
            <div className={styles.main}>
              <h2 className={styles.cardTitle}>{p.title}</h2>
              {/* Descrição aceita Markdown (negrito, itálico, listas, quebras de linha) */}
              <ArticleBody className={styles.cardText} text={p.description} compact />
            </div>
            <div className={styles.meta}>
              <span className={styles.tag}>{p.tag}</span>
              <dl className={styles.facts}>
                {p.institution && (
                  <div>
                    <dt>Responsável</dt>
                    <dd>{p.institution}</dd>
                  </div>
                )}
                {p.period && (
                  <div>
                    <dt>Período</dt>
                    <dd>{p.period}</dd>
                  </div>
                )}
              </dl>
              {p.status && (
                <span className={`${styles.status} ${styles[`status-${p.status}`]}`}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  {p.label}
                </span>
              )}
              <SourceInfo verifiedAt={p.verifiedAt} />
              {p.to ? (
                <Link to={p.to} className={styles.more} aria-label={`${p.linkLabel}: ${p.title}`}>
                  {p.linkLabel}
                  <span aria-hidden="true">→</span>
                </Link>
              ) : p.link && (
                <a href={p.link} className={styles.more} target="_blank" rel="noopener noreferrer"
                  aria-label={`${p.linkLabel}: ${p.title} (abre em nova aba)`}>
                  {p.linkLabel}
                  <span aria-hidden="true">→</span>
                </a>
              )}
            </div>
          </article>
        ))}
        {(loading || error) && (
          <p className={styles.empty}>{loading ? 'Carregando projetos...' : error}</p>
        )}
      </section>
    </>
  );
}
