import { useEffect, useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import { fixedStats, projectFilters } from '../data/projects.js';
import { listarPontosColeta, listarProjetos } from '../services/api.js';
import { toProject } from '../utils/projetos.js';
import styles from './Projects.module.css';

export default function Projects() {
  const [filter, setFilter] = useState('todos');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState(null); // { Ecoponto: 6, Cooperativa: 1 }

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
    return () => ctrl.abort();
  }, []);

  const contagem = (tipo) => (counts ? String(counts[tipo] ?? 0) : '–');
  const stats = [
    { value: contagem('Ecoponto'), label: 'Ecopontos ativos' },
    fixedStats.recuperacao,
    { value: contagem('Cooperativa'), label: 'Cooperativas parceiras' },
    fixedStats.habitantes,
  ];

  // "Todos" mostra tudo; os outros filtros olham a categoria de cada projeto
  const visible = filter === 'todos' ? projects : projects.filter((p) => p.category === filter);

  return (
    <>
      <section className={styles.header}>
        <h1 className={styles.title}>Projetos e Iniciativas</h1>
        <p className={styles.subtitle}>
          Programas públicos, campanhas de conscientização e ações de cooperativas de reciclagem em Rio Claro e região.
        </p>
      </section>

      <section className={styles.filters}>
        <ChipGroup options={projectFilters} value={filter} onChange={setFilter} label="Filtrar projetos" />
      </section>

      <section className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      <section className={styles.grid}>
        {(loading || error || !visible.length) && (
          <p className={styles.empty}>
            {loading ? 'Carregando projetos...' : error ?? 'Nenhum projeto nesta categoria ainda.'}
          </p>
        )}
        {visible.map((p) => (
          <article key={p.id} className={styles.card}>
            <span className={styles.icon}>
              <img src={p.icon} alt="" width="23" height="23" />
            </span>
            <span className={styles.tag}>{p.tag}</span>
            <h2 className={styles.cardTitle}>{p.title}</h2>
            <p className={styles.cardText}>{p.description}</p>
            {p.institution && <p className={styles.institution}>{p.institution}</p>}
            {/* Sem página de detalhe ainda: "Saiba mais" leva à fonte, quando houver */}
            {p.link && (
              <a href={p.link} className={styles.more} target="_blank" rel="noreferrer">
                Saiba mais
                <img src="/assets/chevron.svg" alt="" width="13" height="13" />
              </a>
            )}
          </article>
        ))}
      </section>
    </>
  );
}
