import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import GameBanner from '../components/GameBanner.jsx';
import { listarConteudos, obterConteudo } from '../services/api.js';
import styles from './Contents.module.css';

const formatDate = (value) => {
  if (!value) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(value));
};

const getContentIcon = (type) =>
  type?.toLowerCase() === 'curiosidade'
    ? '/assets/icon-curiosity.svg'
    : '/assets/icon-article.svg';

function renderBody(text) {
  return text.split(/\n{2,}/).filter(Boolean).map((block, index) => {
    const heading = block.match(/^#{1,3}\s+(.+)$/);
    if (heading) return <h2 key={index}>{heading[1]}</h2>;
    const lines = block.split('\n');
    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      return (
        <ul key={index}>
          {lines.map((line, lineIndex) => <li key={lineIndex}>{line.replace(/^[-*]\s+/, '')}</li>)}
        </ul>
      );
    }
    return <p key={index}>{lines.map((line, lineIndex) => <span key={lineIndex}>{line}{lineIndex < lines.length - 1 && <br />}</span>)}</p>;
  });
}

export default function Contents() {
  const { slug } = useParams();
  const [items, setItems] = useState([]);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setContent(null);
    const request = slug
      ? obterConteudo(slug, controller.signal).then(setContent)
      : listarConteudos({}, controller.signal).then(setItems);
    request
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  if (slug) {
    return (
      <article className={styles.articlePage}>
        <Link to="/conteudos" className={styles.back}>‹ Voltar aos conteúdos</Link>
        {loading ? (
          <p className={styles.message}>Carregando conteúdo...</p>
        ) : error ? (
          <p className={styles.message} role="alert">{error}</p>
        ) : content ? (
          <div className={styles.article}>
            <span className={styles.type}>{content.tipo || 'Conteúdo educativo'}</span>
            <h1>{content.titulo}</h1>
            {formatDate(content.publicado_em) && <p className={styles.date}>Publicado em {formatDate(content.publicado_em)}</p>}
            {content.imagem_url && <img className={styles.image} src={content.imagem_url} alt="" />}
            {content.resumo && <p className={styles.summary}>{content.resumo}</p>}
            <div className={styles.body}>{renderBody(content.corpo)}</div>
            {content.materiais?.length > 0 && (
              <div className={styles.related}>
                <h2>Materiais relacionados</h2>
                <div className={styles.materials}>
                  {content.materiais.map((material) => (
                    <Link key={material.id_material} to="/materiais">
                      {material.nome}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {content.fonte_url && (
              <a className={styles.source} href={content.fonte_url} target="_blank" rel="noreferrer">
                Consultar fonte
              </a>
            )}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <section className={styles.listPage}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>APRENDA A DESCARTAR MELHOR</span>
        <h1>Conteúdos educativos</h1>
        <p>Artigos, dicas e curiosidades sobre reciclagem e descarte correto.</p>
      </header>
      {loading ? (
        <p className={styles.message}>Carregando conteúdos...</p>
      ) : error ? (
        <p className={styles.message} role="alert">{error}</p>
      ) : items.length ? (
        <div className={styles.grid}>
          {items.map((item) => (
            <article key={item.id_conteudo} className={styles.card}>
              {item.imagem_url ? (
                <img className={styles.cardImage} src={item.imagem_url} alt="" />
              ) : (
                <span className={styles.cardIcon} aria-hidden="true">
                  <img src={getContentIcon(item.tipo)} alt="" />
                </span>
              )}
              <span className={styles.type}>{item.tipo || 'Conteúdo educativo'}</span>
              <h2>{item.titulo}</h2>
              {item.resumo && <p>{item.resumo}</p>}
              <Link to={`/conteudos/${item.slug}`} className={styles.readMore}>Ler conteúdo ›</Link>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.message}>Ainda não há conteúdos publicados.</p>
      )}
      <GameBanner
        className={styles.game}
        eyebrow="DEPOIS DA LEITURA, A PRÁTICA"
        title="Coloque as dicas em prática"
      />
    </section>
  );
}
