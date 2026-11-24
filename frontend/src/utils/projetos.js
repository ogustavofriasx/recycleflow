// Converte o projeto da API (/projetos) para o formato do card da página Projetos.
import { isGame } from './conteudos.js';

const normalize = (s) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Categoria (define a cor e a tag da faixa) a partir do tipo da instituição
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
  jogo: '/assets/icon-game.svg',
};

// "2026-03-01" -> "01/03/2026" (sem passar por Date, que mudaria o dia por causa do fuso)
const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : null);

// Período de realização: "01/03/2026 a 30/06/2026", "Desde 01/03/2026" ou "Até 30/06/2026"
export function formatarPeriodo(inicio, fim) {
  const [i, f] = [dataBR(inicio), dataBR(fim)];
  if (i && f) return `${i} a ${f}`;
  if (i) return `Desde ${i}`;
  if (f) return `Até ${f}`;
  return null;
}

// Data de hoje no fuso do navegador, no mesmo formato da API ("2026-11-24")
function hojeISO() {
  const d = new Date();
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, '0')).join('-');
}

// Selo só para o que foge do normal: projeto que ainda vai começar ou que já terminou.
// Projetos em andamento ou sem datas não levam selo (status null).
// Strings ISO ("2026-11-24") comparam certo em ordem alfabética.
export function situacao(inicio, fim, hoje = hojeISO()) {
  if (inicio && inicio > hoje) return { status: 'embreve', label: 'Em breve' };
  if (fim && fim < hoje) return { status: 'encerrado', label: 'Encerrado' };
  return { status: null, label: null };
}

export function toProject(p) {
  const game = isGame(p.tipo);
  const { category, tag } = game
    ? { category: 'jogo', tag: 'Jogo educativo' }
    : categoria(p.instituicao_tipo);
  return {
    id: p.id_projeto,
    title: p.titulo,
    description: p.descricao,
    category,
    tag,
    icon: ICONES[category],
    institution: p.instituicao,
    link: p.fonte_url,
    period: formatarPeriodo(p.data_inicio, p.data_fim),
    ...situacao(p.data_inicio, p.data_fim),
    verifiedAt: p.verificado_em,
    linkLabel: game ? 'Acessar jogo' : 'Saiba mais',
  };
}

// Jogo da separação do próprio RecycleFlow (rota /jogo). Não vem do banco: é uma
// funcionalidade da plataforma, divulgada como primeira faixa da aba Projetos.
export const JOGO_RECYCLEFLOW = {
  id: 'jogo-recycleflow',
  title: 'Jogo da separação',
  // Markdown, como as descrições vindas do admin
  description: `Arraste cada material para a **lixeira certa** e descubra para onde vai cada resíduo.

- Lixeiras nas cores da coleta seletiva e o ecoponto
- Dica de descarte a cada jogada
- Pontuação e sequência de acertos`,
  category: 'jogo',
  tag: 'Jogo educativo',
  icon: '/assets/icon-game.svg',
  institution: 'RecycleFlow',
  to: '/jogo', // link interno: abre na mesma aba
  linkLabel: 'Jogar agora',
  period: null,
  status: null,
  label: null,
  verifiedAt: null,
};
