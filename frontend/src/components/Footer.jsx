import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

// Colunas do rodapé. Item com `to` vira link interno, com `href` vira link externo
const columns = [
  {
    title: 'Plataforma',
    items: [
      { label: 'Início', to: '/' },
      { label: 'Materiais', to: '/materiais' },
      { label: 'Pontos de coleta', to: '/mapa' },
    ],
  },
  {
    title: 'Sobre',
    items: [
      { label: 'O projeto', to: '/projetos' },
      { label: 'Educação', to: '/projetos' },
      { label: 'Rio Claro', to: '/projetos' },
    ],
  },
  {
    title: 'Contato',
    items: [
      { label: 'contato@recycleflow.com', href: 'mailto:contato@recycleflow.com' },
      { label: 'Rio Claro — SP' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <img src="/assets/logo.png" alt="" width="100" height="100" />
        <span className={styles.rfw_title}>RecycleFlow</span>
      </div>
      <div className={styles.columns}>
        {columns.map((col) => (
          <div key={col.title} className={styles.column}>
            <p className={styles.title}>{col.title}</p>
            {/* Decide o tipo de elemento conforme o item */}
            {col.items.map((item) =>
              item.to ? (
                <Link key={item.label} to={item.to} className={styles.item}>{item.label}</Link>
              ) : item.href ? (
                <a key={item.label} href={item.href} className={styles.item}>{item.label}</a>
              ) : (
                <span key={item.label} className={styles.item}>{item.label}</span>
              ),
            )}
          </div>
        ))}
      </div>
    </footer>
  );
}
