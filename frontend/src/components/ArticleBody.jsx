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

// HTML colado no texto não é executado (react-markdown ignora HTML por padrão).
export default function ArticleBody({ text, className }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {normalizeBody(text)}
      </ReactMarkdown>
    </div>
  );
}
