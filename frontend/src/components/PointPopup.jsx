import styles from './PointPopup.module.css';

export default function PointPopup({ point, onClose }) {
  if (!point) return null;

  const destination = point.position?.length ? point.position.join(',') : point.fullAddress;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

  return (
    <div className={styles.popup} role="dialog" aria-label={point.name}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.type}>{point.typeLabel}</span>
          {onClose && (
            <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">×</button>
          )}
        </div>
        <h3 className={styles.title}>{point.name}</h3>
        {point.distance && <span className={styles.distance}>{point.distance} de você</span>}
      </div>
      <div className={styles.body}>
        <div className={styles.infoRow}>
          <span className={styles.infoIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
          </span>
          <div className={styles.infoText}>
            <span className={styles.label}>Endereço</span>
            <p className={styles.address}>{point.fullAddress}</p>
          </div>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          </span>
          <div className={styles.infoText}>
            <span className={styles.label}>Horário de funcionamento</span>
            <p className={styles.value}>{point.hours}</p>
          </div>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="m8 4 3-2 3 2M11 2v6a4 4 0 0 1-4 4H4" /><path d="m5 9-2 3 2 3M3 12h6a4 4 0 0 1 4 4v5" /><path d="m10 19 3 2 3-2M13 21v-6a4 4 0 0 1 4-4h4" /><path d="m19 14 2-3-2-3" /></svg>
          </span>
          <div className={styles.infoText}>
            <span className={styles.label}>Materiais aceitos</span>
            <p className={styles.value}>{point.materialsLabel}</p>
          </div>
        </div>
        {(point.hoursNote || point.position === null) && (
          <div className={styles.note}>
            {point.hoursNote && <p>{point.hoursNote}</p>}
            {point.position === null && <p>Localização no mapa ainda não cadastrada.</p>}
          </div>
        )}
        <a className={styles.directions} href={directionsUrl} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 21 12l-9 9-9-9 9-9Z" /><path d="M8 12h8m-3-3 3 3-3 3" /></svg>
          Como chegar
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}
