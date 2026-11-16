// Converte o projeto da API (/projetos) para o formato do card da página Projetos.

const normalize = (s) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Categoria (usada pelos chips de data/projects.js) a partir do tipo da instituição
function categoria(tipoInstituicao) {
  const t = normalize(tipoInstituicao);
  if (t.includes('poder publico') || t.includes('prefeitura')) return { category: 'prefeitura', tag: 'Prefeitura' };
  if (t.includes('cooperativa')) return { category: 'cooperativa', tag: 'Cooperativa' };
  if (t.includes('ong') || t.includes('associacao')) return { category: 'ong', tag: 'ONG' };
  return { category: 'outros', tag: tipoInstituicao || 'Iniciativa' };
}

// Ícone por categoria (os SVGs já existem em public/assets)
const ICONES = {
  prefeitura: '/assets/proj-recycle.svg',
  cooperativa: '/assets/proj-user.svg',
  ong: '/assets/proj-chat.svg',
  outros: '/assets/proj-leaf.svg',
};

export function toProject(p) {
  const { category, tag } = categoria(p.instituicao_tipo);
  return {
    id: p.id_projeto,
    title: p.titulo,
    description: p.descricao,
    category,
    tag,
    icon: ICONES[category],
    institution: p.instituicao,
    link: p.fonte_url,
  };
}
