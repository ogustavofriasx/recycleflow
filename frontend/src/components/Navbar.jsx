import { Link, NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

// Itens do menu — pra adicionar uma página nova é só colocar aqui
const links = [
  { to: '/', label: 'Início', end: true },
  { to: '/materiais', label: 'Materiais' },
  { to: '/mapa', label: 'Mapa' },
  { to: '/projetos', label: 'Projetos' },
];

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <Link to="/" className={styles.brand} aria-label="Recycle Flow — Início">
        <span className={styles.logoBox}>
          <img src="/assets/logo.png" alt="" className={styles.logo} />
        </span>
        <span className={styles.rfw_title}>RecycleFlow</span>
      </Link>
      <nav className={styles.links}>
        {links.map(({ to, label, end }) => (
          // NavLink já sabe se a rota tá ativa, aí a gente só troca a classe
          <NavLink
            key={to}
            to={to}
            end={end} // sem isso o "/" ficaria ativo em todas as páginas
            className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
