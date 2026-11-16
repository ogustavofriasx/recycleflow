export const projectFilters = [
  { value: 'todos', label: 'Todos' },
  { value: 'prefeitura', label: 'Prefeitura' },
  { value: 'cooperativa', label: 'Cooperativas' },
  { value: 'ong', label: 'ONGs' },
];

// Indicadores FIXOS (ainda sem tabela no banco). Conferir a fonte antes de publicar.
// "Ecopontos ativos" e "Cooperativas parceiras" são contados da API em Projects.jsx.
export const fixedStats = {
  recuperacao: { value: '5,1%', label: 'Taxa de recuperação' },
  habitantes: { value: '210k', label: 'Habitantes atendidos' },
};

// Campanhas ficam com categoria própria, então só aparecem no filtro "Todos"
export const projects = [
  {
    id: 1, icon: '/assets/proj-recycle.svg', category: 'prefeitura', tag: 'Prefeitura',
    title: 'Coleta seletiva municipal',
    description: 'Cobertura de 100% da população urbana, com pontos de entrega voluntária espalhados pela cidade.',
  },
  {
    id: 2, icon: '/assets/proj-user.svg', category: 'cooperativa', tag: 'Cooperativa',
    title: 'CooperViva + Cidade Azul',
    description: 'Parceria amplia a coleta mensal de recicláveis e o número de catadores atuando nas ruas.',
  },
  {
    id: 3, icon: '/assets/proj-leaf.svg', category: 'campanha', tag: 'Campanha',
    title: 'Escolas recicladoras',
    description: 'Alunos da rede municipal arrecadam materiais recicláveis em ações educativas.',
  },
  {
    id: 4, icon: '/assets/proj-pin.svg', category: 'prefeitura', tag: 'Prefeitura',
    title: 'Rede de ecopontos',
    description: 'Oito unidades espalhadas pela cidade para descarte gratuito de entulho, móveis e eletrônicos.',
  },
  {
    id: 5, icon: '/assets/proj-chat.svg', category: 'ong', tag: 'ONG',
    title: 'Educação ambiental',
    description: 'Oficinas e materiais educativos sobre descarte correto e logística reversa.',
  },
  {
    id: 6, icon: '/assets/proj-route.svg', category: 'prefeitura', tag: 'Prefeitura',
    title: 'Cata-bagulho',
    description: 'Operação municipal para recolhimento de móveis e objetos volumosos em dias programados.',
  },
];
