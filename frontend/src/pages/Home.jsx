import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import LocationBar from '../components/LocationBar.jsx';
import MapView from '../components/MapView.jsx';
import PointItem from '../components/PointItem.jsx';
import { quickAccess } from '../data/home.js';
import useUserLocation, { toLatLngParams } from '../hooks/useUserLocation.js';
import { listarConteudos, listarPontosColeta } from '../services/api.js';
import { toPoint } from '../utils/pontos.js';
import styles from './Home.module.css';

// Quantos pontos aparecem na lista da Home
const PONTOS_NA_HOME = 3;

export default function Home() {
  const navigate = useNavigate();
  const [points, setPoints] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [tips, setTips] = useState([]);
  const [tipsStatus, setTipsStatus] = useState('loading');
  const [activeTip, setActiveTip] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const location = useUserLocation();
  const userPosition = location.position;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (isHovered || isFocused || prefersReducedMotion || tips.length < 2) return undefined;
    const timeout = window.setTimeout(() => {
      setActiveTip((current) => (current + 1) % tips.length);
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [activeTip, isHovered, isFocused, prefersReducedMotion, tips.length]);

  useEffect(() => {
    const ctrl = new AbortController();
    listarConteudos({ tipo: 'curiosidade' }, ctrl.signal)
      .then((contents) => {
        setTips(contents.map((content) => ({
          slug: content.slug,
          icon: content.imagem_url || '/assets/icon-curiosity.svg',
          text: content.resumo || content.titulo,
        })));
        setTipsStatus('ok');
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setTipsStatus('error');
      });
    return () => ctrl.abort();
  }, []);

  // Com o local do usuário, a API já devolve do mais próximo para o mais distante
  useEffect(() => {
    const ctrl = new AbortController();
    listarPontosColeta(toLatLngParams(userPosition), ctrl.signal)
      .then((lista) => {
        setPoints(lista.map(toPoint));
        setStatus('ok');
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setStatus('error');
      });
    return () => ctrl.abort();
  }, [userPosition]);

  // Sem local: os 3 primeiros em ordem alfabética
  const nearby = points.slice(0, PONTOS_NA_HOME);

  return (
    <>
      <section className={styles.hero}>
        <img src="/assets/novo_fundo.png" alt="" className={styles.heroBg} />
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.heroEyebrow}>
              <img src="/assets/leaf.svg" alt="" />
              RECICLE COM PROPÓSITO
            </span>
            <h1 className={styles.heroTitle}>Recicle de forma inteligente em Rio&nbsp;Claro</h1>
            <p className={styles.heroSubtitle}>
              Descubra onde e como descartar corretamente seus resíduos, encontre pontos de coleta próximos e aprenda a reciclar melhor.
            </p>
            <div className={styles.actions}>
              <Button to="/mapa">Encontrar pontos de coleta</Button>
              <Button to="/materiais" variant="outline">Buscar um material</Button>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroArtwork} aria-hidden="true">
              <span className={styles.heroArtworkCircle}>
                <span className={styles.heroRecycleSymbol}>♻︎</span>
              </span>
              <span className={styles.heroArtworkBadge}>
                <img src="/assets/proj-recycle.svg" alt="" />
                Pequenas atitudes, grandes impactos
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.quick}>
        <h2 className="section-title">Como podemos ajudar</h2>
        <div className={styles.quickGrid}>
          {/* Cards de atalho — os dados vêm de data/home.js */}
          {quickAccess.map((card) => (
            <Link key={card.title} to={card.to} className={styles.qCard}>
              <span className={styles.qIcon} style={{ background: card.color }}>
                <img src={card.icon} alt="" width="26" height="26" />
              </span>
              <span className={styles.qTitle}>{card.title}</span>
              <span className={styles.qText}>{card.text}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.points}>
        <div className={styles.pointsHeader}>
          <h2 className="section-title">Pontos de coleta próximos</h2>
          <Link to="/mapa" className={styles.seeAll}>Ver mapa completo ›</Link>
        </div>
        <LocationBar location={location} />
        <div className={styles.pointsBody}>
          <div className={styles.pointsList}>
            {status === 'loading' && <p className={styles.pointsEmpty}>Carregando pontos...</p>}
            {status === 'error' && <p className={styles.pointsEmpty}>Não foi possível carregar os pontos agora.</p>}
            {nearby.map((p, i) => (
              // divider só a partir do 2º item, pra não ter linha em cima do primeiro
              <PointItem key={p.id} point={p} divider={i > 0} onClick={() => navigate('/mapa')} />
            ))}
          </div>
          {/* Mapa real com todos os pontos; clicar num pino abre o mapa completo */}
          <div className={styles.mapPreview}>
            <MapView points={points} selectedId={null} onSelect={() => navigate('/mapa')} userPosition={userPosition} />
          </div>
        </div>
      </section>

      <section className={styles.tips}>
        <div className={styles.pointsHeader}>
          <h2 className="section-title">Dicas &amp; curiosidades</h2>
          <Link to="/conteudos" className={styles.seeAll}>Ver todos os conteúdos ›</Link>
        </div>
        {!tips.length ? (
          <p className={styles.pointsEmpty}>
            {tipsStatus === 'loading'
              ? 'Carregando curiosidades...'
              : tipsStatus === 'error'
                ? 'Não foi possível carregar as curiosidades agora.'
                : 'Nenhuma curiosidade publicada ainda.'}
          </p>
        ) : (
        <div
          className={styles.tipsCarousel}
          role="region"
          aria-label="Dicas e curiosidades"
          aria-roledescription="carrossel"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocusCapture={() => setIsFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
          }}
        >
          {tips.length > 1 && (
            <button
              type="button"
              className={styles.tipArrow}
              aria-label="Dica anterior"
              onClick={() => setActiveTip((current) => (current - 1 + tips.length) % tips.length)}
            >
              ‹
            </button>
          )}
          <article className={`${styles.tip} ${tips.length === 1 ? styles.tipSolo : ''}`}>
            <div className={styles.tipContent} key={activeTip}>
              <span className={styles.tipIcon}>
                <img src={tips[activeTip].icon} alt="" width="42" height="42" />
              </span>
              <p className={styles.tipText}>
                <Link to={`/conteudos/${tips[activeTip].slug}`} className={styles.tipLink}>
                  {tips[activeTip].text}
                </Link>
              </p>
            </div>
          </article>
          {tips.length > 1 && (
            <>
              <button
                type="button"
                className={styles.tipArrow}
                aria-label="Próxima dica"
                onClick={() => setActiveTip((current) => (current + 1) % tips.length)}
              >
                ›
              </button>
              <div className={styles.tipPagination} aria-label="Selecionar dica">
                {tips.map((tip, index) => (
                  <button
                    key={tip.slug}
                    type="button"
                    className={`${styles.tipDot} ${index === activeTip ? styles.tipDotActive : ''}`}
                    aria-label={`Mostrar curiosidade ${index + 1}`}
                    aria-current={index === activeTip ? 'true' : undefined}
                    onClick={() => setActiveTip(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        )}
      </section>
    </>
  );
}
