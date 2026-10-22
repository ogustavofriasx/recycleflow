// Dados mockados — serão substituídos pela API / Leaflet + OpenStreetMap.
export const points = [
  {
    id: 'cervezao',
    name: 'Ecoponto Cervezão',
    address: 'Rua 6A, Av. M21',
    fullAddress: 'Rua 6A, Av M21 - Jardins',
    distance: '1,2 km',
    type: 'ecoponto',
    hours: '09:00 às 19:00',
    materials: ['pilha', 'papel', 'metal'],
    materialsLabel: 'pilhas, papéis, metais e ferragens',
  },
  {
    id: 'jardim-sao-paulo',
    name: 'Ecoponto Jardim São Paulo',
    address: 'Rua 1A',
    fullAddress: 'Rua 1A - Jardim São Paulo',
    distance: '2,8 km',
    type: 'ecoponto',
    hours: '08:00 às 17:00',
    materials: ['pilha', 'vidro', 'eletronico', 'oleo'],
    materialsLabel: 'pilhas, vidros, eletrônicos e óleo',
  },
  {
    id: 'cooperviva',
    name: 'CooperViva',
    address: 'Cooperativa de catadores',
    fullAddress: 'Cooperativa de catadores',
    distance: '3,4 km',
    type: 'cooperativa',
    hours: '07:00 às 16:00',
    materials: ['pilha', 'papel', 'vidro', 'metal'],
    materialsLabel: 'papéis, plásticos, vidros e metais',
  },
  {
    id: 'jardim-figueira',
    name: 'Ecoponto Jardim Figueira',
    address: 'Av, 54, em frente aà Rua 27',
    fullAddress: 'Av. 54, em frente à Rua 27',
    distance: '850 m',
    type: 'ecoponto',
    hours: '09:00 às 18:00',
    materials: ['eletronico', 'medicamento', 'oleo'],
    materialsLabel: 'eletrônicos, medicamentos e óleo',
    mapOnly: true,
  },
];

// Opções dos chips da tela do Mapa (value precisa bater com o `type` do ponto)
export const pointTypeFilters = [
  { value: 'todos', label: 'Todos' },
  { value: 'ecoponto', label: 'Ecopontos' },
  { value: 'cooperativa', label: 'Cooperativas' },
];
