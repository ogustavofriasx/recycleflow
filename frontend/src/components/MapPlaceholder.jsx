import styles from './MapPlaceholder.module.css';

/**
 * Área reservada para o mapa interativo (ainda sem mapa).
 * TODO (próxima etapa): implementar com Leaflet + OpenStreetMap (react-leaflet),
 * mantendo a mesma API: recebe `points`, `selectedId`, `onSelect`, `children` (popup).
 */
export default function MapPlaceholder({ children }) {
  return (
    <div className={styles.map}>
      {children ? (
        <div className={styles.overlay}>{children}</div>
      ) : (
        <p className={styles.hint}>Selecione um ponto na lista para ver os detalhes.</p>
      )}
    </div>
  );
}
