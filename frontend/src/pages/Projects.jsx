import { useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import { projectFilters, projects, stats } from '../data/projects.js';
import styles from './Projects.module.css';

export default function Projects() {
  const [filter, setFilter] = useState('todos');
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
        {visible.map((p) => (
          <article key={p.id} className={styles.card}>
            <span className={styles.icon}>
              <img src={p.icon} alt="" width="23" height="23" />
            </span>
            <span className={styles.tag}>{p.tag}</span>
            <h2 className={styles.cardTitle}>{p.title}</h2>
            <p className={styles.cardText}>{p.description}</p>
            {/* Ainda não tem página de detalhe, então o link não faz nada por enquanto */}
            <a href="#" className={styles.more} onClick={(e) => e.preventDefault()}>
              Saiba mais
              <img src="/assets/chevron.svg" alt="" width="13" height="13" />
            </a>
          </article>
        ))}
      </section>
    </>
  );
}
