import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import LocationBar from '../components/LocationBar.jsx';
import MapView from '../components/MapView.jsx';
import PointItem from '../components/PointItem.jsx';
import { quickAccess, tips } from '../data/home.js';
import useUserLocation, { toLatLngParams } from '../hooks/useUserLocation.js';
import { listarPontosColeta } from '../services/api.js';
import { toPoint } from '../utils/pontos.js';
import styles from './Home.module.css';

// Quantos pontos aparecem na lista da Home
const PONTOS_NA_HOME = 3;

export default function Home() {
  const navigate = useNavigate();
  const [points, setPoints] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const location = useUserLocation();
  const userPosition = location.position;

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
        <img src="/assets/hero-bg.png" alt="" className={styles.heroBg} />
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Recicle de forma inteligente em Rio Claro</h1>
          <p className={styles.heroSubtitle}>
            Descubra onde e como descartar corretamente seus resíduos, encontre pontos de coleta próximos e aprenda a reciclar melhor.
          </p>
          <div className={styles.actions}>
            <Button to="/mapa">Encontrar pontos de coleta</Button>
            <Button to="/materiais" variant="outline">Buscar um material</Button>
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
        <h2 className="section-title">Dicas &amp; curiosidades</h2>
        <div className={styles.tipsGrid}>
          {tips.map((tip) => (
            <article key={tip.text} className={styles.tip}>
              <span className={styles.tipIcon}>
                <img src={tip.icon} alt="" width={tip.w} height={tip.h} />
              </span>
              <p className={styles.tipText}>{tip.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
