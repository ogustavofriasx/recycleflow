// Baixa as imagens/ícones exportados do Figma para public/assets.
// As URLs do Figma MCP são temporárias (expiram ~7 dias após a geração: 15/10/2026).
// Uso: npm run assets
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://www.figma.com/api/mcp/asset/';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');

const assets = {
  // Navbar / geral
  'logo.png': '5f4246a5-689e-4888-9011-197368ab3024.png',
  'leaf.svg': 'a9cffda2-c065-4889-95cd-37b69cf587b5.svg',
  // Home
  'hero-bg.png': '7b13b529-11aa-4b2c-b6bf-081a486cdb2a.png',
  'map-preview.png': 'e68f20bb-4767-4efa-8e85-b51df5c23aea.png',
  'icon-search-white.svg': 'f30d5eb3-b643-4ecf-91c9-b10777b19f72.svg',
  'icon-pin-white.svg': '0965b7a6-9610-47c4-9be7-95b97b7304cd.svg',
  'icon-chat-white.svg': 'a2ff4164-921e-4446-aaa5-794957e2eae9.svg',
  'icon-pin.svg': '1b5d96d2-2fdc-4807-ac02-b8c25c3f2d29.svg',
  'tip-drop.svg': '44a99df7-3f81-45c9-bed6-c21630178171.svg',
  'tip-battery.svg': 'e402ee20-c506-4082-94ee-90c50b43028b.svg',
  'tip-recycle.svg': '7a75318a-67fe-4db1-a718-6bd283acddc0.svg',
  // Projetos
  'proj-recycle.svg': '3c26a5b1-3362-4b11-a52f-2d332e6fb48a.svg',
  'proj-user.svg': '11ddf716-f814-4b5e-89c6-2091e5fe207f.svg',
  'proj-leaf.svg': '6315cd1c-aecd-41e3-b902-0628c5559207.svg',
  'proj-pin.svg': '4a421d4f-2c20-43b2-82ea-7417095d0433.svg',
  'proj-chat.svg': 'b9ed1d54-7472-427c-97e0-7694c677fd7d.svg',
  'proj-route.svg': 'e0852c2e-9ae4-427c-a85d-5da659d24c2d.svg',
  'chevron.svg': '746c3d3f-76e7-4f05-bfa2-36f8d0bddcd9.svg',
  // Busca de material
  'search-bg.png': 'a004503d-f286-4191-9b40-212bba90e6b1.png',
  'icon-search.svg': '09673d0f-7ed4-4a22-8dcd-6ca63b330314.svg',
  'icon-battery-white.svg': 'cafc829d-3d3c-426f-ac15-f9f91796f6a7.svg',
  'icon-check.svg': 'aa8056c5-9a6d-4bd2-8217-9d331b676245.svg',
  'icon-pin-sm.svg': '15845eff-40a3-4f94-a472-fa43a225a658.svg',
  'icon-pin-white-sm.svg': '79772709-6d76-4675-bd2b-344db64bfce4.svg',
  // Mapa
  'popup-pin.svg': '824ae53b-d9bb-4916-aafe-02dc48e5cae9.svg',
};

await mkdir(OUT, { recursive: true });
let ok = 0;
for (const [name, id] of Object.entries(assets)) {
  try {
    const res = await fetch(BASE + id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) throw new Error('arquivo vazio');
    await writeFile(join(OUT, name), buf);
    console.log(`✔ ${name} (${buf.length} bytes)`);
    ok++;
  } catch (err) {
    console.error(`✘ ${name}: ${err.message}`);
  }
}
console.log(`\n${ok}/${Object.keys(assets).length} assets salvos em public/assets`);
if (ok < Object.keys(assets).length) process.exitCode = 1;
