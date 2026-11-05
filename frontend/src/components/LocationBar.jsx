import styles from './LocationBar.module.css';

/**
 * Controles de "pontos próximos": usar a localização do navegador ou escolher no mapa.
 * `location` vem do hook useUserLocation. `picking`/`onTogglePick` só no Mapa.
 */
export default function LocationBar({ location, picking = false, onTogglePick, className = '' }) {
  const { position, source, status, error, requestLocation, clearLocation } = location;

  return (
    <div className={`${styles.bar} ${className}`} aria-live="polite">
      {position ? (
        <div className={styles.active}>
          <img src="/assets/icon-pin-sm.svg" alt="" width="16" height="16" />
          <span>
            Pontos mais próximos {source === 'mapa' ? 'do local escolhido no mapa' : 'da sua localização'}
          </span>
          <div className={styles.actions}>
            {onTogglePick && (
              <button type="button" className={styles.link} onClick={onTogglePick}>
                {picking ? 'Cancelar' : 'Alterar no mapa'}
              </button>
            )}
            <button type="button" className={styles.link} onClick={clearLocation}>Limpar</button>
          </div>
        </div>
      ) : (
        <div className={styles.buttons}>
          <button type="button" className={styles.primary} onClick={requestLocation} disabled={status === 'locating'}>
            <img src="/assets/icon-pin-white-sm.svg" alt="" width="16" height="16" />
            {status === 'locating' ? 'Localizando...' : 'Usar minha localização'}
          </button>
          {onTogglePick && (
            <button
              type="button"
              className={`${styles.secondary} ${picking ? styles.secondaryOn : ''}`}
              onClick={onTogglePick}
              aria-pressed={picking}
            >
              {picking ? 'Cancelar' : 'Escolher no mapa'}
            </button>
          )}
        </div>
      )}
      {picking && <p className={styles.hint}>Clique no mapa no local desejado.</p>}
      {error && !position && <p className={styles.error}>{error}</p>}
    </div>
  );
}
