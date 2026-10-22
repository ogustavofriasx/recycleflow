import styles from './PointItem.module.css';

/**
 * Linha de ponto de coleta. size="md" (Home/Mapa) ou "sm" (card da Busca).
 * Se receber onClick vira <button> (lista do Mapa).
 */
export default function PointItem({ point, size = 'md', divider = false, selected = false, onClick }) {
  // Se for clicável vira <button> (acessível no teclado), senão é só uma div
  const Tag = onClick ? 'button' : 'div';
  const sm = size === 'sm';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? selected : undefined}
      // Junta as classes ativas e descarta as falsas
      className={[styles.item, styles[size], divider && styles.divider, selected && styles.selected, onClick && styles.clickable]
        .filter(Boolean).join(' ')}
    >
      <span className={styles.iconBox}>
        <img
          src={sm ? '/assets/icon-pin-sm.svg' : '/assets/icon-pin.svg'}
          alt=""
          width={sm ? 17 : 20}
          height={sm ? 17 : 20}
        />
      </span>
      <span className={styles.text}>
        <span className={styles.name}>{point.name}</span>
        <span className={styles.address}>{point.address}</span>
      </span>
      <span className={styles.distance}>{point.distance}</span>
    </Tag>
  );
}
