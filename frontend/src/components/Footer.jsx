import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const columns = [
  {
    title: 'Explore',
    items: [
      { label: 'Materiais', to: '/materiais' },
      { label: 'Pontos de coleta', to: '/mapa' },
      { label: 'Projetos', to: '/projetos' },
      { label: 'Conteúdos educativos', to: '/conteudos' },
      { label: 'Jogo da separação', to: '/jogo' },
    ],
  },
  {
    title: 'Atenção',
    description: 'Os dados dos pontos de coleta podem mudar. Confirme horários e condições de recebimento antes de se deslocar.',
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerMain}>
        <div className={styles.brandBlock}>
          <Link to="/" className={styles.brand} aria-label="RecycleFlow — início">
            <img src="/assets/logo.png" alt="" width="52" height="52" />
            <span className={styles.rfw_title}>RecycleFlow</span>
          </Link>
          <p className={styles.description}>
            Informação para reciclar melhor e encontrar destinos adequados para os resíduos em Rio Claro e região.
          </p>
        </div>
        <div className={styles.columns}>
          {columns.map((col) => (
            <div key={col.title} className={styles.column}>
              <p className={styles.title}>{col.title}</p>
              {col.items?.map((item) => (
                <Link key={item.label} to={item.to} className={styles.item}>{item.label}</Link>
              ))}
              {col.description && <p className={styles.notice}>{col.description}</p>}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} RecycleFlow</span>
        <span>Reciclagem urbana, informação ao alcance de todos.</span>
      </div>
    </footer>
  );
}
