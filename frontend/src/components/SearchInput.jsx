import styles from './SearchInput.module.css';

// Campo de busca controlado: o valor fica na página, aqui só repassa o que foi digitado
export default function SearchInput({ value, onChange, placeholder, className = '', ...props }) {
  return (
    // <label> em volta faz o clique em qualquer parte focar o input
    <label className={`${styles.field} ${className}`}>
      <img src="/assets/icon-search.svg" alt="" width="19" height="19" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
        {...props}
      />
    </label>
  );
}
