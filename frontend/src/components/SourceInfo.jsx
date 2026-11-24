import styles from './SourceInfo.module.css';

// RF15 / RNF05: mostra de onde veio a informação e quando foi conferida pela última vez.

// "https://www.rioclaro.sp.gov.br/..." -> "rioclaro.sp.gov.br"
function dominio(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'fonte';
  }
}

export const formatarData = (value) =>
  value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value)) : null;

export default function SourceInfo({ url, verifiedAt, className = '' }) {
  const data = formatarData(verifiedAt);
  if (!url && !data) return null;
  return (
    <p className={`${styles.source} ${className}`}>
      {url && (
        <span>
          Fonte:{' '}
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Fonte: ${dominio(url)} (abre em nova aba)`}>
            {dominio(url)} <span aria-hidden="true">↗</span>
          </a>
        </span>
      )}
      {data && <span>Verificado em {data}</span>}
    </p>
  );
}
