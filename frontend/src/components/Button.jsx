import { Link } from 'react-router-dom';
import styles from './Button.module.css';

/** Botão do design system (Button/Primary | Button/Outline). Renderiza <Link> se receber `to`. */
export default function Button({ variant = 'primary', to, children, className = '', ...props }) {
  const cls = `${styles.button} ${styles[variant]} ${className}`;
  if (to) return <Link to={to} className={cls} {...props}>{children}</Link>;
  return <button type="button" className={cls} {...props}>{children}</button>;
}
