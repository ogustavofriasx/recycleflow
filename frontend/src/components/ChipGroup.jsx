import styles from './ChipGroup.module.css';

/** Grupo de chips de seleção única (Chip/Default + Chip/Active). */
export default function ChipGroup({ options, value, onChange, label, className = '' }) {
  return (
    <div className={`${styles.group} ${className}`} role="radiogroup" aria-label={label}>
      {options.map((opt) => {
        // O chip ativo é só o que bate com o `value` — quem guarda o estado é a página
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={active ? `${styles.chip} ${styles.active}` : styles.chip}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
