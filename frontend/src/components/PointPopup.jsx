import styles from './PointPopup.module.css';

/** Card flutuante do ponto (Figma: "menu_flutuante"), mostrado por cima do mapa (MapView). */
export default function PointPopup({ point, onClose }) {
  // Sem ponto selecionado não renderiza nada
  if (!point) return null;
  return (
    <div className={styles.popup} role="dialog" aria-label={point.name}>
      <div className={styles.header}>
        <h3 className={styles.title}>{point.name}</h3>
        {onClose && (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">×</button>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.addressRow}>
          <span className={styles.pinBox}>
            <img src="/assets/popup-pin.svg" alt="" width="33" height="31" />
          </span>
          <p className={styles.address}>{point.fullAddress}</p>
        </div>
        <p className={styles.pill}>Horário de funcionamento: {point.hours}</p>
        <p className={`${styles.pill} ${styles.pillTall}`}>Materiais: {point.materialsLabel}</p>
        {/* Avisos vindos do banco: observação de horário e ponto ainda sem coordenada */}
        {point.hoursNote && <p className={styles.note}>{point.hoursNote}</p>}
        {point.position === null && <p className={styles.note}>Localização no mapa ainda não cadastrada.</p>}
      </div>
    </div>
  );
}
