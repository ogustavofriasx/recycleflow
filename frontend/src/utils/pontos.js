// Converte o ponto da API (/pontos-coleta) para o formato usado por PointItem, PointPopup e MapView.

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
// Ordem de exibição: segunda a domingo
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// "Seg a Sex 07:00–18:00 · Sáb 07:00–17:00 · Dom 07:00–12:00"
export function formatarHorarios(horarios) {
  if (!horarios?.length) return null;
  const porDia = new Map();
  horarios.forEach((h) => {
    const faixa = `${h.abertura}–${h.fechamento}`;
    porDia.set(h.dia_semana, porDia.has(h.dia_semana) ? `${porDia.get(h.dia_semana)}, ${faixa}` : faixa);
  });

  // Junta dias seguidos com a mesma faixa de horário
  const grupos = [];
  ORDEM.forEach((dia) => {
    const faixa = porDia.get(dia);
    if (!faixa) return;
    const ultimo = grupos[grupos.length - 1];
    const anterior = ultimo && ORDEM[ORDEM.indexOf(ultimo.fim) + 1] === dia;
    if (ultimo && anterior && ultimo.faixa === faixa) ultimo.fim = dia;
    else grupos.push({ inicio: dia, fim: dia, faixa });
  });

  return grupos
    .map((g) => `${DIAS[g.inicio]}${g.inicio !== g.fim ? ` a ${DIAS[g.fim]}` : ''} ${g.faixa}`)
    .join(' · ');
}

// 850 -> "850 m"; 2340 -> "2,3 km"
export function formatarDistancia(metros) {
  if (metros == null) return '';
  if (metros < 1000) return `${Math.round(metros / 10) * 10} m`;
  return `${(metros / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

export function toPoint(p) {
  const rua = [p.logradouro, p.numero].filter(Boolean).join(', ');
  const temCoordenada = p.latitude != null && p.longitude != null;
  return {
    id: p.id_ponto,
    name: p.nome,
    type: slug(p.tipo), // "Ecoponto" -> "ecoponto", bate com os chips de pointTypeFilters
    typeLabel: p.tipo,
    address: [rua, p.bairro].filter(Boolean).join(' - '),
    fullAddress: [rua, p.complemento, p.bairro].filter(Boolean).join(' - '),
    bairro: p.bairro,
    distance: formatarDistancia(p.distancia_m), // só vem quando a consulta tem lat/lng
    hours: formatarHorarios(p.horarios) ?? p.horario_descricao ?? 'Não informado',
    hoursNote: p.horario_descricao,
    materialsLabel: p.materiais.length ? p.materiais.map((m) => m.nome).join(', ') : 'Não informado',
    materialIds: p.materiais.map((m) => m.id_material),
    position: temCoordenada ? [p.latitude, p.longitude] : null,
    isDemo: p.nome.startsWith('[DEMO]'),
  };
}
