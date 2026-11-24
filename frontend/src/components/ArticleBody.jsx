import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

// Ajusta texto colado de sites para Markdown antes de renderizar:
// linhas só com espaços viram linha em branco e marcadores "•" viram itens de lista.
export function normalizeBody(text = '') {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, '').replace(/^\s*[•◦▪●]\s*/, '- '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const isExternal = (href = '') => /^https?:\/\//i.test(href);

const components = {
  // O título da página já é o <h1>; títulos do texto começam em <h2>.
  h1: ({ node, ...props }) => <h2 {...props} />,
  h4: ({ node, ...props }) => <h3 {...props} />,
  h5: ({ node, ...props }) => <h3 {...props} />,
  h6: ({ node, ...props }) => <h3 {...props} />,
  a: ({ node, href, ...props }) =>
    isExternal(href)
      ? <a href={href} target="_blank" rel="noreferrer" {...props} />
      : <a href={href} {...props} />,
  img: ({ node, alt, ...props }) => <img alt={alt ?? ''} loading="lazy" {...props} />,
  table: ({ node, ...props }) => (
    <div className="tableWrap">
      <table {...props} />
    </div>
  ),
};

// Modo compacto (descrição de cards): só formatação de texto. Links, imagens e tabelas
// viram texto simples (o card já é um link; link dentro de link não é permitido) e
// títulos viram um parágrafo em negrito.
const COMPACT_ELEMENTS = ['p', 'strong', 'em', 'del', 'ul', 'ol', 'li', 'br', 'code', 'blockquote'];
const compactHeading = ({ node, ...props }) => <p><strong {...props} /></p>;
const compactComponents = {
  h1: compactHeading, h2: compactHeading, h3: compactHeading,
  h4: compactHeading, h5: compactHeading, h6: compactHeading,
};

// HTML colado no texto não é executado (react-markdown ignora HTML por padrão).
export default function ArticleBody({ text, className, compact = false }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={compact ? compactComponents : components}
        allowedElements={compact ? [...COMPACT_ELEMENTS, 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] : undefined}
        unwrapDisallowed={compact}
      >
        {normalizeBody(text)}
      </ReactMarkdown>
    </div>
  );
}
