// Cliente da API do RecycleFlow. Em dev o Vite repassa /api para o FastAPI (ver vite.config.js).
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function get(path, params = {}, signal) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  const res = await fetch(`${BASE_URL}${path}${query ? `?${query}` : ''}`, { signal });
  if (!res.ok) throw new Error(`Erro ${res.status} ao chamar ${path}`);
  return res.json();
}

// Lista materiais; `busca` filtra por nome e palavras-chave (sem acento/maiúscula)
export const buscarMateriais = (busca, signal) => get('/materiais/', { busca }, signal);

// Detalhe de um material com os pontos de coleta que o aceitam
export const obterMaterial = (id, signal) => get(`/materiais/${id}`, {}, signal);

// Pontos de coleta ativos, com coordenadas, horários e materiais aceitos.
// filtros: { material: id_material, bairro: 'Cervezão', tipo: 'Ecoponto' } (todos opcionais)
export const listarPontosColeta = (filtros = {}, signal) => get('/pontos-coleta/', filtros, signal);
