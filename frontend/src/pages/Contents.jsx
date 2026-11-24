import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ArticleBody from '../components/ArticleBody.jsx';
import GameBanner from '../components/GameBanner.jsx';
import { listarConteudos, obterConteudo } from '../services/api.js';
import { contentTypeLabel, getContentBanner, getContentCover, getReadingTime, isGame } from '../utils/conteudos.js';
import styles from './Contents.module.css';

const formatDate = (value) => {
  if (!value) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(value));
};

const getContentIcon = (type) =>
  isGame(type) ? '/assets/icon-game.svg' : type?.toLowerCase() === 'curiosidade'
    ? '/assets/icon-curiosity.svg'
    : '/assets/icon-article.svg';

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
            <header className={styles.cover} style={{ backgroundImage: `url(${getContentCover(content)})` }}>
              <div className={styles.coverText}>
                <span className={styles.type}>{contentTypeLabel(content.tipo) || 'Conteúdo educativo'}</span>
                <h1>{content.titulo}</h1>
              </div>
            </header>
            <div className={styles.reading}>
              <div className={styles.byline}>
                {content.autor && <p className={styles.author}>Por <strong>{content.autor}</strong></p>}
                <p className={styles.meta}>
                  <span>{getReadingTime(content.corpo)} min de leitura</span>
                  {formatDate(content.publicado_em) && <span>{formatDate(content.publicado_em)}</span>}
                  {content.verificado_em && (
                    <span>
                      Verificado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(content.verificado_em))}
                    </span>
                  )}
                  {content.fonte_url && !isGame(content.tipo) && (
                    <a className={styles.source} href={content.fonte_url} target="_blank" rel="noreferrer">
                      Consultar fonte ↗
                    </a>
                  )}
                </p>
              </div>
              {content.resumo && (
                <aside className={styles.summary}>
                  <span>Em resumo</span>
                  <p>{content.resumo}</p>
                </aside>
              )}
              {isGame(content.tipo) && content.fonte_url && (
                <div className={styles.gameAccess}>
                  <a className={styles.gameLink} href={content.fonte_url} target="_blank" rel="noopener noreferrer"
                    aria-label={`Acessar jogo: ${content.titulo} (abre em nova aba)`}>
                    Acessar jogo <span aria-hidden="true">↗</span>
                  </a>
                  <p>Abre a página do jogo em uma nova aba.</p>
                </div>
              )}
              <ArticleBody className={styles.body} text={content.corpo} />
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
            </div>
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
        <p>Artigos, dicas, curiosidades e jogos educativos sobre reciclagem e descarte correto.</p>
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
                <span
                  className={styles.cardIcon}
                  style={{ backgroundImage: isGame(item.tipo) ? 'none' : `url(${getContentBanner(item.id_conteudo)})` }}
                  aria-hidden="true"
                >
                  <img src={getContentIcon(item.tipo)} alt="" />
                </span>
              )}
              <span className={styles.type}>{contentTypeLabel(item.tipo)}</span>
              <h2>{item.titulo}</h2>
              {item.resumo && <p>{item.resumo}</p>}
              <Link to={`/conteudos/${item.slug}`} className={styles.readMore}>
                {isGame(item.tipo) ? 'Conhecer o jogo' : 'Ler conteúdo'} ›
              </Link>
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
