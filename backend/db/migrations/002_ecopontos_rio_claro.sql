-- ============================================================================
-- RECYCLEFLOW | Migracao 002 - Ecopontos de Rio Claro (6 ecopontos, dados reais)
-- Executar APOS 001_busca_materiais.sql. Pode ser executada mais de uma vez.
--
-- Fontes (enderecos descritos como referencia, sem numero):
--   [1] Diario do Rio Claro, 10/01/2023 - "Rio Claro amplia quantidade de ecopontos"
--       https://www.j1diario.com.br/rio-claro-amplia-quantidade-de-ecopontos/
--   [2] Jornal Cidade RC, 03/01/2024 - "Rio Claro ganha ecoponto no acesso a Estrada do Sobrado"
--       https://www.jornalcidade.net/rc/rio-claro-ganha-ecoponto-no-acesso-a-estrada-do-sobrado/255142/
--   [3] Encontra Rio Claro, 08/07/2026 - horarios dos ecopontos no feriado
--       https://www.encontrarioclaro.com/coleta-de-lixo-sera-normal-no-feriado-em-rio-claro-veja-o-que-abre-e-fecha/
--
-- PENDENCIAS (verificado_em fica NULL ate alguem conferir):
--   * COORDENADAS: Jardim das Palmeiras, Cervezao e Sao Miguel vem do OpenStreetMap;
--     Jardim Sao Paulo, Inocoop/Guanabara e Jardim Figueira foram informadas pela equipe.
--   * Enderecos dos 6 ecopontos conferidos pela equipe em 11/2026.
--   * Horarios: [1] (2023) dizia seg-sex 8h-20h; [3] (2026) indica 7h-18h em dia util,
--     7h-17h sabado e 7h-12h domingo/feriado. Usamos os de 2026 - confirmar.
-- ============================================================================
\set ON_ERROR_STOP on
BEGIN;

INSERT INTO tipo_ponto_coleta (nome, descricao) VALUES
('Ecoponto', 'Local público de entrega voluntária de resíduos mantido pela Prefeitura.'),
('Cooperativa', 'Cooperativa ou associação de catadores de materiais recicláveis.')
ON CONFLICT DO NOTHING;

INSERT INTO instituicao (nome, tipo, descricao, site_url)
SELECT 'Prefeitura Municipal de Rio Claro', 'Poder público',
       'Responsável pela rede municipal de ecopontos.', 'https://rioclaro.sp.gov.br'
WHERE NOT EXISTS (SELECT 1 FROM instituicao WHERE nome = 'Prefeitura Municipal de Rio Claro');

INSERT INTO ponto_coleta
(id_tipo, id_instituicao, nome, logradouro, complemento, bairro, cidade, estado,
 horario_descricao, observacoes, fonte_url, ativo)
SELECT t.id_tipo, i.id_instituicao, v.nome, v.logradouro, v.complemento, v.bairro,
       'Rio Claro', 'SP',
       'Feriados: 7h às 12h. Horários a confirmar com a Prefeitura.',
       'Recebe até 1 m³ de entulho e podas, móveis, eletrodomésticos, colchões, '
       || 'pilhas, lâmpadas, óleo de cozinha e recicláveis. Não recebe lixo orgânico, '
       || 'hospitalar ou de empresas.',
       v.fonte, TRUE
FROM (VALUES
 ('Ecoponto Cervezão', 'Rua 6-A', 'Perto da rotatória do Cervezão', 'Cervezão',
  'https://www.jornalcidade.net/rc/rio-claro-ganha-ecoponto-no-acesso-a-estrada-do-sobrado/255142/'),
 ('Ecoponto Jardim São Paulo', 'Rua 1', NULL, 'Jardim São Paulo',
  'https://www.jornalcidade.net/rc/rio-claro-ganha-ecoponto-no-acesso-a-estrada-do-sobrado/255142/'),
 ('Ecoponto São Miguel', 'Anel viário', 'Perto da Avenida 62-A', 'São Miguel',
  'https://www.jornalcidade.net/rc/rio-claro-ganha-ecoponto-no-acesso-a-estrada-do-sobrado/255142/'),
 ('Ecoponto Inocoop/Guanabara', 'Avenida Tancredo Neves', NULL, 'Inocoop/Guanabara',
  'https://www.jornalcidade.net/rc/rio-claro-ganha-ecoponto-no-acesso-a-estrada-do-sobrado/255142/'),
 ('Ecoponto Jardim Figueira', 'Avenida 54', 'Em frente à Rua 14', 'Jardim Figueira',
  'https://www.jornalcidade.net/rc/rio-claro-ganha-ecoponto-no-acesso-a-estrada-do-sobrado/255142/'),
 ('Ecoponto Jardim das Palmeiras', 'Avenida 3-JP', NULL, 'Jardim das Palmeiras',
  'https://www.jornalcidade.net/rc/rio-claro-ganha-ecoponto-no-acesso-a-estrada-do-sobrado/255142/')
) v(nome, logradouro, complemento, bairro, fonte)
JOIN tipo_ponto_coleta t ON t.nome = 'Ecoponto'
JOIN instituicao i ON i.nome = 'Prefeitura Municipal de Rio Claro'
WHERE NOT EXISTS (SELECT 1 FROM ponto_coleta p WHERE p.nome = v.nome);

-- Horarios (0 = domingo ... 6 = sabado): seg-sex 7h-18h, sab 7h-17h, dom 7h-12h
INSERT INTO horario_ponto (id_ponto, dia_semana, hora_abertura, hora_fechamento)
SELECT p.id_ponto, h.dia, h.abre::time, h.fecha::time
FROM ponto_coleta p
CROSS JOIN (VALUES
 (1, '07:00', '18:00'), (2, '07:00', '18:00'), (3, '07:00', '18:00'),
 (4, '07:00', '18:00'), (5, '07:00', '18:00'),
 (6, '07:00', '17:00'), (0, '07:00', '12:00')
) h(dia, abre, fecha)
WHERE p.nome LIKE 'Ecoponto %'
ON CONFLICT DO NOTHING;

-- Materiais aceitos, segundo [1]: pilhas, reciclaveis, oleo, eletrodomesticos.
-- Medicamentos NAO sao citados, entao nao foram associados.
INSERT INTO ponto_material (id_ponto, id_material)
SELECT p.id_ponto, m.id_material
FROM ponto_coleta p
JOIN material m ON m.nome IN
  ('Pilhas e baterias', 'Óleo de cozinha', 'Papel e papelão', 'Vidro', 'Eletrônicos')
WHERE p.nome LIKE 'Ecoponto %'
ON CONFLICT DO NOTHING;

-- Coordenadas dos ecopontos que ja estao mapeados no OpenStreetMap (consulta Nominatim, 11/2026).
-- ST_MakePoint recebe (LONGITUDE, LATITUDE).
UPDATE ponto_coleta SET localizacao = ST_SetSRID(ST_MakePoint(-47.5890369, -22.4305903), 4326)::geography
WHERE nome = 'Ecoponto Jardim das Palmeiras';   -- OSM way 1330754708 "Ecoponto Jardim das Palmeiras"
UPDATE ponto_coleta SET localizacao = ST_SetSRID(ST_MakePoint(-47.5731666, -22.3860822), 4326)::geography
WHERE nome = 'Ecoponto Cervezão';               -- OSM way 1330760895 "Ecoponto Jardim Cheverzon"
UPDATE ponto_coleta SET localizacao = ST_SetSRID(ST_MakePoint(-47.5425245, -22.3864037), 4326)::geography
WHERE nome = 'Ecoponto São Miguel';             -- OSM way 945645469 "Ecoponto São Miguel"

-- Coordenadas informadas pela equipe (11/2026)
UPDATE ponto_coleta SET localizacao = ST_SetSRID(ST_MakePoint(-47.575946418604545, -22.40157253018825), 4326)::geography
WHERE nome = 'Ecoponto Jardim São Paulo';
UPDATE ponto_coleta SET localizacao = ST_SetSRID(ST_MakePoint(-47.57274239162143, -22.437023996294165), 4326)::geography
WHERE nome = 'Ecoponto Inocoop/Guanabara';
UPDATE ponto_coleta SET localizacao = ST_SetSRID(ST_MakePoint(-47.59382250511343, -22.394666284440436), 4326)::geography
WHERE nome = 'Ecoponto Jardim Figueira';

COMMIT;

SELECT p.id_ponto, p.nome, p.logradouro,
       p.localizacao IS NOT NULL AS tem_coordenada,
       (SELECT count(*) FROM ponto_material pm WHERE pm.id_ponto = p.id_ponto) AS materiais
FROM ponto_coleta p WHERE p.nome LIKE 'Ecoponto %' ORDER BY p.nome;
