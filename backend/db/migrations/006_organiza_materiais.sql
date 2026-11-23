-- ============================================================================
-- RECYCLEFLOW | Migracao 006 - Organiza materiais e categorias
-- Pode ser executada mais de uma vez.
--
-- O que faz:
--   1. Une materiais duplicados ("Eletronicos" -> "Eletronicos pequenos";
--      "Madeira" (registro de teste) -> "Madeira e MDF"), movendo pontos,
--      conteudos e palavras-chave para o material que fica.
--   2. Reorganiza categorias: une as duas de eletroeletronicos, cria a de oleos,
--      move materiais para a categoria certa e remove categorias [DEMO] vazias.
--   3. Padroniza material.tipo_descarte numa lista fixa (com CHECK).
--   4. Adiciona material.destaque (lista "Mais comuns" da pagina de materiais).
--
-- ATENCAO: depois desta migracao, reexecutar a 001 falha no CHECK de
-- tipo_descarte (ela usa os valores antigos 'especial'/'coleta_seletiva').
-- Em banco novo, rode 001 -> ... -> 006 na ordem, como de costume.
-- ============================================================================
\set ON_ERROR_STOP on
BEGIN;

-- ---------------------------------------------------------------- 1. Duplicados
DO $$
DECLARE
    pares TEXT[][] := ARRAY[
        ARRAY['Eletrônicos', 'Eletrônicos pequenos'],
        ARRAY['Madeira', 'Madeira e MDF']
    ];
    par TEXT[];
    id_sai BIGINT;
    id_fica BIGINT;
BEGIN
    FOREACH par SLICE 1 IN ARRAY pares LOOP
        SELECT id_material INTO id_sai FROM material WHERE lower(nome) = lower(par[1]);
        SELECT id_material INTO id_fica FROM material WHERE lower(nome) = lower(par[2]);
        CONTINUE WHEN id_sai IS NULL OR id_fica IS NULL;

        INSERT INTO ponto_material (id_ponto, id_material, observacoes, verificado_em)
        SELECT id_ponto, id_fica, observacoes, verificado_em
        FROM ponto_material WHERE id_material = id_sai
        ON CONFLICT DO NOTHING;

        INSERT INTO material_conteudo (id_material, id_conteudo)
        SELECT id_fica, id_conteudo FROM material_conteudo WHERE id_material = id_sai
        ON CONFLICT DO NOTHING;

        UPDATE material SET palavras_chave = ARRAY(
            SELECT DISTINCT lower(p) FROM unnest(
                (SELECT palavras_chave FROM material WHERE id_material = id_fica) ||
                (SELECT palavras_chave FROM material WHERE id_material = id_sai)
            ) AS p ORDER BY 1
        )
        WHERE id_material = id_fica;

        DELETE FROM ponto_material WHERE id_material = id_sai;
        DELETE FROM material WHERE id_material = id_sai;  -- material_conteudo: CASCADE
    END LOOP;
END $$;

-- -------------------------------------------------------------- 2. Categorias
-- Une "Eletroeletrônicos" (sem cor/ícone) em "Resíduos eletroeletrônicos" e renomeia.
UPDATE material SET id_categoria = (SELECT id_categoria FROM categoria_material WHERE nome = 'Resíduos eletroeletrônicos')
WHERE id_categoria = (SELECT id_categoria FROM categoria_material WHERE nome = 'Eletroeletrônicos')
  AND EXISTS (SELECT 1 FROM categoria_material WHERE nome = 'Resíduos eletroeletrônicos');
DELETE FROM categoria_material c
WHERE c.nome = 'Eletroeletrônicos'
  AND EXISTS (SELECT 1 FROM categoria_material WHERE nome = 'Resíduos eletroeletrônicos')
  AND NOT EXISTS (SELECT 1 FROM material m WHERE m.id_categoria = c.id_categoria);
UPDATE categoria_material SET nome = 'Eletroeletrônicos' WHERE nome = 'Resíduos eletroeletrônicos';

-- "Resíduos oleosos" (vazia) vira a categoria dos óleos de cozinha.
UPDATE categoria_material SET nome = 'Óleos e gorduras', descricao = 'Óleo de cozinha usado e gordura animal.'
WHERE nome = 'Resíduos oleosos';
INSERT INTO categoria_material (nome, descricao)
SELECT 'Óleos e gorduras', 'Óleo de cozinha usado e gordura animal.'
WHERE NOT EXISTS (SELECT 1 FROM categoria_material WHERE lower(nome) = lower('Óleos e gorduras'));

-- Materiais que mudam de categoria
UPDATE material m SET id_categoria = c.id_categoria
FROM (VALUES
    ('Óleo de cozinha', 'Óleos e gorduras'),
    ('Óleo e gordura animal (banha)', 'Óleos e gorduras'),
    ('Seringas e agulhas', 'Resíduos de saúde'),
    ('Baterias de celular e notebook (lítio)', 'Eletroeletrônicos'),
    ('Podas e galhos', 'Orgânicos')
) AS v(material, categoria)
JOIN categoria_material c ON c.nome = v.categoria
WHERE m.nome = v.material;

-- Cor e ícone de cada categoria (usados nos filtros)
UPDATE categoria_material c SET cor_hex = v.cor, icone = v.icone
FROM (VALUES
    ('Recicláveis secos',            '#2563EB', 'recycle'),
    ('Eletroeletrônicos',            '#7C3AED', 'battery'),
    ('Resíduos perigosos',           '#EA580C', 'alert'),
    ('Volumosos e construção civil', '#92400E', 'sofa'),
    ('Rejeitos',                     '#6B7280', 'trash'),
    ('Óleos e gorduras',             '#CA8A04', 'droplet'),
    ('Orgânicos',                    '#16A34A', 'leaf'),
    ('Resíduos de saúde',            '#DC2626', 'pill'),
    ('Reaproveitáveis',              '#0891B2', 'shirt')
) AS v(nome, cor, icone)
WHERE c.nome = v.nome;

-- Categorias [DEMO] do seed, só se estiverem vazias
DELETE FROM categoria_material c
WHERE c.nome LIKE '[DEMO]%'
  AND NOT EXISTS (SELECT 1 FROM material m WHERE m.id_categoria = c.id_categoria);

-- ------------------------------------------------------- 3. Tipo de descarte
-- Casos específicos primeiro (eram "especial" ou "Ponto de coleta")
UPDATE material SET tipo_descarte = 'Logística reversa'
WHERE nome IN ('Pilhas e baterias', 'Medicamentos') AND tipo_descarte = 'especial';
UPDATE material SET tipo_descarte = 'Ecoponto'
WHERE nome IN ('Óleo de cozinha', 'Óleo e gordura animal (banha)') AND tipo_descarte = 'Ponto de coleta';

UPDATE material SET tipo_descarte = CASE
    WHEN lower(tipo_descarte) IN ('coleta seletiva', 'coleta_seletiva') THEN 'Coleta seletiva'
    WHEN lower(tipo_descarte) IN ('ecoponto', 'joga na caçamba') THEN 'Ecoponto'
    WHEN lower(tipo_descarte) = 'logística reversa' THEN 'Logística reversa'
    WHEN lower(tipo_descarte) IN ('especial', 'ponto específico', 'ponto de coleta') THEN 'Ponto de coleta específico'
    WHEN lower(tipo_descarte) LIKE 'lixo comum%' THEN 'Lixo comum'
    WHEN lower(tipo_descarte) LIKE 'compostagem%' THEN 'Compostagem'
    WHEN lower(tipo_descarte) LIKE 'doação%' THEN 'Doação'
    ELSE tipo_descarte
END;

ALTER TABLE material DROP CONSTRAINT IF EXISTS ck_material_tipo_descarte_lista;
ALTER TABLE material ADD CONSTRAINT ck_material_tipo_descarte_lista CHECK (tipo_descarte IN (
    'Coleta seletiva', 'Ecoponto', 'Logística reversa', 'Ponto de coleta específico',
    'Lixo comum', 'Compostagem', 'Doação'
));

-- --------------------------------------------------------------- 4. Destaque
ALTER TABLE material ADD COLUMN IF NOT EXISTS destaque BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE material SET destaque = TRUE
WHERE nome IN (
    'Pilhas e baterias', 'Óleo de cozinha', 'Garrafas PET', 'Vidro',
    'Papel e papelão', 'Eletrônicos pequenos', 'Medicamentos', 'Lâmpadas fluorescentes'
)
AND NOT EXISTS (SELECT 1 FROM material WHERE destaque);  -- não sobrescreve escolhas feitas no admin

COMMIT;
