import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

// Itens do menu — pra adicionar uma página nova é só colocar aqui
const links = [
  { to: '/', label: 'Início', end: true },
  { to: '/materiais', label: 'Materiais' },
  { to: '/mapa', label: 'Mapa' },
  { to: '/projetos', label: 'Projetos' },
  { to: '/conteudos', label: 'Conteúdos' },
];

export default function Navbar() {
  // No celular os links ficam num menu que abre pelo botão ☰ (no desktop o botão some via CSS)
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Trocou de página: fecha o menu
  useEffect(() => setOpen(false), [pathname]);

  // Esc fecha o menu
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={styles.navbar}>
      <Link to="/" className={styles.brand} aria-label="Recycle Flow — Início">
        <span className={styles.logoBox}>
          <img src="/assets/logo.png" alt="" className={styles.logo} />
        </span>
        <span className={styles.rfw_title}>RecycleFlow</span>
      </Link>
      <button
        type="button"
        className={styles.menuButton}
        aria-expanded={open}
        aria-controls="menu-principal"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`${styles.burger} ${open ? styles.burgerOpen : ''}`} aria-hidden="true" />
      </button>
      <nav id="menu-principal" className={`${styles.links} ${open ? styles.linksOpen : ''}`}>
        {links.map(({ to, label, end }) => (
          // NavLink já sabe se a rota tá ativa, aí a gente só troca a classe
          <NavLink
            key={to}
            to={to}
            end={end} // sem isso o "/" ficaria ativo em todas as páginas
            className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
            onClick={() => setOpen(false)} // clicar na página atual também fecha o menu
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
