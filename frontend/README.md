# RecycleFlow — Frontend

Frontend em **React + Vite** das telas do protótipo do Figma
([RecycleFlow - Protótipo](https://www.figma.com/design/FTk0HEUXwAari69dVOr0dK/RecycleFlow---Prot%C3%B3tipo)).

> Etapa 1: apenas telas e UX. O mapa interativo (Leaflet + OpenStreetMap) entra na próxima etapa —
> por enquanto a tela de Mapa tem só a lista de pontos e uma área reservada (`MapPlaceholder`).

## Como rodar

```bash
npm install          # requer Node 20.19+ ou 22.12+
npm run assets   # baixa imagens e ícones do Figma para public/assets (rodar uma vez)
npm run dev      # http://localhost:5173
```

`npm run assets` usa URLs temporárias do Figma (válidas até ~22/10/2026). Se expirarem,
re-exporte os assets do Figma e salve com os mesmos nomes em `public/assets/`
(a lista está em `scripts/download-assets.mjs`).

## Rotas

| Rota          | Tela Figma               |
|---------------|--------------------------|
| `/`           | 01 - Home                |
| `/projetos`   | 02 - Institucional       |
| `/materiais`  | 03 - Busca de Material   |
| `/mapa`       | 04 - Mapa (+ menu_flutuante) |

## Estrutura

```
src/
  components/   Navbar, Footer, Button, ChipGroup, SearchInput,
                PointItem, PointPopup, MapPlaceholder (+ .module.css)
  pages/        Home, Materials, MapPage, Projects
  data/         points, materials, projects, home (dados mockados)
  styles/       tokens.css (variáveis do Figma), global.css
public/assets/  imagens e ícones exportados do Figma
scripts/        download-assets.mjs
```

Estilo: CSS Modules + variáveis CSS (`tokens.css`) com os tokens do Figma. Fonte Inter (Google Fonts).

## Interações implementadas

- Navegação entre telas (React Router), com link ativo na navbar.
- **Busca de material**: chips selecionam o material; o campo de busca filtra por nome/palavra-chave
  (sem acento); lista de pontos que aceitam o material; "Ver no mapa" leva a `/mapa`.
- **Mapa**: busca por bairro/endereço, filtro Todos/Ecopontos/Cooperativas, clique em um ponto abre o
  card flutuante (`PointPopup`) sobre o mapa.
- **Projetos**: filtro por Prefeitura/Cooperativas/ONGs.

## Próxima etapa — mapa interativo

Substituir `src/components/MapPlaceholder.jsx` por um componente com `react-leaflet`
(tiles do OpenStreetMap), recebendo `points`, `selectedId` e `onSelect`, e reaproveitar
`PointPopup` como conteúdo do popup do marcador. Os pontos em `src/data/points.js` vão precisar de `lat`/`lng`.

## Observações

- Só "Pilhas e baterias" está detalhado no protótipo; os outros materiais e os dados extras dos
  pontos (horário, materiais aceitos) são conteúdo de exemplo — revisar antes de publicar.
- Materiais sem ícone no Figma mostram a inicial no lugar do ícone.
