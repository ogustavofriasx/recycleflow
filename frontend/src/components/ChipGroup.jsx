import styles from './ChipGroup.module.css';

/** Grupo de chips de seleção única (Chip/Default + Chip/Active). */
export default function ChipGroup({ options, value, onChange, label, className = '', variant = 'default' }) {
  const groupClass = variant === 'material' ? styles.materialGroup : styles.group;
  const chipClass = variant === 'material' ? styles.materialChip : styles.chip;
  const activeClass = variant === 'material' ? styles.materialActive : styles.active;

  return (
    <div className={`${groupClass} ${className}`} role="radiogroup" aria-label={label}>
      {options.map((opt) => {
        // O chip ativo é só o que bate com o `value` — quem guarda o estado é a página
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={active ? `${chipClass} ${activeClass}` : chipClass}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
