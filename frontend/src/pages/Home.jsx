import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import PointItem from '../components/PointItem.jsx';
import { quickAccess, tips } from '../data/home.js';
import { points } from '../data/points.js';
import styles from './Home.module.css';

export default function Home() {
  // Na Home só mostra os 3 pontos do protótipo (o Jardim Figueira aparece só na tela do Mapa)
  const nearby = points.filter((p) => !p.mapOnly);

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
        <div className={styles.pointsBody}>
          <div className={styles.pointsList}>
            {nearby.map((p, i) => (
              // divider só a partir do 2º item, pra não ter linha em cima do primeiro
              <PointItem key={p.id} point={p} divider={i > 0} />
            ))}
          </div>
          <Link to="/mapa" className={styles.mapPreview} aria-label="Abrir mapa completo">
            <img src="/assets/map-preview.png" alt="Prévia do mapa de pontos de coleta" />
          </Link>
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
