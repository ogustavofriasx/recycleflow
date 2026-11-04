-- ============================================================================
-- RECYCLEFLOW | Migracao 001 - Busca de materiais
-- Executar APOS schema.sql (e, opcionalmente, seed.sql).
-- Pode ser executada mais de uma vez: nao duplica registros.
--
-- O que faz:
--   1. Habilita a extensao unaccent (busca sem acento: "oleo" acha "Óleo").
--   2. Adiciona material.palavras_chave (sinonimos: "bateria" acha "Pilhas").
--   3. Insere os 6 materiais que estavam fixos no frontend (data/materials.js).
--
-- Mapeamento dos campos da tela "Buscar material":
--   Descarte  -> material.cuidados
--   Preparo   -> material.instrucoes_preparo
--   Categoria -> categoria_material.nome
--   Por quê?  -> material.descricao
--
-- ATENCAO: textos vieram do prototipo e ainda NAO foram conferidos com fontes
-- oficiais (fonte_url e verificado_em ficam NULL ate a validacao - etapa 6).
-- ============================================================================
\set ON_ERROR_STOP on
BEGIN;

CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE material
    ADD COLUMN IF NOT EXISTS palavras_chave TEXT[] NOT NULL DEFAULT '{}';

-- Categorias usadas pelos materiais do prototipo
INSERT INTO categoria_material (nome, descricao, cor_hex, icone) VALUES
('Resíduos eletroeletrônicos', 'Pilhas, baterias e equipamentos eletrônicos.', '#7C3AED', 'battery'),
('Recicláveis secos', 'Papel, plástico, vidro e metal limpos.', '#2563EB', 'recycle'),
('Resíduos oleosos', 'Óleos de cozinha usados.', '#EAB308', 'droplet'),
('Resíduos de saúde', 'Medicamentos e materiais de saúde.', '#DC2626', 'pill')
ON CONFLICT DO NOTHING;

INSERT INTO material
(id_categoria, nome, descricao, reciclavel, tipo_descarte, instrucoes_preparo, cuidados, palavras_chave)
SELECT c.id_categoria, v.nome, v.porque, v.reciclavel, v.tipo_descarte, v.preparo, v.descarte, v.palavras
FROM (VALUES
 ('Resíduos eletroeletrônicos', 'Pilhas e baterias', TRUE, 'especial',
  'Especial — não deve ser jogado no lixo comum, procure um ponto de coleta específico.',
  'Não é necessário limpar ou desmontar antes de descartar.',
  'Contêm metais pesados que contaminam o solo e a água quando descartados incorretamente.',
  ARRAY['pilha', 'pilhas', 'bateria', 'baterias']),
 ('Recicláveis secos', 'Vidro', TRUE, 'coleta_seletiva',
  'Coleta seletiva — contêiner verde ou ecoponto.',
  'Lave e retire tampas. Embrulhe cacos em jornal antes de descartar.',
  'O vidro é 100% reciclável e pode ser reaproveitado infinitas vezes.',
  ARRAY['vidro', 'garrafa', 'pote', 'frasco']),
 ('Resíduos oleosos', 'Óleo de cozinha', TRUE, 'especial',
  'Especial — nunca descarte na pia ou no ralo.',
  'Espere esfriar, coe e armazene em garrafa PET bem fechada.',
  '1 litro de óleo pode contaminar até 1 milhão de litros de água.',
  ARRAY['óleo', 'oleo', 'cozinha', 'fritura']),
 ('Resíduos eletroeletrônicos', 'Eletrônicos', TRUE, 'especial',
  'Especial — leve a um ecoponto ou ponto de logística reversa.',
  'Apague seus dados pessoais e, se possível, retire pilhas e baterias.',
  'Possuem componentes tóxicos e metais valiosos que podem ser recuperados.',
  ARRAY['eletrônico', 'celular', 'computador', 'cabo', 'carregador']),
 ('Resíduos de saúde', 'Medicamentos', FALSE, 'especial',
  'Especial — devolva em farmácias ou postos de saúde com coletor.',
  'Mantenha na embalagem original; caixas de papel vão para a coleta seletiva.',
  'Substâncias químicas contaminam rios e o solo quando descartadas no lixo comum.',
  ARRAY['medicamento', 'remédio', 'comprimido']),
 ('Recicláveis secos', 'Papel e papelão', TRUE, 'coleta_seletiva',
  'Coleta seletiva — contêiner azul ou ecoponto.',
  'Mantenha seco e limpo; desmonte as caixas para ocupar menos espaço.',
  'Reciclar papel reduz o corte de árvores e o consumo de água e energia.',
  ARRAY['papel', 'papelão', 'caixa', 'jornal', 'revista'])
) v(categoria, nome, reciclavel, tipo_descarte, descarte, preparo, porque, palavras)
JOIN categoria_material c ON c.nome = v.categoria
ON CONFLICT DO NOTHING;

COMMIT;

SELECT id_material, nome, palavras_chave FROM material
WHERE nome NOT LIKE '[DEMO]%' ORDER BY id_material;
