// Tipos de conteúdo cadastrados no admin.
export const isGame = (type) => ['jogo', 'jogo educativo'].includes(type?.trim().toLowerCase());
export const contentTypeLabel = (type) => isGame(type) ? 'Jogo educativo' : type || 'Conteúdo educativo';

// Capas geradas a partir dos banners do projeto (originais em /assets/covers na raiz do repo).
// Escolhidas por funcionarem na faixa larga da capa, com o título por cima.
// A ordem alterna os temas para conteúdos vizinhos não repetirem o mesmo visual.
const COVERS = [
  'cover-13-mapa-espelhado',
  'cover-15-ciclo-azul',
  'cover-08-folhas-ondas',
  'cover-18-cidade-suave',
  'cover-07-ciclo-reciclagem',
  'cover-11-ondas-espelhado',
  'cover-14-materiais-azul',
  'cover-20-ciclo-suave',
  'cover-10-mundo-sustentavel',
  'cover-09-folhas-claras',
].map((name) => `/assets/covers/${name}.jpg`);

// "Aleatório", mas estável: o mesmo conteúdo sempre recebe a mesma capa.
export const getContentBanner = (id) => COVERS[Math.abs(Number(id) || 0) % COVERS.length];

export const getContentCover = (content) => content?.imagem_url || getContentBanner(content?.id_conteudo);

// Tempo de leitura estimado (≈200 palavras por minuto), mínimo de 1 minuto.
export const getReadingTime = (text = '') => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};
