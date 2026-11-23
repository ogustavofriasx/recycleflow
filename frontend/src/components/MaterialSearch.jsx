import { useEffect, useId, useState } from 'react';
import SearchInput from './SearchInput.jsx';
import { buscarMateriais } from '../services/api.js';
import styles from './MaterialSearch.module.css';

// Espera o usuário parar de digitar antes de chamar a API
const DEBOUNCE_MS = 250;
const MAX_SUGGESTIONS = 6;

/**
 * Busca de materiais com sugestões (padrão combobox): enquanto digita, mostra até 6
 * materiais; setas navegam, Enter escolhe, Esc fecha. `onSelect` recebe o material.
 */
export default function MaterialSearch({ onSelect, className = '' }) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState(null); // null = ainda não buscou
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const termo = query.trim();
    if (!termo) {
      setSuggestions(null);
      return undefined;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      buscarMateriais(termo, ctrl.signal)
        .then((lista) => {
          setSuggestions(lista.slice(0, MAX_SUGGESTIONS));
          setActive(0);
          setError(false);
        })
        .catch((e) => {
          if (e.name !== 'AbortError') setError(true);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  const choose = (material) => {
    onSelect(material);
    setQuery('');
    setSuggestions(null);
    setOpen(false);
  };

  const hasItems = suggestions?.length > 0;
  const showList = open && query.trim() !== '' && (suggestions !== null || error);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!hasItems) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(suggestions[active]);
    }
  };

  return (
    <div className={`${styles.wrap} ${className}`}>
      <SearchInput
        value={query}
        onChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        placeholder="Ex: pilha, óleo de cozinha, remédio..."
        aria-label="Buscar material"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList && hasItems}
        aria-controls={listId}
        aria-activedescendant={showList && hasItems ? `${listId}-${active}` : undefined}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        autoComplete="off"
      />
      {showList && (
        <div className={styles.panel}>
          {error ? (
            <p className={styles.message} role="status">Não foi possível buscar agora. Tente de novo.</p>
          ) : hasItems ? (
            <ul id={listId} role="listbox" aria-label="Sugestões de materiais" className={styles.list}>
              {suggestions.map((m, i) => (
                <li
                  key={m.id_material}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={styles.option}
                  // mousedown + preventDefault: escolhe antes do blur fechar a lista
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(m);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className={styles.name}>{m.nome}</span>
                  <span className={styles.category}>
                    <span className={styles.dot} style={{ background: m.categoria_cor ?? 'var(--border-strong)' }} />
                    {m.categoria}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.message} role="status">
              Nenhum material encontrado para “{query.trim()}”. Tente outro termo ou use os filtros abaixo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
